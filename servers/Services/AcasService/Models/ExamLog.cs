using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ExamLogTableName")]
public class ExamLog
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string SubmissionId { get; set; } = string.Empty;

    [Required]
    public ExamLogEventType EventType { get; set; }

    public string EventDetail { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [Required]
    public ExamLogSeverity Severity { get; set; } = ExamLogSeverity.INFO;

    public bool IsViolation { get; set; }

    public DateTime ClientTimestamp { get; set; }

    public DateTime CreatedDate { get; set; }
}

public enum ExamLogEventType
{
    OTHER,
    SYSTEM_RELOAD,
    FULLSCREEN_EXIT,
    TAB_LEAVE,
    WINDOW_BLUR,
    RIGHT_CLICK,
    KEYBOARD_SHORTCUT,
    DEVTOOLS_OPEN,
    TAMPERING_DETECTED,
    EXAM_HEARTBEAT,
    COPY_PASTE,
    EXTERNAL_PASTE,
    CUT_PASTE,
    DRAG_DROP
}

public enum ExamLogSeverity
{
    INFO,
    WARNING,
    CRITICAL
}
