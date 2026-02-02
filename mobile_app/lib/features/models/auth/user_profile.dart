class UserProfile {
  final String id;
  final String roleNumber;
  final String email;
  final String fullname;
  final String avatarUrl;
  final String? birthday;
  final String role;
  final bool firstLogin;
  final bool isEnable;
  final String? lastLoginDate;
  final String createdDate;
  final String updatedDate;

  UserProfile({
    required this.id,
    required this.roleNumber,
    required this.email,
    required this.fullname,
    required this.avatarUrl,
    this.birthday,
    required this.role,
    required this.firstLogin,
    required this.isEnable,
    this.lastLoginDate,
    required this.createdDate,
    required this.updatedDate,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      roleNumber: json['roleNumber'] ?? '',
      email: json['email'] ?? '',
      fullname: json['fullname'] ?? '',
      avatarUrl: json['avatarUrl'] ?? '',
      birthday: json['birthday'],
      role: json['role'] ?? '',
      firstLogin: json['firstLogin'] ?? false,
      isEnable: json['isEnable'] ?? false,
      lastLoginDate: json['lastLoginDate'],
      createdDate: json['createdDate'] ?? '',
      updatedDate: json['updatedDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'roleNumber': roleNumber,
      'email': email,
      'fullname': fullname,
      'avatarUrl': avatarUrl,
      'birthday': birthday,
      'role': role,
      'firstLogin': firstLogin,
      'isEnable': isEnable,
      'lastLoginDate': lastLoginDate,
      'createdDate': createdDate,
      'updatedDate': updatedDate,
    };
  }
}
