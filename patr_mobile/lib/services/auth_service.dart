import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter/foundation.dart';
import '../models/account_model.dart';

class AuthService {
  bool get _isFirebaseAvailable {
    try {
      return Firebase.apps.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  FirebaseAuth get _auth => FirebaseAuth.instance;
  FirebaseFirestore get _firestore => FirebaseFirestore.instance;

  // Active account model
  AccountModel? _currentAccount;
  AccountModel? get currentAccount => _currentAccount;

  // Get all cached accounts from local storage
  List<AccountModel> getCachedAccounts() {
    final box = Hive.box('settings');
    final List<dynamic>? accountsJson = box.get('cached_accounts');
    if (accountsJson == null) return [];
    return accountsJson.map((e) => AccountModel.fromMap(Map<String, dynamic>.from(e))).toList();
  }

  // Save accounts list to local storage
  void _saveCachedAccounts(List<AccountModel> accounts) {
    final box = Hive.box('settings');
    final List<Map<String, dynamic>> maps = accounts.map((e) => e.toMap()).toList();
    box.put('cached_accounts', maps);
  }

  // Get credentials (passwords) of cached accounts to switch instantly
  Map<String, String> _getCredentials() {
    final box = Hive.box('settings');
    final Map<dynamic, dynamic>? creds = box.get('credentials');
    if (creds == null) return {};
    return Map<String, String>.from(creds);
  }

  // Cache credentials
  void _saveCredential(String email, String password) {
    final box = Hive.box('settings');
    final Map<String, String> creds = _getCredentials();
    creds[email] = password;
    box.put('credentials', creds);
  }

  // Remove cached account credentials
  void _removeCredential(String email) {
    final box = Hive.box('settings');
    final Map<String, String> creds = _getCredentials();
    creds.remove(email);
    box.put('credentials', creds);
  }

  // On app startup, load the currently signed-in user
  Future<void> initUser() async {
    if (!_isFirebaseAvailable) {
      // Preview Mode: load the first cached account if available
      final accounts = getCachedAccounts();
      if (accounts.isNotEmpty) {
        _currentAccount = accounts.first;
      }
      return;
    }

    try {
      final User? user = _auth.currentUser;
      if (user != null) {
        final List<AccountModel> accounts = getCachedAccounts();
        final active = accounts.firstWhere(
          (element) => element.uid == user.uid,
          orElse: () => AccountModel(
            uid: user.uid,
            patrAddress: user.email?.split('@')[0] ?? 'user',
            displayName: user.displayName ?? 'User',
            email: user.email ?? '',
          ),
        );
        _currentAccount = active;
      }
    } catch (e) {
      debugPrint("Auth initUser error (Live Mode): $e");
    }
  }

  // Login a user
  Future<AccountModel> login(String patrId, String password) async {
    final String formattedPatrId = patrId.endsWith('@patr.in') ? patrId : '$patrId@patr.in';
    final String patrAddress = formattedPatrId.split('@')[0];

    if (!_isFirebaseAvailable) {
      // Preview Mode: Mock login session locally
      final account = AccountModel(
        uid: 'mock_uid_${patrAddress.toLowerCase()}',
        patrAddress: patrAddress.toLowerCase(),
        displayName: patrAddress.substring(0, 1).toUpperCase() + patrAddress.substring(1),
        email: formattedPatrId.toLowerCase(),
      );

      List<AccountModel> accounts = getCachedAccounts();
      accounts.removeWhere((element) => element.uid == account.uid);
      accounts.add(account);
      _saveCachedAccounts(accounts);
      _saveCredential(formattedPatrId.toLowerCase(), password);

      _currentAccount = account;
      return account;
    }

    // Live Firebase login:
    final UserCredential credential = await _auth.signInWithEmailAndPassword(
      email: formattedPatrId,
      password: password,
    );

    final User? user = credential.user;
    if (user == null) throw Exception('Login failed');

    // Fetch user details from Firestore
    final DocumentSnapshot userDoc = await _firestore.collection('users').doc(user.uid).get();
    
    String displayName = user.displayName ?? 'User';
    String phone = '';
    
    if (userDoc.exists) {
      final data = userDoc.data() as Map<String, dynamic>;
      displayName = data['displayName'] ?? displayName;
      phone = data['phone'] ?? '';
    }

    final account = AccountModel(
      uid: user.uid,
      patrAddress: formattedPatrId.split('@')[0],
      displayName: displayName,
      email: formattedPatrId,
      phone: phone.isNotEmpty ? phone : null,
    );

    // Cache session on device
    List<AccountModel> accounts = getCachedAccounts();
    accounts.removeWhere((element) => element.uid == account.uid);
    accounts.add(account);
    _saveCachedAccounts(accounts);
    _saveCredential(formattedPatrId, password);

    _currentAccount = account;
    return account;
  }

  // Register a new user
  Future<AccountModel> register({
    required String patrAddress, // without @patr.in
    required String displayName,
    required String phone,
    required String password,
  }) async {
    final String email = '$patrAddress@patr.in';

    if (!_isFirebaseAvailable) {
      // Preview Mode: Mock registration locally
      final account = AccountModel(
        uid: 'mock_uid_${patrAddress.toLowerCase()}',
        patrAddress: patrAddress.toLowerCase(),
        displayName: displayName,
        email: email.toLowerCase(),
        phone: phone,
      );

      List<AccountModel> accounts = getCachedAccounts();
      accounts.removeWhere((element) => element.uid == account.uid);
      accounts.add(account);
      _saveCachedAccounts(accounts);
      _saveCredential(email.toLowerCase(), password);

      _currentAccount = account;
      return account;
    }

    // Live Firebase Registration:
    // 1. Create user in Firebase Auth
    final UserCredential credential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    final User? user = credential.user;
    if (user == null) throw Exception('Auth registration failed');

    // 2. Set display name in Firebase Auth profile
    await user.updateDisplayName(displayName);

    // 3. Create document in Firestore `/users/{uid}`
    final Map<String, dynamic> userDocData = {
      'uid': user.uid,
      'displayName': displayName,
      'patrAddress': email,
      'phone': phone,
      'createdAt': FieldValue.serverTimestamp(),
    };

    await _firestore.collection('users').doc(user.uid).set(userDocData);

    final account = AccountModel(
      uid: user.uid,
      patrAddress: patrAddress,
      displayName: displayName,
      email: email,
      phone: phone,
    );

    // Cache session on device
    List<AccountModel> accounts = getCachedAccounts();
    accounts.removeWhere((element) => element.uid == account.uid);
    accounts.add(account);
    _saveCachedAccounts(accounts);
    _saveCredential(email, password);

    _currentAccount = account;
    return account;
  }

  // Switch to another cached account session instantly
  Future<void> switchAccount(String uid) async {
    final List<AccountModel> accounts = getCachedAccounts();
    final target = accounts.firstWhere((e) => e.uid == uid);
    
    final creds = _getCredentials();
    final password = creds[target.email];
    
    if (password == null) {
      throw Exception('Credentials not found for ${target.email}');
    }

    if (_isFirebaseAvailable) {
      // Direct background auth switch
      await _auth.signInWithEmailAndPassword(
        email: target.email,
        password: password,
      );
    }

    _currentAccount = target;
  }

  // Remove/Logout an account from the local list
  Future<void> removeAccount(String uid) async {
    final List<AccountModel> accounts = getCachedAccounts();
    final targetIndex = accounts.indexWhere((e) => e.uid == uid);
    
    if (targetIndex != -1) {
      final target = accounts[targetIndex];
      _removeCredential(target.email);
      accounts.removeAt(targetIndex);
      _saveCachedAccounts(accounts);

      // If we removed the currently active account, log out of Firebase
      if (_currentAccount?.uid == uid) {
        if (_isFirebaseAvailable) {
          await _auth.signOut();
        }
        if (accounts.isNotEmpty) {
          await switchAccount(accounts.first.uid);
        } else {
          _currentAccount = null;
        }
      }
    }
  }

  // Check if username is already registered (Step 1)
  Future<bool> isUsernameTaken(String patrAddress) async {
    if (!_isFirebaseAvailable) {
      // Local preview mocks
      return patrAddress.toLowerCase() == 'admin' || patrAddress.toLowerCase() == 'patr';
    }

    final email = '$patrAddress@patr.in';
    final query = await _firestore.collection('users')
        .where('patrAddress', isEqualTo: email)
        .limit(1)
        .get();
    return query.docs.isNotEmpty;
  }

  // Check if phone number is already registered (Step 2)
  Future<bool> isPhoneRegistered(String phone) async {
    if (!_isFirebaseAvailable) {
      // Local preview mocks
      return phone == '9876543210';
    }

    final query = await _firestore.collection('users')
        .where('phone', isEqualTo: phone)
        .limit(1)
        .get();
    return query.docs.isNotEmpty;
  }
}
