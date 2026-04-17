using AcasService.Application.Commands.Notification;
using AcasService.Application.Queries.RegradingRequests;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Examination;
using AcasService.Repositories.RegradingRequest;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.RegradingRequests;

public interface IRegradingRequestCommand
{
    Task<RegradingRequestResponse> CreateAsync(CreateRegradingRequest request, string studentId);
    Task<RegradingRequestResponse> ApproveAsync(string id, string lecturerNote);
    Task<RegradingRequestResponse> RejectAsync(string id, string lecturerNote);
    Task<RegradingRequestResponse> CancelAsync(string id);
}

public class RegradingRequestCommand : IRegradingRequestCommand
{
    private readonly IRegradingRequestRepository _repository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IBusinessNotificationService _businessNotificationService;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<RegradingRequestCommand> _logger;
    private readonly IRegradingRequestQuery _regradingRequestQuery;

    public RegradingRequestCommand(
        IRegradingRequestRepository repository,
        ISubmissionRepository submissionRepository,
        IExaminationRepository examinationRepository,
        IClassroomRepository classroomRepository,
        IBusinessNotificationService businessNotificationService,
        UserRequestProducer userRequestProducer,
        ILogger<RegradingRequestCommand> logger,
        IRegradingRequestQuery regradingRequestQuery)
    {
        _repository = repository;
        _submissionRepository = submissionRepository;
        _examinationRepository = examinationRepository;
        _classroomRepository = classroomRepository;
        _businessNotificationService = businessNotificationService;
        _userRequestProducer = userRequestProducer;
        _logger = logger;
        _regradingRequestQuery = regradingRequestQuery;
    }

    public async Task<RegradingRequestResponse> CreateAsync(CreateRegradingRequest request, string studentId)
    {
        try
        {
            var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId);
            if (submission == null)
                throw new KeyNotFoundException($"Submission with ID {request.SubmissionId} not found");

            var newRequest = new RegradingRequest
            {
                ExaminationId = request.ExaminationId,
                SubmissionId = request.SubmissionId,
                StudentId = studentId,
                Reason = request.Reason,
                ImageUrls = request.ImageUrls ?? new List<string>(),
                Status = RegradingRequestStatus.PENDING
            };

            var created = await _repository.CreateAsync(newRequest);
            if (created == null)
                throw new Exception("Failed to create regrading request");

            // Update submission with regrading request ID
            try
            {
                submission.RegradingRequestId = created.Id;
                await _submissionRepository.UpdateAsync(submission);
                _logger.LogInformation("Updated submission {SubmissionId} with RegradingRequestId {RegradingRequestId}", 
                    submission.Id, created.Id);
            }
            catch (Exception updateEx)
            {
                _logger.LogWarning(updateEx, "Failed to update submission {SubmissionId} with RegradingRequestId", submission.Id);
                // Don't fail the whole operation if update fails
            }

            // Send notification to lecturer
            try
            {
                var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
                if (exam != null)
                {
                    var classroom = await _classroomRepository.FindByIdAsync(exam.ClassroomId);
                    if (classroom != null && !string.IsNullOrWhiteSpace(classroom.LecturerId))
                    {
                        await _businessNotificationService.NotifyUsersAsync(
                            new[] { classroom.LecturerId },
                            Models.NotificationType.NEW_REGRADING_REQUEST,
                            "New Regrading Request",
                            $"Student has submitted a regrading request for an exam submission.",
                            new Dictionary<string, object?>
                            {
                                { "regradingRequestId", created.Id },
                                { "examinationId", request.ExaminationId },
                                { "submissionId", request.SubmissionId },
                                { "studentId", studentId }
                            });
                    }
                }
            }
            catch (Exception notifyEx)
            {
                _logger.LogWarning(notifyEx, "Failed to send notification to lecturer for regrading request {Id}", created.Id);
            }

            _logger.LogInformation("RegradingRequest {Id} created successfully for student {StudentId}", created.Id, studentId);
            return await _regradingRequestQuery.GetByIdAsync(created.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating RegradingRequest for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<RegradingRequestResponse> ApproveAsync(string id, string lecturerNote)
    {
        try
        {
            var result = await _repository.ApproveAsync(id, lecturerNote);
            if (result == null)
                throw new KeyNotFoundException($"RegradingRequest with ID {id} not found");

            // Send notification to student
            try
            {
                await _businessNotificationService.NotifyUsersAsync(
                    new[] { result.StudentId },
                    Models.NotificationType.REGRADING_APPROVED,
                    "Regrading Request Approved",
                    $"Your regrading request has been approved by the lecturer. Note: {lecturerNote}",
                    new Dictionary<string, object?>
                    {
                        { "regradingRequestId", id },
                        { "examinationId", result.ExaminationId },
                        { "submissionId", result.SubmissionId }
                    });
            }
            catch (Exception notifyEx)
            {
                _logger.LogWarning(notifyEx, "Failed to send notification to student for approved regrading request {Id}", id);
            }

            _logger.LogInformation("RegradingRequest {Id} approved", id);
            return await _regradingRequestQuery.GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<RegradingRequestResponse> RejectAsync(string id, string lecturerNote)
    {
        try
        {
            var result = await _repository.RejectAsync(id, lecturerNote);
            if (result == null)
                throw new KeyNotFoundException($"RegradingRequest with ID {id} not found");

            // Send notification to student
            try
            {
                await _businessNotificationService.NotifyUsersAsync(
                    new[] { result.StudentId },
                    Models.NotificationType.REGRADING_REJECTED,
                    "Regrading Request Rejected",
                    $"Your regrading request has been rejected by the lecturer. Note: {lecturerNote}",
                    new Dictionary<string, object?>
                    {
                        { "regradingRequestId", id },
                        { "examinationId", result.ExaminationId },
                        { "submissionId", result.SubmissionId }
                    });
            }
            catch (Exception notifyEx)
            {
                _logger.LogWarning(notifyEx, "Failed to send notification to student for rejected regrading request {Id}", id);
            }

            _logger.LogInformation("RegradingRequest {Id} rejected", id);
            return await _regradingRequestQuery.GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<RegradingRequestResponse> CancelAsync(string id)
    {
        try
        {
            var result = await _repository.CancelAsync(id);
            if (result == null)
                throw new KeyNotFoundException($"RegradingRequest with ID {id} not found");

            _logger.LogInformation("RegradingRequest {Id} canceled", id);
            return await _regradingRequestQuery.GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling RegradingRequest {Id}", id);
            throw;
        }
    }
}
