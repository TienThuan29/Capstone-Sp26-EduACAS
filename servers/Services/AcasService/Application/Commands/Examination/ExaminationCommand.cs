
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Commands.Notification;
using AcasService.Web.Requests;
using AcasService.Application.Mappers;
using AcasService.Repositories.Examination;
using AcasService.Models;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Classroom;
using AcasService.Application.Jobs;

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
    private readonly IBusinessNotificationService _businessNotificationService;
    private readonly IExaminationJobScheduling _jobScheduling;
    private readonly ILogger<ExaminationCommand> _logger;

    public ExaminationCommand(
        IExaminationRepository examinationRepository,
        ILogger<ExaminationCommand> logger,
        IClassroomRepository classroomRepository,
        IProgrammingLanguageRepository programmingLanguageRepository,
        IBusinessNotificationService businessNotificationService,
        IExaminationJobScheduling jobScheduling)
    {
        _examinationRepository = examinationRepository;
        _programmingLanguageRepository = programmingLanguageRepository;
        _classroomRepository = classroomRepository;
        _businessNotificationService = businessNotificationService;
        _jobScheduling = jobScheduling;
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

            // Schedule automatic status transitions: OPEN at StartDatetime, COMPLETED at EndDatetime
            _jobScheduling.ScheduleJobs(createdExam.Id, createdExam.StartDatetime, createdExam.EndDatetime);

            await _businessNotificationService.NotifyClassroomAsync(
                createdExam.ClassroomId,
                NotificationType.NEW_EXAMINATION,
                "New examination published",
                $"A new examination '{createdExam.ExamName}' is now available.",
                payload: new Dictionary<string, object?>
                {
                    ["examId"] = createdExam.Id,
                    ["classroomId"] = createdExam.ClassroomId,
                    ["status"] = createdExam.Status.ToString(),
                    ["mode"] = createdExam.Mode.ToString()
                }
            );

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

            // Capture original dates BEFORE overwriting — needed to detect if they changed
            var originalStartDatetime = existingExam.StartDatetime;
            var originalEndDatetime = existingExam.EndDatetime;

            existingExam.ExamName = examDto.ExamName;
            existingExam.ProgrammingLanguageId = examDto.ProgrammingLanguageId;
            // Only update problems when the client sends them; otherwise keep existing
            if (examDto.Problems != null)
            {
                existingExam.Problems = examDto.Problems.Select(
                    p => new ExaminationProblem {
                        ProblemId = p.ProblemId,
                        Mark = p.Mark
                    }).ToList();
            }
            existingExam.ClassroomId = examDto.ClassroomId;
            existingExam.StartDatetime = examDto.StartDatetime;
            existingExam.EndDatetime = examDto.EndDatetime;
            existingExam.Description = examDto.Description;
            existingExam.IsPublicResult = examDto.IsPublicResult;
            existingExam.TotalMark = examDto.TotalMark;
            existingExam.Status = status;
            existingExam.Mode = mode;
            existingExam.UseStrict = examDto.UseStrict;
            existingExam.MinScoreThreshold = examDto.MinScoreThreshold;
            existingExam.UpdatedDate = DateTime.UtcNow;

            // Detect date changes and reschedule background jobs
            bool datesChanged = originalStartDatetime != examDto.StartDatetime
                              || originalEndDatetime != examDto.EndDatetime;

            var updatedExam = await _examinationRepository.UpdateAsync(id, existingExam);

            // Reschedule background jobs if dates have changed
            if (datesChanged)
            {
                _jobScheduling.RescheduleJobs(
                    id,
                    existingExam.StartDatetime,
                    existingExam.EndDatetime);
            }

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

            // Cancel any scheduled status-transition jobs
            _jobScheduling.CancelJobs(id);

            await _examinationRepository.DeleteAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting examination");
            throw;
        }
    }
}