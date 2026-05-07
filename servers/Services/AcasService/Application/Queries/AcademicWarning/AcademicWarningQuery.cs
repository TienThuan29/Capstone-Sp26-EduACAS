using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;

namespace AcasService.Application.Queries.AcademicWarning;

public interface IAcademicWarningQuery
{
    Task<List<AcademicWarningResponse>> GetByStudentIdAsync(string studentId);
    Task<List<AcademicWarningResponse>> GetByClassroomIdAsync(string classroomId);
    Task<List<AcademicWarningResponse>> GetByExamIdAsync(string examId);
    Task<AcademicWarningResponse?> GetByIdAsync(string id);
}

public class AcademicWarningQuery : IAcademicWarningQuery
{
    private readonly ILogger<AcademicWarningQuery> _logger;
    private readonly IAcademicWarningRepository _repository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly UserRequestProducer _userRequestProducer;

    public AcademicWarningQuery(
        ILogger<AcademicWarningQuery> logger,
        IAcademicWarningRepository repository,
        IClassroomRepository classroomRepository,
        IExaminationRepository examinationRepository,
        IProblemRepository problemRepository,
        UserRequestProducer userRequestProducer)
    {
        _logger = logger;
        _repository = repository;
        _classroomRepository = classroomRepository;
        _examinationRepository = examinationRepository;
        _problemRepository = problemRepository;
        _userRequestProducer = userRequestProducer;
    }

    public async Task<List<AcademicWarningResponse>> GetByStudentIdAsync(string studentId)
    {
        try
        {
            var warnings = await _repository.FindByStudentIdAsync(studentId);
            var responses = warnings.Select(AcademicWarningMapper.ToResponse).ToList();
            await PopulateDisplayFieldsAsync(responses, warnings);
            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<AcademicWarningResponse>> GetByClassroomIdAsync(string classroomId)
    {
        try
        {
            var warnings = await _repository.FindByClassroomIdAsync(classroomId);
            var responses = warnings.Select(AcademicWarningMapper.ToResponse).ToList();
            await PopulateDisplayFieldsAsync(responses, warnings);
            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<List<AcademicWarningResponse>> GetByExamIdAsync(string examId)
    {
        try
        {
            var warnings = await _repository.FindByExamIdAsync(examId);
            var responses = warnings.Select(AcademicWarningMapper.ToResponse).ToList();
            await PopulateDisplayFieldsAsync(responses, warnings);
            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warnings for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<AcademicWarningResponse?> GetByIdAsync(string id)
    {
        try
        {
            var warning = await _repository.FindByIdAsync(id);
            if (warning == null) return null;
            var response = AcademicWarningMapper.ToResponse(warning);
            await PopulateDisplayFieldsAsync(new List<AcademicWarningResponse> { response }, new List<Models.AcademicWarning> { warning });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting academic warning {Id}", id);
            throw;
        }
    }

    private async Task PopulateDisplayFieldsAsync(List<AcademicWarningResponse> responses, List<Models.AcademicWarning> warnings)
    {
        if (responses.Count == 0) return;

        var classroomIds = warnings.Select(w => w.ClassroomId).Distinct().ToList();
        var examIds = warnings.Select(w => w.ExamId).Distinct().ToList();
        var problemIds = warnings.Select(w => w.ProblemId).Distinct().ToList();
        var studentIds = warnings.Select(w => w.StudentId).Distinct().ToList();

        var classroomsTask = _classroomRepository.FindByIdsAsync(classroomIds);
        var examinationsTask = _examinationRepository.GetByIdsAsync(examIds);
        var problemsTask = _problemRepository.GetByIdsAsync(problemIds);
        var studentsTask = _userRequestProducer.GetUsersByIdsAsync(studentIds);

        await Task.WhenAll(classroomsTask, examinationsTask, problemsTask, studentsTask);

        var classrooms = classroomsTask.Result;
        var examinations = examinationsTask.Result;
        var problems = problemsTask.Result;
        var students = studentsTask.Result;

        var classroomMap = classrooms.ToDictionary(c => c.Id, c => c);
        var examMap = examinations.ToDictionary(e => e.Id, e => e);
        var problemMap = problems.ToDictionary(p => p.Id, p => p);
        var studentMap = students.ToDictionary(s => s.Id, s => s);

        for (int i = 0; i < responses.Count; i++)
        {
            var warning = warnings[i];
            classroomMap.TryGetValue(warning.ClassroomId, out var classroom);
            examMap.TryGetValue(warning.ExamId, out var exam);
            problemMap.TryGetValue(warning.ProblemId, out var problem);
            studentMap.TryGetValue(warning.StudentId, out var student);

            AcademicWarningMapper.PopulateDisplayFields(
                responses[i],
                classroom?.ClassName,
                exam?.ExamName,
                problem?.Title,
                student?.Fullname);
        }
    }
}
