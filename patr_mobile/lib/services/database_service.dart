import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/email_model.dart';
import 'dart:async';

class DatabaseService {
  bool get _isFirebaseAvailable {
    try {
      return Firebase.apps.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  FirebaseFirestore get _firestore => FirebaseFirestore.instance;
  final _emailsBox = Hive.box('emails_cache');
  
  // Stream subscriptions mapped by user ID to avoid duplicate listeners
  final Map<String, StreamSubscription> _subscriptions = {};

  // Subscribe to real-time updates for a user's mailbox and cache them in Hive
  void syncMailbox(String userId) {
    if (_subscriptions.containsKey(userId)) return;

    if (!_isFirebaseAvailable) {
      // Preview Mode: Generate mock data locally in Hive if empty
      final existing = getLocalEmails(userId);
      if (existing.isEmpty) {
        final email1 = EmailModel(
          id: 'mock_mail_1',
          sender: 'sanjay@patr.in',
          senderName: 'Sanjay Kumar',
          recipient: '$userId@patr.in',
          subject: 'Welcome to Patr Mail! 🇮🇳',
          body: 'Namaste! Welcome to Patr (पत्र) - India\'s premium and secure email platform. We are thrilled to have you onboard!',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)).millisecondsSinceEpoch,
          isUnread: true,
          isStarred: false,
          labels: ['inbox'],
        );
        final email2 = EmailModel(
          id: 'mock_mail_2',
          sender: 'support@patr.in',
          senderName: 'Patr Support',
          recipient: '$userId@patr.in',
          subject: 'Security update and offline caching',
          body: 'Hello! Your account security is our top priority. We use bank-grade security protocols. Also, your emails are cached locally so you can read them offline anytime!',
          timestamp: DateTime.now().subtract(const Duration(hours: 5)).millisecondsSinceEpoch,
          isUnread: false,
          isStarred: true,
          labels: ['inbox'],
        );
        _emailsBox.put('${userId}_${email1.id}', email1.toMap());
        _emailsBox.put('${userId}_${email2.id}', email2.toMap());
      }
      return;
    }

    // Live mode:
    final subscription = _firestore
        .collection('users')
        .doc(userId)
        .collection('mailbox')
        .snapshots()
        .listen((snapshot) {
      for (var change in snapshot.docChanges) {
        final docId = change.doc.id;
        final key = '${userId}_$docId';

        if (change.type == DocumentChangeType.removed) {
          _emailsBox.delete(key);
        } else {
          final data = change.doc.data();
          if (data != null) {
            // Save to Hive
            final email = EmailModel(
              id: docId,
              sender: data['sender'] ?? '',
              senderName: data['senderName'] ?? 'Unknown',
              recipient: data['recipient'] ?? '',
              subject: data['subject'] ?? '(No Subject)',
              body: data['body'] ?? '',
              timestamp: data['timestamp'] is Timestamp 
                  ? (data['timestamp'] as Timestamp).millisecondsSinceEpoch
                  : (data['timestamp'] ?? 0),
              isUnread: data['isUnread'] ?? true,
              isStarred: data['isStarred'] ?? false,
              labels: List<String>.from(data['labels'] ?? []),
            );
            _emailsBox.put(key, email.toMap());
          }
        }
      }
    });

    _subscriptions[userId] = subscription;
  }

  // Cancel active firestore listener (e.g. on account log out)
  void stopSyncing(String userId) {
    _subscriptions[userId]?.cancel();
    _subscriptions.remove(userId);
  }

