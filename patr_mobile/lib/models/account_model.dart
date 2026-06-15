class AccountModel {
  final String uid;
  final String patrAddress;
  final String displayName;
  final String email;
  final String? phone;

  AccountModel({
    required this.uid,
    required this.patrAddress,
    required this.displayName,
    required this.email,
    this.phone,
  });

  // Convert an AccountModel object into a Map (JSON) to save to local Hive box
  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'patrAddress': patrAddress,
      'displayName': displayName,
      'email': email,
      'phone': phone,
    };
  }

  // Convert a Map (JSON) read from Hive back into an AccountModel object
  factory AccountModel.fromMap(Map<String, dynamic> map) {
    return AccountModel(
      uid: map['uid'] ?? '',
      patrAddress: map['patrAddress'] ?? '',
      displayName: map['displayName'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'],
    );
  }
}
