using AcasService.Application.Queries.RegradingRequests;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
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
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<RegradingRequestCommand> _logger;
    private readonly IRegradingRequestQuery _regradingRequestQuery;

    public RegradingRequestCommand(
        IRegradingRequestRepository repository,
        ISubmissionRepository submissionRepository,
        UserRequestProducer userRequestProducer,
        ILogger<RegradingRequestCommand> logger,
        IRegradingRequestQuery regradingRequestQuery)
    {
        _repository = repository;
        _submissionRepository = submissionRepository;
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
