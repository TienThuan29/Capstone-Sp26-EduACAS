import 'package:firebase_messaging/firebase_messaging.dart';

class Announcement {
  final String id;
  final String targetUserId;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic> payload;
  final DateTime sentDate;

  const Announcement({
    required this.id,
    required this.targetUserId,
    required this.title,
    required this.body,
    required this.type,
    required this.payload,
    required this.sentDate,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: (json['id'] ?? '').toString(),
      targetUserId: (json['targetUserId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      body: (json['body'] ?? '').toString(),
      type: (json['type'] ?? 'SYSTEM').toString(),
      payload: (json['payload'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      sentDate: _parseDateTime(json['sentDate']) ?? DateTime.now().toUtc(),
    );
  }

  factory Announcement.fromRemoteMessage(RemoteMessage message) {
    final data = message.data;
    final sentDate = _parseDateTime(data['sentDate']) ?? DateTime.now().toUtc();

    return Announcement(
      id: (data['notificationId'] ?? message.messageId ?? '').toString(),
      targetUserId: (data['targetUserId'] ?? '').toString(),
      title: message.notification?.title ?? (data['title'] ?? 'Notification').toString(),
      body: message.notification?.body ?? (data['body'] ?? '').toString(),
      type: (data['type'] ?? 'SYSTEM').toString(),
      payload: Map<String, dynamic>.from(data),
      sentDate: sentDate,
    );
  }

  static DateTime? _parseDateTime(Object? value) {
    if (value == null) {
      return null;
    }

    final raw = value.toString();
    if (raw.isEmpty) {
      return null;
    }

    return DateTime.tryParse(raw)?.toUtc();
  }

  String get dedupeKey {
    if (id.isNotEmpty) {
      return id;
    }

    return '$title|$body|${sentDate.toIso8601String()}';
  }
}
