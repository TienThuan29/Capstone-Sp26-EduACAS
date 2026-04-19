using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.RegradingRequest;
using AcasService.Repositories.Submission;

namespace AcasService.Application.Queries.RegradingRequests;

public interface IRegradingRequestQuery
{
    Task<RegradingRequestResponse> GetByIdAsync(string id);
    Task<List<RegradingRequestResponse>> GetByStudentIdAsync(string studentId);
    Task<List<RegradingRequestResponse>> GetByExamIdAsync(string examId);
    Task<List<RegradingRequestResponse>> GetBySubmissionIdAsync(string submissionId);
    Task<PagedResult<RegradingRequestResponse>> GetAllPagedAsync(
        int pageIndex,
        int pageSize,
        string? studentId = null,
        string? examId = null,
        RegradingRequestStatus? status = null);
}

public class RegradingRequestQuery : IRegradingRequestQuery
{
    private readonly IRegradingRequestRepository _repository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<RegradingRequestQuery> _logger;

    public RegradingRequestQuery(
        IRegradingRequestRepository repository,
        ISubmissionRepository submissionRepository,
        UserRequestProducer userRequestProducer,
        ILogger<RegradingRequestQuery> logger)
    {
        _repository = repository;
        _submissionRepository = submissionRepository;
        _userRequestProducer = userRequestProducer;
        _logger = logger;
    }

    public async Task<RegradingRequestResponse> GetByIdAsync(string id)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null)
        {
            _logger.LogWarning("RegradingRequest not found with id {Id}", id);
            throw new KeyNotFoundException($"RegradingRequest with id {id} not found");
        }

        return await BuildEnrichedResponseAsync(request);
    }

    public async Task<List<RegradingRequestResponse>> GetByStudentIdAsync(string studentId)
    {
        var requests = await _repository.GetByStudentIdAsync(studentId);
        if (requests.Count == 0)
            return new List<RegradingRequestResponse>();

        return await BuildEnrichedResponsesAsync(requests);
    }

    public async Task<List<RegradingRequestResponse>> GetByExamIdAsync(string examId)
    {
        var requests = await _repository.GetByExamIdAsync(examId);
        if (requests.Count == 0)
            return new List<RegradingRequestResponse>();

        return await BuildEnrichedResponsesAsync(requests);
    }

    public async Task<List<RegradingRequestResponse>> GetBySubmissionIdAsync(string submissionId)
    {
        var requests = await _repository.GetBySubmissionIdAsync(submissionId);
        if (requests.Count == 0)
            return new List<RegradingRequestResponse>();

        return await BuildEnrichedResponsesAsync(requests);
    }

    public async Task<PagedResult<RegradingRequestResponse>> GetAllPagedAsync(
        int pageIndex,
        int pageSize,
        string? studentId = null,
        string? examId = null,
        RegradingRequestStatus? status = null)
    {
        var pagedRequests = await _repository.GetAllPagedAsync(pageIndex, pageSize, studentId, examId, status);
        
        if (pagedRequests.Items.Count == 0)
        {
            return new PagedResult<RegradingRequestResponse>(
                new List<RegradingRequestResponse>(),
                pagedRequests.TotalCount,
                pagedRequests.PageIndex,
                pagedRequests.PageSize
            );
        }

        var enrichedItems = await BuildEnrichedResponsesAsync(pagedRequests.Items);

        return new PagedResult<RegradingRequestResponse>(
            enrichedItems,
            pagedRequests.TotalCount,
            pagedRequests.PageIndex,
            pagedRequests.PageSize
        );
    }

    private async Task<List<RegradingRequestResponse>> BuildEnrichedResponsesAsync(List<RegradingRequest> requests)
    {
        if (requests.Count == 0)
            return new List<RegradingRequestResponse>();

        var studentIds = requests.Select(r => r.StudentId).Distinct().ToList();
        var submissionIds = requests
            .Select(r => r.SubmissionId)
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        var profilesTask = _userRequestProducer.GetUsersByIdsAsync(studentIds);
        var submissionsTask = FetchSubmissionsBatchAsync(submissionIds);

        await Task.WhenAll(profilesTask, submissionsTask);

        var profileMap = profilesTask.Result.ToDictionary(p => p.Id);
        var submissionMap = submissionsTask.Result;

        return requests.Select(request => MapToResponse(request, profileMap, submissionMap)).ToList();
    }

    private async Task<RegradingRequestResponse> BuildEnrichedResponseAsync(RegradingRequest request)
    {
        var profileMap = new Dictionary<string, UserProfileResponse>();
        var submissionMap = new Dictionary<string, Models.Submission>();

        if (!string.IsNullOrEmpty(request.StudentId))
        {
            var profiles = await _userRequestProducer.GetUsersByIdsAsync(new List<string> { request.StudentId });
            if (profiles.Count > 0)
            {
                profileMap[request.StudentId] = profiles[0];
            }
        }

        if (!string.IsNullOrEmpty(request.SubmissionId))
        {
            var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId);
            if (submission != null)
            {
                submissionMap[request.SubmissionId] = submission;
            }
        }

        return MapToResponse(request, profileMap, submissionMap);
    }

    private async Task<Dictionary<string, Models.Submission>> FetchSubmissionsBatchAsync(List<string> submissionIds)
    {
        var result = new Dictionary<string, Models.Submission>();

        if (submissionIds.Count == 0)
            return result;

        foreach (var submissionId in submissionIds)
        {
            var submission = await _submissionRepository.GetByIdAsync(submissionId);
            if (submission != null)
            {
                result[submissionId] = submission;
            }
        }

        return result;
    }

    private RegradingRequestResponse MapToResponse(
        RegradingRequest request,
        Dictionary<string, UserProfileResponse> profileMap,
        Dictionary<string, Models.Submission> submissionMap)
    {
        var response = new RegradingRequestResponse
        {
            Id = request.Id,
            ExaminationId = request.ExaminationId,
            SubmissionId = request.SubmissionId,
            StudentId = request.StudentId,
            Reason = request.Reason,
            ImageUrls = request.ImageUrls ?? new List<string>(),
            CreatedDate = request.CreatedDate,
            Status = request.Status,
            StatusName = request.Status.ToString(),
            LecturerNote = request.LecturerNote,
            HandledDate = request.HandledDate == default ? null : request.HandledDate
        };

        if (profileMap.TryGetValue(request.StudentId, out var profile))
        {
            response.StudentName = profile.Fullname;
            response.StudentEmail = profile.Email;
        }

        if (!string.IsNullOrEmpty(request.SubmissionId) &&
            submissionMap.TryGetValue(request.SubmissionId, out var submission))
        {
            response.Submission = new SubmissionLiteResponse
            {
                Id = submission.Id,
                StudentId = submission.StudentId,
                ExamId = submission.ExamId,
                ProblemId = submission.ProblemId,
                FinalScore = submission.FinalScore,
                SubmittedDate = submission.SubmittedDate
            };
        }

        return response;
    }
}