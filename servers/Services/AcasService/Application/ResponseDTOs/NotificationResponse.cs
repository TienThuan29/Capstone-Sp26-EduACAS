using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class NotificationResponse
{
    public string Id { get; set; } = string.Empty;
    public string TargetUserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public Dictionary<string, object?> Payload { get; set; } = new();
    public DateTime SentDate { get; set; }
    public bool IsRead { get; set; }
    public bool IsDeleted { get; set; }
}

