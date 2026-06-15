class EmailModel {
  final String id;
  final String sender;
  final String senderName;
  final String recipient;
  final String subject;
  final String body;
  final int timestamp; // Unix timestamp in milliseconds
  final bool isUnread;
  final bool isStarred;
  final List<String> labels;

  EmailModel({
    required this.id,
    required this.sender,
    required this.senderName,
    required this.recipient,
    required this.subject,
    required this.body,
    required this.timestamp,
    required this.isUnread,
    required this.isStarred,
    required this.labels,
  });

  // Convert an EmailModel object into a Map (JSON) to save to local Hive box
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sender': sender,
      'senderName': senderName,
      'recipient': recipient,
      'subject': subject,
      'body': body,
      'timestamp': timestamp,
      'isUnread': isUnread,
      'isStarred': isStarred,
      'labels': labels,
    };
  }

  // Convert a Map (JSON) read from Hive back into an EmailModel object
  factory EmailModel.fromMap(Map<String, dynamic> map) {
    return EmailModel(
      id: map['id'] ?? '',
      sender: map['sender'] ?? '',
      senderName: map['senderName'] ?? '',
      recipient: map['recipient'] ?? '',
      subject: map['subject'] ?? '',
      body: map['body'] ?? '',
      timestamp: map['timestamp'] ?? 0,
      isUnread: map['isUnread'] ?? true,
      isStarred: map['isStarred'] ?? false,
      labels: List<String>.from(map['labels'] ?? []),
    );
  }
}
