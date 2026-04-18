import 'package:flutter/foundation.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/announcement.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnnouncementService {
  static Future<List<Announcement>> getMyAnnouncements() async {
    final token = await TokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('No access token found');
    }

    final response = await ApiNetwork.getWithAuth(
      endpoint: ApiConfig.myAnnouncementsEndpoint,
      token: token,
    );

    if (response['success'] != true) {
      throw Exception(response['message'] ?? 'Failed to load announcements');
    }

    final rawData = response['dataResponse'];
    if (rawData is! List) {
      return <Announcement>[];
    }

    return rawData
        .whereType<Map<String, dynamic>>()
        .map(Announcement.fromJson)
        .toList();
  }
}

class AnnouncementFeed {
  static final ValueNotifier<int> revision = ValueNotifier<int>(0);
  static final ValueNotifier<int> focusRequestRevision = ValueNotifier<int>(0);
  static final ValueNotifier<bool> hasUnreadAnnouncements = ValueNotifier<bool>(false);
  static final List<Announcement> _inAppItems = <Announcement>[];

  static List<Announcement> get inAppItems => List<Announcement>.unmodifiable(_inAppItems);

  static void addInApp(
    Announcement item, {
    bool autoOpenAnnouncements = false,
  }) {
    final key = item.dedupeKey;
    final existingIndex = _inAppItems.indexWhere((x) => x.dedupeKey == key);
    if (existingIndex >= 0) {
      _inAppItems[existingIndex] = item;
    } else {
      _inAppItems.insert(0, item);
    }

    revision.value = revision.value + 1;
    updateUnreadState(true);

    if (autoOpenAnnouncements) {
      focusRequestRevision.value = focusRequestRevision.value + 1;
    }
  }

  static void updateUnreadState(bool hasUnread) {
    if (hasUnreadAnnouncements.value == hasUnread) {
      return;
    }

    hasUnreadAnnouncements.value = hasUnread;
  }

  static Future<void> refreshUnreadStatus() async {
    try {
      final userId = await TokenStorage.getUserId();
      if (userId == null || userId.isEmpty) {
        updateUnreadState(_inAppItems.isNotEmpty);
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      final acknowledged = (prefs.getStringList('announcement_ack_$userId') ?? <String>[]).toSet();
      final fromServer = await AnnouncementService.getMyAnnouncements();

      final allItems = <String, Announcement>{
        for (final item in fromServer) item.dedupeKey: item,
        for (final item in _inAppItems) item.dedupeKey: item,
      };

      final hasUnread = allItems.keys.any((key) => !acknowledged.contains(key));
      updateUnreadState(hasUnread);
    } catch (_) {
      updateUnreadState(_inAppItems.isNotEmpty || hasUnreadAnnouncements.value);
    }
  }
}
