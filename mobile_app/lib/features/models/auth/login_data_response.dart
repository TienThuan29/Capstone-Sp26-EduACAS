import 'user_profile.dart';

class LoginDataResponse {
  final UserProfile userProfile;
  final String accessToken;
  final String refreshToken;
  final bool firstLogin;

  LoginDataResponse({
    required this.userProfile,
    required this.accessToken,
    required this.refreshToken,
    this.firstLogin = false,
  });

  factory LoginDataResponse.fromJson(Map<String, dynamic> json) {
    return LoginDataResponse(
      userProfile: UserProfile.fromJson(json['userProfile'] ?? {}),
      accessToken: json['accessToken'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
      firstLogin: json['firstLogin'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userProfile': userProfile.toJson(),
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'firstLogin': firstLogin,
    };
  }
}
