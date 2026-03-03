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
}

public class DiscussionIssueQuery : IDiscussionIssueQuery
{
    private readonly IDiscussionIssueRepository _repository;
    private readonly DiscussionIssueMapper _discussionIssueMapper;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<DiscussionIssueQuery> _logger;

    public DiscussionIssueQuery(
        IDiscussionIssueRepository repository,
        DiscussionIssueMapper discussionIssueMapper,
        UserRequestProducer userRequestProducer,
        ILogger<DiscussionIssueQuery> logger)
    {
        _repository = repository;
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

        var all = await _repository.FindByClassroomIdAsync(classroomId);
        var ordered = all.OrderByDescending(x => x.CreatedDate).ToList();
        var totalCount = ordered.Count;
        var items = ordered
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(_discussionIssueMapper.ToListResponse)
            .ToList();

        await EnrichListWithAuthorsAsync(items);

        return new PagedResult<DiscussionIssueListResponse>(items, totalCount, pageIndex, pageSize);
    }

    public async Task<int> GetCountByClassroomIdAsync(string classroomId)
    {
        return await _repository.CountByClassroomIdAsync(classroomId);
    }

    public async Task<DiscussionIssueDetailResponse?> GetByIdAsync(string discussionId)
    {
        var issue = await _repository.FindByIdAsync(discussionId);
        if (issue == null) return null;

        var detail = _discussionIssueMapper.ToDetailResponse(issue);
        await EnrichDetailWithAuthorsAsync(detail);
        return detail;
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
        var tasks = authorIds.Distinct().Select(async id =>
        {
            var user = await _userRequestProducer.GetUserByIdAsync(id);
            return (Id: id, User: user);
        });
        var pairs = await Task.WhenAll(tasks);
        foreach (var (id, user) in pairs)
        {
            if (user != null)
                result[id] = new AuthorDisplayResponse
                {
                    FullName = user.Fullname ?? string.Empty,
                    AvatarUrl = user.AvatarUrl ?? string.Empty
                };
        }
        return result;
    }
}
