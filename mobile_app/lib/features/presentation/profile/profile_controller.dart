import 'package:flutter/material.dart';
import '../../models/auth/user_profile.dart';
import '../../services/auth_service.dart';
import '../../../core/storage/token_storage.dart';

class ProfileController {
  bool isLoading = false;
  String? errorMessage;
  UserProfile? userProfile;

  Future<void> fetchProfile(Function() onUpdate) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final profileMap = await AuthService.getUserProfile(token);
      if (profileMap['success'] == true && profileMap['dataResponse'] != null) {
        userProfile = UserProfile.fromJson(profileMap['dataResponse']);
      } else {
        errorMessage = profileMap['message'] ?? 'Failed to load profile';
      }
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      onUpdate();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data, Function() onUpdate) async {
    isLoading = true;
    errorMessage = null;
    onUpdate();

    try {
      final token = await TokenStorage.getAccessToken();
      if (token == null) {
        throw Exception('No access token found');
      }

      final response = await AuthService.updateUserProfile(
        token: token,
        userData: data,
      );

      if (response != null && response['success'] == true) {
        // Refresh local profile
        await fetchProfile(onUpdate);
        return true;
      } else {
        errorMessage = response?['message'] ?? 'Update failed';
        return false;
      }
    } catch (e) {
      errorMessage = e.toString();
      return false;
    } finally {
      isLoading = false;
      onUpdate();
    }
  }
}
