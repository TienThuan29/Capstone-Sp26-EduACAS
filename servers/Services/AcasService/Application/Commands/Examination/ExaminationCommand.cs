using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Application.Mappers;
using AcasService.Repositories.Examination;
using AcasService.Models;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Classroom;

namespace AcasService.Application.Commands.Examination;

public interface IExaminationCommand
{
    Task<ExaminationResponse?> CreateAsync(ExaminationRequestDTO exam);
    Task<ExaminationResponse?> UpdateAsync(string id, ExaminationRequestDTO exam);
    Task DeleteAsync(string id);
}

public class ExaminationCommand : IExaminationCommand
{
    private readonly IExaminationRepository _examinationRepository;
    private readonly ExaminationMapper _examinationMapper;
    private readonly IProgrammingLanguageRepository _programmingLanguageRepository;

    private readonly IClassroomRepository _classroomRepository;
    private readonly ILogger<ExaminationCommand> _logger;

    public ExaminationCommand(IExaminationRepository examinationRepository, ILogger<ExaminationCommand> logger, IClassroomRepository classroomRepository, IProgrammingLanguageRepository programmingLanguageRepository )
    {
        _examinationRepository = examinationRepository;
        _programmingLanguageRepository =programmingLanguageRepository;
        _classroomRepository =classroomRepository;
        _examinationMapper = new ExaminationMapper();
        _logger = logger;
    }

    public async Task<ExaminationResponse?> CreateAsync(ExaminationRequestDTO examDto)
    {
        try
        {
            var examModel = _examinationMapper.ToExaminationModel(examDto);
            var classroom =await _classroomRepository.FindByIdAsync(examDto.ClassroomId);
            var programmingLanguage = await _programmingLanguageRepository.GetByIdAsync(examDto.ProgrammingLanguageId);
            var createdExam = await _examinationRepository.CreateAsync(examModel);
            return _examinationMapper.ToExaminationResponse(createdExam,classroom,programmingLanguage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating examination");
            throw;
        }
    }

    public async Task<ExaminationResponse?> UpdateAsync(
        string id,
        ExaminationRequestDTO examDto)
    {
        try
        {
            var existingExam = await _examinationRepository.GetByIdAsync(id);
            if (existingExam == null)
            {
                throw new Exception("Examination with given Id does not exist.");
            }
            if (!Enum.TryParse<Status>(examDto.Status, true, out var status))
                throw new ArgumentException($"Invalid status: {examDto.Status}");

            if (!Enum.TryParse<Mode>(examDto.Mode, true, out var mode))
                throw new ArgumentException($"Invalid mode: {examDto.Mode}");

            existingExam.ExamName = examDto.ExamName;
            existingExam.ProgrammingLanguageId = examDto.ProgrammingLanguageId;
            existingExam.ProblemIds = examDto.ProblemIds;
            existingExam.ClassroomId = examDto.ClassroomId;
            existingExam.StartDatetime = examDto.StartDatetime;
            existingExam.EndDatetime = examDto.EndDatetime;
            existingExam.Description = examDto.Description;
            existingExam.IsPublicResult = examDto.IsPublicResult;
            existingExam.TotalMark = examDto.TotalMark;
            existingExam.Status = status;
            existingExam.Mode = mode;
            existingExam.UpdatedDate = DateTime.UtcNow;

            var updatedExam = await _examinationRepository.UpdateAsync(id, existingExam);
             var classroom =await _classroomRepository.FindByIdAsync(examDto.ClassroomId);
            var programmingLanguage = await _programmingLanguageRepository.GetByIdAsync(examDto.ProgrammingLanguageId);
            return _examinationMapper.ToExaminationResponse(updatedExam,classroom,programmingLanguage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error occurred while updating examination with Id: {Id}", id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var existingExam = await _examinationRepository.GetByIdAsync(id);
            if (existingExam == null)
            {
                throw new Exception("Examination with given Id does not exist.");
            }
            await _examinationRepository.DeleteAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting examination");
            throw;
        }
    }
}