using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("NotificationTableName")]
public class Notification
{
      [Key]
      public string Id { get; set; } = string.Empty;

      [Required]
      public string TargetUserId { get; set; } = string.Empty;

      [Required]
      public string Title { get; set; } = string.Empty;

      [Required]
      public string Body { get; set; } = string.Empty;

      [Required]
      public NotificationType Type { get; set; }

      public Dictionary<string, object?> Payload { get; set; } = new();
      
      public DateTime SentDate { get; set; }

      public bool IsRead { get; set; } = false;

      public bool IsDeleted { get; set; } = false;
}

public enum NotificationType
{
      // normal type
      SYSTEM, // Hệ thống gửi thông báo chung
      NEW_PRACTICE, //Giảng viên đăng bài tập mới
      NEW_MATERIAL, //Giảng viên đăng tài liệu mới
      NEW_EXAMINATION, //Giảng viên đăng đề thi mới
      NEW_DISCUSSION_ISSUE, //Giảng viên hoặc sinh viên tạo chủ đề thảo luận mới
      GRADE_RESULT, //Giảng viên đăng điểm mới
      REPLY_COMMENT, //Giảng viên hoặc sinh viên trả lời bình luận của sinh viên
      NEW_REGRADING_REQUEST, //Sinh viên yêu cầu regrading
      REGRADING_APPROVED, //Giảng viên phê duyệt yêu cầu regrading
      REGRADING_REJECTED, //Giảng viên từ chối yêu cầu regrading

      // academic type
      ACADEMIC_WARNING_LEVEL_1, // Cảnh báo học vụ cấp độ 1
      ACADEMIC_WARNING_LEVEL_2, // Cảnh báo học vụ cấp độ 2
}