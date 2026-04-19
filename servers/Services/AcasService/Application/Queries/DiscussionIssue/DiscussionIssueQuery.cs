using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
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
    Task<PagedResult<DiscussionIssueListResponse>> GetAllDiscussionIssuesAsync(
        string? search = null,
        int pageIndex = 1,
        int pageSize = 10);
}

public class DiscussionIssueQuery : IDiscussionIssueQuery
{
    private readonly IDiscussionIssueRepository _discussionIssueRepository;
    private readonly DiscussionIssueMapper _discussionIssueMapper;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<DiscussionIssueQuery> _logger;

    public DiscussionIssueQuery(
        IDiscussionIssueRepository discussionIssueRepository,
        DiscussionIssueMapper discussionIssueMapper,
        UserRequestProducer userRequestProducer,
        ILogger<DiscussionIssueQuery> logger)
    {
        _discussionIssueRepository = discussionIssueRepository;
        _discussionIssueMapper = discussionIssueMapper;
        _userRequestProducer = userRequestProducer;
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

        var (items, totalCount) = await _discussionIssueRepository.FindPagedByClassroomIdAsync(classroomId, pageIndex, pageSize);

        var responses = items
            .Select(_discussionIssueMapper.ToListResponse)
            .ToList();

        await EnrichListWithAuthorsAsync(responses);

        return new PagedResult<DiscussionIssueListResponse>(responses, totalCount, pageIndex, pageSize);
    }

    public async Task<int> GetCountByClassroomIdAsync(string classroomId)
    {
        return await _discussionIssueRepository.CountByClassroomIdAsync(classroomId);
    }

    public async Task<DiscussionIssueDetailResponse?> GetByIdAsync(string discussionId)
    {
        var issue = await _discussionIssueRepository.FindByIdAsync(discussionId);
        if (issue == null) return null;

        var detail = _discussionIssueMapper.ToDetailResponse(issue);
        await EnrichDetailWithAuthorsAsync(detail);
        return detail;
    }

    public async Task<PagedResult<DiscussionIssueListResponse>> GetAllDiscussionIssuesAsync(
        string? search = null,
        int pageIndex = 1,
        int pageSize = 10)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var (items, totalCount) = await _discussionIssueRepository.FindPagedAsync(search, pageIndex, pageSize);

        var responses = items
            .Select(_discussionIssueMapper.ToListResponse)
            .ToList();

        await EnrichListWithAuthorsAsync(responses);

        return new PagedResult<DiscussionIssueListResponse>(responses, totalCount, pageIndex, pageSize);
    }

    private async Task EnrichListWithAuthorsAsync(List<DiscussionIssueListResponse> items)
    {
        var authorIds = items.Select(x => x.AuthorId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        var authorMap = await FetchAuthorDisplayMapAsync(authorIds);
        foreach (var item in items)
        {
            if (authorMap.TryGetValue(item.AuthorId, out var author))
                item.AuthorDisplay = author;
        }
    }

    private async Task EnrichDetailWithAuthorsAsync(DiscussionIssueDetailResponse detail)
    {
        var authorIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(detail.AuthorId)) authorIds.Add(detail.AuthorId);
        CollectCommentAuthorIds(detail.Comments, authorIds);
        var authorMap = await FetchAuthorDisplayMapAsync(authorIds.ToList());
        if (authorMap.TryGetValue(detail.AuthorId, out var issueAuthor))
            detail.AuthorDisplay = issueAuthor;
        ApplyAuthorDisplayToComments(detail.Comments, authorMap);
    }

    private void CollectCommentAuthorIds(List<CommentResponse> comments, HashSet<string> authorIds)
    {
        if (comments == null) return;
        foreach (var c in comments)
        {
            if (!string.IsNullOrEmpty(c.AuthorId)) authorIds.Add(c.AuthorId);
            CollectCommentAuthorIds(c.Replies, authorIds);
        }
    }

    private void ApplyAuthorDisplayToComments(List<CommentResponse> comments, IReadOnlyDictionary<string, AuthorDisplayResponse> authorMap)
    {
        if (comments == null) return;
        foreach (var c in comments)
        {
            if (authorMap.TryGetValue(c.AuthorId, out var author))
                c.AuthorDisplay = author;
            ApplyAuthorDisplayToComments(c.Replies, authorMap);
        }
    }

    private async Task<Dictionary<string, AuthorDisplayResponse>> FetchAuthorDisplayMapAsync(List<string> authorIds)
    {
        var result = new Dictionary<string, AuthorDisplayResponse>(StringComparer.OrdinalIgnoreCase);
        var distinctIds = authorIds.Distinct().Where(id => !string.IsNullOrEmpty(id)).ToList();
        if (distinctIds.Count == 0) return result;

        var users = await _userRequestProducer.GetUsersByIdsAsync(distinctIds);
        foreach (var user in users)
        {
            if (user != null && !string.IsNullOrEmpty(user.Id))
                result[user.Id] = new AuthorDisplayResponse
                {
                    FullName = user.Fullname ?? string.Empty,
                    AvatarUrl = user.AvatarUrl ?? string.Empty,
                    Email = user.Email ?? string.Empty
                };
        }
        return result;
    }
}
