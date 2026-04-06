using AcasService.Application.Commands.Notification;
using AcasService.Models;
using AcasService.Repositories.ClassroomEnrollment;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Dev.Notification;

/// <summary>
/// Dev-only API to push a test notification to all students (enrolled in any classroom)
/// for testing the real-time notification UI.
/// </summary>
[ApiController]
[Route("api/dev/notifications")]
public class NotificationPusherController : ControllerBase
{
    private readonly IClassroomEnrollmentRepository _enrollmentRepository;
    private readonly ClassroomNotification _classroomNotification;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<NotificationPusherController> _logger;

    public NotificationPusherController(
        IClassroomEnrollmentRepository enrollmentRepository,
        ClassroomNotification classroomNotification,
        IWebHostEnvironment env,
        ILogger<NotificationPusherController> logger)
    {
        _enrollmentRepository = enrollmentRepository;
        _classroomNotification = classroomNotification;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Pushes a test notification to all students (distinct student IDs from classroom enrollments).
    /// Only available in Development environment.
    /// </summary>
    [HttpPost("push-to-students")]
    [ProducesResponseType(typeof(PushToStudentsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PushToStudentsResponse>> PushToStudents(
        [FromBody] PushToStudentsRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("push-to-students was called in non-Development environment; rejecting");
            return StatusCode(403, new PushToStudentsResponse
            {
                Success = false,
                Message = "This endpoint is only available in Development environment.",
                StudentIds = [],
                SentCount = 0
            });
        }

        try
        {
            var enrollments = await _enrollmentRepository.FindByAllAsync();
            var studentIds = enrollments
                .Select(e => e.StudentId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (studentIds.Count == 0)
            {
                return Ok(new PushToStudentsResponse
                {
                    Success = true,
                    Message = "No enrolled students found. Add enrollments to test notifications.",
                    StudentIds = [],
                    SentCount = 0
                });
            }

            var title = request?.Title ?? "Test notification";
            var body = request?.Body ?? "This is a test push from the dev API to verify real-time notifications on the UI.";

            var sentCount = 0;
            foreach (var studentId in studentIds)
            {
                var sent = await _classroomNotification.SendAsync(new Models.Notification
                {
                    TargetUserId = studentId,
                    Title = title,
                    Body = body,
                    Type = request?.Type ?? Models.NotificationType.SYSTEM,
                    Payload = request?.Payload ?? new Dictionary<string, object?>(),
                    SentDate = DateTime.UtcNow
                });
                if (sent) sentCount++;
            }

            _logger.LogInformation("Push-to-students: sent {SentCount}/{Total} notifications", sentCount, studentIds.Count);

            return Ok(new PushToStudentsResponse
            {
                Success = true,
                Message = $"Sent test notification to {sentCount} of {studentIds.Count} students.",
                StudentIds = studentIds,
                SentCount = sentCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "push-to-students failed");
            return StatusCode(500, new PushToStudentsResponse
            {
                Success = false,
                Message = ex.Message,
                StudentIds = [],
                SentCount = 0
            });
        }
    }
}

public class PushToStudentsRequest
{
    public string? Title { get; set; }
    public string? Body { get; set; }
    public Models.NotificationType? Type { get; set; }
    public Dictionary<string, object?>? Payload { get; set; }
}

public class PushToStudentsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> StudentIds { get; set; } = [];
    public int SentCount { get; set; }
}
