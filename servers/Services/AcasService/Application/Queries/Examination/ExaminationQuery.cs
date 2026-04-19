using System;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using Amazon.DynamoDBv2;
using AcasService.Application.Mappers;
using AcasService.Repositories.Examination;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Classroom;
using System.Formats.Asn1;
using AcasService.Repositories.Problem;


namespace AcasService.Application.Queries.Examination;

public interface IExaminationQuery
{
    Task<ExaminationResponse?> GetByIdAsync(string id);
    Task<List<ExaminationResponse?>> GetAllAsync();
    Task<List<ExaminationResponse?>> GetByClassIdAsync(string classId);
    Task<List<ExaminationResponse?>> GetByClassIdAndModeAsync(string classId, string mode);
    Task<ExaminationSpecProblemResponse> GetExaminationProblemResponseAsync(string examId, string problemId);
}

public class ExaminationQuery : IExaminationQuery
{
    private readonly IExaminationRepository _examinationRepository;
    private readonly ExaminationMapper _examinationMapper;
    private readonly ProblemMapper _problemMapper;
    private readonly IProgrammingLanguageRepository _programmingLanguageRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly ILogger<ExaminationQuery> _logger;

    public ExaminationQuery(
        IExaminationRepository examinationRepository,
        ILogger<ExaminationQuery> logger,
        ExaminationMapper examinationMapper,
        IClassroomRepository classroomRepository,
        IProgrammingLanguageRepository programmingLanguageRepository,
        IProblemRepository problemRepository,
        ProblemMapper problemMapper)
    {
        _examinationRepository = examinationRepository;
        _programmingLanguageRepository = programmingLanguageRepository;
        _classroomRepository = classroomRepository;
        _examinationMapper = examinationMapper;
        _problemRepository = problemRepository;
        _problemMapper = problemMapper;
        _logger = logger;
    }

    public async Task<ExaminationResponse?> GetByIdAsync(string id)
    {
        try
        {
            var exam = await _examinationRepository.GetByIdAsync(id);
            if (exam == null)
            {
                throw new Exception("Examination with id not found.");
            }

            var programmingLanguagere = await _programmingLanguageRepository.GetByIdAsync(exam.ProgrammingLanguageId);
            var classroomre = await _classroomRepository.FindByIdAsync(exam.ClassroomId);
            var response = _examinationMapper.ToExaminationResponse(exam, classroomre, programmingLanguagere);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examination by id");
            throw;
        }
    }

    public async Task<List<ExaminationResponse?>> GetAllAsync()
    {
        try
        {
            var exams = await _examinationRepository.GetAllAsync();
            if (exams == null || exams.Count == 0)
            {
                throw new Exception("No examinations found.");
            }

            var programmingLanguageIds = exams.Select(e => e.ProgrammingLanguageId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var classroomIds = exams.Select(e => e.ClassroomId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

            var languages = await _programmingLanguageRepository.GetByIdsAsync(programmingLanguageIds);
            var classrooms = await _classroomRepository.FindByIdsAsync(classroomIds);

            var programmingLanguageById = languages.ToDictionary(l => l.Id, l => (Models.ProgrammingLanguage?)l);
            var classroomById = classrooms.ToDictionary(c => c.Id, c => (Models.Classroom?)c);

            return exams
                .Select(exam => (ExaminationResponse?)_examinationMapper.ToExaminationResponse(
                    exam,
                    classroomById.GetValueOrDefault(exam.ClassroomId),
                    programmingLanguageById.GetValueOrDefault(exam.ProgrammingLanguageId)))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting all examinations");
            throw;
        }
    }

    public async Task<List<ExaminationResponse?>> GetByClassIdAsync(string classId)
    {
        try
        {
            var exams = (await _examinationRepository.GetByClassIdAsync(classId)).ToList();
            if (exams == null || exams.Count == 0)
            {
                _logger.LogInformation(
                    "No examinations found for classId {ClassId}",
                    classId
                );
                return new List<ExaminationResponse?>();
            }

            var programmingLanguageIds = exams.Select(e => e.ProgrammingLanguageId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var classroomIds = exams.Select(e => e.ClassroomId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

            var languages = await _programmingLanguageRepository.GetByIdsAsync(programmingLanguageIds);
            var classrooms = await _classroomRepository.FindByIdsAsync(classroomIds);

            var programmingLanguageById = languages.ToDictionary(l => l.Id, l => (Models.ProgrammingLanguage?)l);
            var classroomById = classrooms.ToDictionary(c => c.Id, c => (Models.Classroom?)c);

            return exams
                .Select(exam => (ExaminationResponse?)_examinationMapper.ToExaminationResponse(
                    exam,
                    classroomById.GetValueOrDefault(exam.ClassroomId),
                    programmingLanguageById.GetValueOrDefault(exam.ProgrammingLanguageId)))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examinations by class Id");
            throw;
        }
    }

    public async Task<List<ExaminationResponse?>> GetByClassIdAndModeAsync(string classId, string mode)
    {
        try
        {
            var exams = (await _examinationRepository.GetByClassIdAndModeAsync(classId, mode)).ToList();
            if (exams == null || exams.Count == 0)
            {
                _logger.LogInformation(
                    "No examinations found for classId {ClassId} and mode {Mode}",
                    classId,
                    mode
                );
                return new List<ExaminationResponse?>();
            }

            var programmingLanguageIds = exams.Select(e => e.ProgrammingLanguageId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var classroomIds = exams.Select(e => e.ClassroomId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

            var languages = await _programmingLanguageRepository.GetByIdsAsync(programmingLanguageIds);
            var classrooms = await _classroomRepository.FindByIdsAsync(classroomIds);

            var programmingLanguageById = languages.ToDictionary(l => l.Id, l => (Models.ProgrammingLanguage?)l);
            var classroomById = classrooms.ToDictionary(c => c.Id, c => (Models.Classroom?)c);

            return exams
                .Select(exam => (ExaminationResponse?)_examinationMapper.ToExaminationResponse(
                    exam,
                    classroomById.GetValueOrDefault(exam.ClassroomId),
                    programmingLanguageById.GetValueOrDefault(exam.ProgrammingLanguageId)))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examinations by class Id and mode");
            throw;
        }
    }

    public async Task<ExaminationSpecProblemResponse> GetExaminationProblemResponseAsync(string examId, string problemId)
    {
        try
        {
            var exam = await _examinationRepository.GetByIdAsync(examId);
            if (exam == null)
            {
                throw new Exception("Examination with id not found.");
            }

            var examProblem = exam.Problems.FirstOrDefault(p => p.ProblemId == problemId);
            if (examProblem == null)
            {
                throw new Exception("Problem with id not found in the examination.");
            }

            var problem = await _problemRepository.GetByIdAsync(problemId);
            if (problem == null)
            {
                throw new Exception("Problem with id not found.");
            }

            var programmingLanguage = await _programmingLanguageRepository.GetByIdAsync(exam.ProgrammingLanguageId);
            var problemResponse = _problemMapper.ToProblemResponse(problem);
            // filter public test cases
            problemResponse.TestCases = problemResponse.TestCases.Where(tc => tc.IsPublic).ToList();
            return _examinationMapper.ToExaminationWithSpecProblem(exam, problemResponse, programmingLanguage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examination problem response");
            throw;
        }
    }
}
