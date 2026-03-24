using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Web.Requests;

namespace AcasService.Application.Mappers;

public class KeystrokeLogsMapper
{
    public KeystrokeLog ToEntity(FlushKeystrokeLogsRequest request, List<KeystrokeRecord> records)
    {
        return new KeystrokeLog
        {
            Id = Guid.NewGuid().ToString(),
            SubmissionId = request.SubmissionId,
            KeystrokeData = records,
            CreatedAt = DateTime.UtcNow
        };
    }

    public CacheKeystrokeLogsResponse ToCacheResponse(CacheKeystrokeLogsRequest request, List<KeystrokeRecord> records)
    {
        return new CacheKeystrokeLogsResponse
        {
            Message = "Cached to Redis.",
            ExaminationId = request.ExaminationId,
            StudentId = request.StudentId,
            ProblemId = request.ProblemId,
            KeystrokeData = records
        };
    }

    public FlushKeystrokeLogsResponse ToFlushResponse(FlushKeystrokeLogsRequest request, KeystrokeLog saved, List<KeystrokeRecord> records)
    {
        return new FlushKeystrokeLogsResponse
        {
            Message = "Flushed to DB.",
            Id = saved.Id,
            SubmissionId = saved.SubmissionId,
            ExaminationId = request.ExaminationId,
            StudentId = request.StudentId,
            ProblemId = request.ProblemId,
            KeystrokeData = records
        };
    }

    public FlushKeystrokeLogsResponse ToEmptyFlushResponse(FlushKeystrokeLogsRequest request)
    {
        return new FlushKeystrokeLogsResponse
        {
            Message = "No data to flush.",
            Id = string.Empty,
            SubmissionId = request.SubmissionId,
            ExaminationId = request.ExaminationId,
            StudentId = request.StudentId,
            ProblemId = request.ProblemId,
            KeystrokeData = new List<KeystrokeRecord>()
        };
    }
}
