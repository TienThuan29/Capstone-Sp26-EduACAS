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
            var responseList = new List<ExaminationResponse?>();

            if (exams == null || exams.Count == 0)
            {
                throw new Exception("No examinations found.");
            }

            foreach (var exam in exams)
            {
                var programmingLanguagere = await _programmingLanguageRepository.GetByIdAsync(exam.ProgrammingLanguageId);
                var classroomre = await _classroomRepository.FindByIdAsync(exam.ClassroomId);
                var response = _examinationMapper.ToExaminationResponse(exam, classroomre, programmingLanguagere);
                responseList.Add(response);
            }

            return responseList;
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
            var exams = await _examinationRepository.GetByClassIdAsync(classId);

            if (exams == null || !exams.Any())
            {
                _logger.LogInformation(
                    "No examinations found for classId {ClassId}",
                    classId
                );
                return new List<ExaminationResponse?>();
            }
            var responseList = new List<ExaminationResponse?>();
            foreach (var exam in exams)
            {
                var programmingLanguagere = await _programmingLanguageRepository.GetByIdAsync(exam.ProgrammingLanguageId);
                var classroomre = await _classroomRepository.FindByIdAsync(exam.ClassroomId);
                var response = _examinationMapper.ToExaminationResponse(exam, classroomre, programmingLanguagere);
                responseList.Add(response);
            }
            return responseList;

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examinations by class Id");
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
