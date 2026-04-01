using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;

namespace AcasService.Application.Mappers;

public class ExamLogMapper
{
    public ExamLog ToEntity(CreateExamLogRequest request)
    {
        var now = DateTime.UtcNow;
        return new ExamLog
        {
            Id = string.Empty,
            SubmissionId = request.SubmissionId,
            EventType = ParseEventType(request.EventType),
            EventDetail = request.EventDetail,
            Message = request.Message,
            Severity = ParseSeverity(request.Severity),
            IsViolation = request.IsViolation,
            ClientTimestamp = request.ClientTimestamp == default ? now : request.ClientTimestamp,
            CreatedDate = now
        };
    }

    public ExamLogResponse ToResponse(ExamLog examLog)
    {
        return new ExamLogResponse
        {
            Id = examLog.Id,
            SubmissionId = examLog.SubmissionId,
            EventType = examLog.EventType.ToString(),
            EventDetail = examLog.EventDetail,
            Message = examLog.Message,
            Severity = examLog.Severity.ToString().ToLowerInvariant(),
            IsViolation = examLog.IsViolation,
            ClientTimestamp = examLog.ClientTimestamp,
            CreatedDate = examLog.CreatedDate
        };
    }

    private static ExamLogEventType ParseEventType(string raw)
    {
        if (Enum.TryParse<ExamLogEventType>(raw, true, out var eventType))
            return eventType;
        return ExamLogEventType.OTHER;
    }

    private static ExamLogSeverity ParseSeverity(string raw)
    {
        if (Enum.TryParse<ExamLogSeverity>(raw, true, out var severity))
            return severity;
        return ExamLogSeverity.INFO;
    }
}
