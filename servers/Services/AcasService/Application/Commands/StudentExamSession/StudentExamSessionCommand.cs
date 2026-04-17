using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.StudentExamSession;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.StudentExamSession;

public interface IStudentExamSessionCommand
{
    Task<StudentExamSessionResponse?> GetByExamAsync(string studentId, string examId);
    Task<StudentExamSessionResponse?> GetActiveAsync(string studentId);
    Task<StudentExamSessionResponse?> StartAsync(string studentId, string examId);
    Task<StudentExamSessionResponse?> CompleteAsync(string studentId, string examId);
    Task<StudentExamSessionResponse?> LockAsync(string studentId, string examId, string? lockReason);
    Task<StudentExamSessionResponse?> SetActiveProblemAsync(string studentId, string examId, string? problemId);
    Task<bool> HardDeleteAsync(string studentId, string examId);
}

public class StudentExamSessionCommand : IStudentExamSessionCommand
{
    private readonly IStudentExamSessionRepository _sessionRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IClassroomEnrollmentRepository _enrollmentRepository;
    private readonly ILogger<StudentExamSessionCommand> _logger;

    public StudentExamSessionCommand(
        IStudentExamSessionRepository sessionRepository,
        IExaminationRepository examinationRepository,
        IClassroomEnrollmentRepository enrollmentRepository,
        ILogger<StudentExamSessionCommand> logger)
    {
        _sessionRepository = sessionRepository;
        _examinationRepository = examinationRepository;
        _enrollmentRepository = enrollmentRepository;
        _logger = logger;
    }

    private static StudentExamSessionResponse ToResponse(Models.StudentExamSession s) => new()
    {
        ExamId = s.ExamId,
        ClassroomId = s.ClassroomId,
        Phase = s.Phase.ToString().ToUpperInvariant(),
        ActiveProblemId = s.ActiveProblemId,
        LockReason = s.LockReason,
        UpdatedDate = s.UpdatedDate,
    };

    public async Task<StudentExamSessionResponse?> GetByExamAsync(string studentId, string examId)
    {
        var s = await _sessionRepository.GetByStudentAndExamAsync(studentId, examId);
        return s == null ? null : ToResponse(s);
    }

    public async Task<StudentExamSessionResponse?> GetActiveAsync(string studentId)
    {
        var s = await _sessionRepository.FindActiveByStudentAsync(studentId);
        return s == null ? null : ToResponse(s);
    }

    public async Task<StudentExamSessionResponse?> StartAsync(string studentId, string examId)
    {
        var exam = await _examinationRepository.GetByIdAsync(examId);
        if (exam == null)
        {
            _logger.LogWarning("Start session: exam {ExamId} not found", examId);
            return null;
        }

        if (exam.Mode != Mode.EXAMINATION)
        {
            _logger.LogWarning("Start session: exam {ExamId} is not EXAMINATION mode", examId);
            return null;
        }

        var enrollment = await _enrollmentRepository.FindByClassAndStudentIdAsync(exam.ClassroomId, studentId);
        if (enrollment == null || !enrollment.IsJoining)
        {
            _logger.LogWarning("Start session: student {StudentId} not enrolled in class {ClassId}", studentId, exam.ClassroomId);
            return null;
        }

        var existing = await _sessionRepository.GetByStudentAndExamAsync(studentId, examId);
        if (existing != null)
        {
            if (existing.Phase == StudentExamSessionPhase.Completed || existing.Phase == StudentExamSessionPhase.Locked)
            {
                _logger.LogWarning("Start session: session already terminal {Phase}", existing.Phase);
                return null;
            }

            if (existing.Phase == StudentExamSessionPhase.Active)
                return ToResponse(existing);
        }

        var now = DateTime.UtcNow;
        var session = new Models.StudentExamSession
        {
            Id = Models.StudentExamSession.ComposeId(studentId, examId),
            StudentId = studentId,
            ExamId = examId,
            ClassroomId = exam.ClassroomId,
            Phase = StudentExamSessionPhase.Active,
            CreatedDate = existing?.CreatedDate ?? now,
            UpdatedDate = now,
        };

        var saved = await _sessionRepository.UpsertAsync(session);
        return saved == null ? null : ToResponse(saved);
    }

    public async Task<StudentExamSessionResponse?> CompleteAsync(string studentId, string examId)
    {
        var existing = await _sessionRepository.GetByStudentAndExamAsync(studentId, examId);
        if (existing == null || existing.Phase != StudentExamSessionPhase.Active)
            return null;

        existing.Phase = StudentExamSessionPhase.Completed;
        existing.LockReason = null;
        var saved = await _sessionRepository.UpsertAsync(existing);
        return saved == null ? null : ToResponse(saved);
    }

    public async Task<StudentExamSessionResponse?> LockAsync(string studentId, string examId, string? lockReason)
    {
        var existing = await _sessionRepository.GetByStudentAndExamAsync(studentId, examId);
        if (existing == null || existing.Phase != StudentExamSessionPhase.Active)
            return null;

        existing.Phase = StudentExamSessionPhase.Locked;
        existing.LockReason = lockReason;
        var saved = await _sessionRepository.UpsertAsync(existing);
        return saved == null ? null : ToResponse(saved);
    }

    public async Task<StudentExamSessionResponse?> SetActiveProblemAsync(string studentId, string examId, string? problemId)
    {
        var existing = await _sessionRepository.GetByStudentAndExamAsync(studentId, examId);
        if (existing == null || existing.Phase != StudentExamSessionPhase.Active)
            return null;

        existing.ActiveProblemId = problemId;
        var saved = await _sessionRepository.UpsertAsync(existing);
        return saved == null ? null : ToResponse(saved);
    }

    public async Task<bool> HardDeleteAsync(string studentId, string examId)
    {
        var id = Models.StudentExamSession.ComposeId(studentId, examId);
        return await _sessionRepository.DeleteAsync(id);
    }
}
