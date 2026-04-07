class AuthorDisplay {
  final String fullName;
  final String? avatarUrl;

  AuthorDisplay({
    required this.fullName,
    this.avatarUrl,
  });

  factory AuthorDisplay.fromJson(Map<String, dynamic> json) {
    return AuthorDisplay(
      fullName: json['fullName'] ?? '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      };
}