  // Fetch emails from local Hive cache (Works Offline!)
  List<EmailModel> getLocalEmails(String userId, {String? label}) {
    final List<EmailModel> list = [];
    
    for (var key in _emailsBox.keys) {
      if (key.toString().startsWith('${userId}_')) {
        final map = Map<String, dynamic>.from(_emailsBox.get(key));
        final email = EmailModel.fromMap(map);
        
        if (label == null || email.labels.contains(label)) {
          list.add(email);
        }
      }
    }

    // Sort chronologically (newest first)
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  // Fetch unified inbox emails from ALL cached users
  List<EmailModel> getUnifiedLocalEmails(List<String> userIds) {
    final List<EmailModel> list = [];
    
    for (var key in _emailsBox.keys) {
      for (var userId in userIds) {
        if (key.toString().startsWith('${userId}_')) {
          final map = Map<String, dynamic>.from(_emailsBox.get(key));
          list.add(EmailModel.fromMap(map));
          break;
        }
      }
    }

    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  // Compose / Send a new email
  Future<void> sendEmail({
    required String senderUid,
    required String senderEmail,
    required String senderName,
    required String recipientEmail,
    required String subject,
    required String body,
  }) async {
    if (!_isFirebaseAvailable) {
      // Preview Mode: Mock send email. Save in local cache!
      final docId = 'mock_sent_${DateTime.now().millisecondsSinceEpoch}';
      final email = EmailModel(
        id: docId,
        sender: senderEmail,
        senderName: senderName,
        recipient: recipientEmail,
        subject: subject,
        body: body,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        isUnread: false,
        isStarred: false,
        labels: ['sent'],
      );
      _emailsBox.put('${senderUid}_$docId', email.toMap());

      // If the recipient is also one of our logged-in accounts, deliver it locally!
      final String recipientUsername = recipientEmail.split('@')[0];
      final settingsBox = Hive.box('settings');
      final List<dynamic>? accountsJson = settingsBox.get('cached_accounts');
      if (accountsJson != null) {
        for (var e in accountsJson) {
          final acc = Map<String, dynamic>.from(e);
          if (acc['patrAddress'] == recipientUsername) {
            final recUid = acc['uid'];
            final recEmail = EmailModel(
              id: docId,
              sender: senderEmail,
              senderName: senderName,
              recipient: recipientEmail,
              subject: subject,
              body: body,
              timestamp: DateTime.now().millisecondsSinceEpoch,
              isUnread: true,
              isStarred: false,
              labels: ['inbox'],
            );
            _emailsBox.put('${recUid}_$docId', recEmail.toMap());
          }
        }
      }
      return;
    }

    // Live mode:
    final docRef = _firestore.collection('emails').doc();
    final timestamp = FieldValue.serverTimestamp();

    final Map<String, dynamic> emailData = {
      'id': docRef.id,
      'sender': senderEmail,
      'senderName': senderName,
      'recipient': recipientEmail,
      'subject': subject,
      'body': body,
      'timestamp': timestamp,
    };

    await docRef.set(emailData);

    // Also write to sender's own "sent" mailbox folder
    final sentMailboxRef = _firestore
        .collection('users')
        .doc(senderUid)
        .collection('mailbox')
        .doc(docRef.id);

    await sentMailboxRef.set({
      'sender': senderEmail,
      'senderName': senderName,
      'recipient': recipientEmail,
      'subject': subject,
      'body': body,
      'timestamp': timestamp,
      'isUnread': false,
      'isStarred': false,
      'labels': ['sent'],
    });
  }

  // Toggle star status on an email
  Future<void> toggleStar(String userId, String emailId, bool currentVal) async {
    final key = '${userId}_$emailId';
    
    // Update local cache instantly for zero latency UX
    if (_emailsBox.containsKey(key)) {
      final map = Map<String, dynamic>.from(_emailsBox.get(key));
      map['isStarred'] = !currentVal;
      _emailsBox.put(key, map);
    }

    if (_isFirebaseAvailable) {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('mailbox')
          .doc(emailId)
          .update({'isStarred': !currentVal});
    }
  }

  // Toggle unread status on an email
  Future<void> markAsRead(String userId, String emailId) async {
    final key = '${userId}_$emailId';
    
    // Update local cache
    if (_emailsBox.containsKey(key)) {
      final map = Map<String, dynamic>.from(_emailsBox.get(key));
      map['isUnread'] = false;
      _emailsBox.put(key, map);
    }

    if (_isFirebaseAvailable) {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('mailbox')
          .doc(emailId)
          .update({'isUnread': false});
    }
  }

  // Delete an email
  Future<void> deleteEmail(String userId, String emailId) async {
    final key = '${userId}_$emailId';
    
    // Delete from local cache
    _emailsBox.delete(key);

    if (_isFirebaseAvailable) {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('mailbox')
          .doc(emailId)
          .delete();
    }
  }
}
