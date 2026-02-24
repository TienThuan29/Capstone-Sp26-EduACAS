using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

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
}

public enum NotificationType
{
      // normal type
      SYSTEM,
      NEW_PRACTICE,
      NEW_MATERIAL,
      NEW_EXAMINATION,
      NEW_DISCUSSION_ISSUE,
      GRADE_RESULT,
      REPLY_COMMENT,

      // academic type
      ACADEMIC_WARNING_LEVEL_1,
      ACADEMIC_WARNING_LEVEL_2,
}