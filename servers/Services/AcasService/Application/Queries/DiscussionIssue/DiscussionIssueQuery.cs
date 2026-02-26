using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.DiscussionIssue;

namespace AcasService.Application.Queries.DiscussionIssue;

public interface IDiscussionIssueQuery
{
    Task<PagedResult<DiscussionIssueListResponse>> GetPagedByClassroomIdAsync(
        string classroomId,
        int pageIndex = 1,
        int pageSize = 10);

    Task<int> GetCountByClassroomIdAsync(string classroomId);

    Task<DiscussionIssueDetailResponse?> GetByIdAsync(string discussionId);
}

public class DiscussionIssueQuery : IDiscussionIssueQuery
{
    private readonly IDiscussionIssueRepository _repository;
    private readonly DiscussionIssueMapper _discussionIssueMapper;
    private readonly ILogger<DiscussionIssueQuery> _logger;

    public DiscussionIssueQuery(
        IDiscussionIssueRepository repository,
        DiscussionIssueMapper discussionIssueMapper,
        ILogger<DiscussionIssueQuery> logger)
    {
        _repository = repository;
        _discussionIssueMapper = discussionIssueMapper;
        _logger = logger;
    }

    public async Task<PagedResult<DiscussionIssueListResponse>> GetPagedByClassroomIdAsync(
        string classroomId,
        int pageIndex = 1,
        int pageSize = 10)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var all = await _repository.FindByClassroomIdAsync(classroomId);
        var ordered = all.OrderByDescending(x => x.CreatedDate).ToList();
        var totalCount = ordered.Count;
        var items = ordered.Select(_discussionIssueMapper.ToListResponse).ToList();

        return new PagedResult<DiscussionIssueListResponse>(items, totalCount, pageIndex, pageSize);
    }

    public async Task<int> GetCountByClassroomIdAsync(string classroomId)
    {
        return await _repository.CountByClassroomIdAsync(classroomId);
    }

    public async Task<DiscussionIssueDetailResponse?> GetByIdAsync(string discussionId)
    {
        var issue = await _repository.FindByIdAsync(discussionId);
        return issue == null ? null : _discussionIssueMapper.ToDetailResponse(issue);
    }
}
