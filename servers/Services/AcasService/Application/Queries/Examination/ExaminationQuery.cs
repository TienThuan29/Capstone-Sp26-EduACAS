using System;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using Amazon.DynamoDBv2;
using AcasService.Application.Mappers;
using AcasService.Repositories.Examination;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Classroom;


namespace AcasService.Application.Queries.Examination;

public interface IExaminationQuery
{
    Task<ExaminationResponse?> GetByIdAsync(string id);
    Task<List<ExaminationResponse?>> GetAllAsync();

    Task<List<ExaminationResponse?>> GetByClassIdAsync(string classId);

}

public class ExaminationQuery : IExaminationQuery
{
    private readonly IExaminationRepository _examinationRepository;
    private readonly ExaminationMapper _examinationMapper;

    private readonly IProgrammingLanguageRepository _programmingLanguageRepository;

    private readonly IClassroomRepository _classroomRepository;
    private readonly ILogger<ExaminationQuery> _logger;

    public ExaminationQuery(IExaminationRepository examinationRepository, ILogger<ExaminationQuery> logger, ExaminationMapper examinationMapper, IClassroomRepository classroomRepository, IProgrammingLanguageRepository programmingLanguageRepository)
    {
        _examinationRepository = examinationRepository;
        _programmingLanguageRepository = programmingLanguageRepository;
        _classroomRepository = classroomRepository;
        _examinationMapper = examinationMapper;
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

}
