import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:mobile/core/configs/api_config.dart';
import 'package:mobile/core/network/api_network.dart';
import 'package:mobile/core/storage/token_storage.dart';
import 'package:mobile/features/models/announcement.dart';
import 'package:mobile/features/services/announcement_service.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling a background message: ${message.messageId}');
}

class FcmService {
  static const String _channelId = 'acas_default_channel';
  static const String _channelName = 'Edu-ACAS Notifications';
  static const String _channelDescription = 'Realtime notifications for Edu-ACAS';
  static const String _installationIdKey = 'fcm_installation_id';

  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static bool _firebaseInitialized = false;
  static bool _fullyInitialized = false;

  /// Must be called BEFORE runApp() - only initializes Firebase.
  /// This is required for background message handling.
  static Future<void> initializeFirebase() async {
    if (_firebaseInitialized) {
      return;
    }
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    _firebaseInitialized = true;
  }

  /// Call AFTER runApp() - initializes the rest (notifications, listeners).
  /// This runs in background and does NOT block the UI thread.
  static Future<void> initializePostRun() async {
    if (_fullyInitialized) {
      return;
    }

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await _localNotifications.initialize(initSettings);

    const channel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    FirebaseMessaging.onMessage.listen((message) {
      final inAppAnnouncement = Announcement.fromRemoteMessage(message);
      AnnouncementFeed.addInApp(
        inAppAnnouncement,
        autoOpenAnnouncements: true,
      );
      debugPrint('Foreground notification added to announcements page');
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('Notification opened: ${message.data}');
    });

    FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      final accessToken = await TokenStorage.getAccessToken();
      if (accessToken == null || accessToken.isEmpty) {
        return;
      }
      await registerDeviceToken(token: token, accessToken: accessToken);
    });

    _fullyInitialized = true;
    debugPrint('FCM fully initialized (post-run)');
  }

  /// Backward-compatible method - use initializeFirebase() + initializePostRun() instead.
  static Future<void> initialize() async {
    await initializeFirebase();
    await initializePostRun();
  }

  static Future<void> registerCurrentDeviceForLoggedInUser() async {
    final accessToken = await TokenStorage.getAccessToken();
    if (accessToken == null || accessToken.isEmpty) {
      return;
    }

    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) {
      return;
    }

    await registerDeviceToken(token: token, accessToken: accessToken);
  }

  static Future<void> registerDeviceToken({required String token, required String accessToken}) async {
    final installationId = await _getOrCreateInstallationId();
    final packageInfo = await PackageInfo.fromPlatform();

    await ApiNetwork.postWithAuth(
      endpoint: ApiConfig.registerDeviceTokenEndpoint,
      token: accessToken,
      body: {
        'deviceToken': token,
        'platform': _platformName,
        'deviceId': installationId,
        'appVersion': packageInfo.version,
      },
    );
  }

  static Future<String> _getOrCreateInstallationId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_installationIdKey);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }

    final generated = const Uuid().v4();
    await prefs.setString(_installationIdKey, generated);
    return generated;
  }

  static String get _platformName {
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'IOS';
      case TargetPlatform.android:
        return 'ANDROID';
      default:
        return 'WEB';
    }
  }

}
