using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.DiscussionIssue;

namespace AcasService.Application.Queries.AdminDiscussionStatistics;

public interface IAdminDiscussionStatisticsQuery
{
    Task<AdminDiscussionStatisticsResponse> GetDiscussionStatisticsAsync(CancellationToken cancellationToken = default);
}

public class AdminDiscussionStatisticsQuery : IAdminDiscussionStatisticsQuery
{
    private readonly ILogger<AdminDiscussionStatisticsQuery> _logger;
    private readonly IDiscussionIssueRepository _discussionIssueRepository;
    private readonly IClassroomRepository _classroomRepository;

    public AdminDiscussionStatisticsQuery(
        ILogger<AdminDiscussionStatisticsQuery> logger,
        IDiscussionIssueRepository discussionIssueRepository,
        IClassroomRepository classroomRepository)
    {
        _logger = logger;
        _discussionIssueRepository = discussionIssueRepository;
        _classroomRepository = classroomRepository;
    }

    public async Task<AdminDiscussionStatisticsResponse> GetDiscussionStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var allIssues = await _discussionIssueRepository.FindAllAsync();
        var classrooms = await _classroomRepository.FindAllAsync();

        var classroomDict = classrooms.ToDictionary(c => c.Id, c => c);
        var totalComments = 0;
        var totalViews = 0;
        var activeCount = 0;
        var closedCount = 0;

        var byClassroom = new Dictionary<string, ClassroomDiscussionItem>();

        foreach (var issue in allIssues)
        {
            totalViews += issue.ViewCount;

            if (issue.Status == DiscussionIssueStatus.OPEN)
                activeCount++;
            else
                closedCount++;

            if (!byClassroom.ContainsKey(issue.ClassroomId))
            {
                classroomDict.TryGetValue(issue.ClassroomId, out var classroom);
                byClassroom[issue.ClassroomId] = new ClassroomDiscussionItem
                {
                    ClassroomId = issue.ClassroomId,
                    ClassroomName = classroom?.ClassName ?? "Unknown Classroom",
                };
            }

            var item = byClassroom[issue.ClassroomId];
            item.TotalDiscussions++;

            if (issue.Status == DiscussionIssueStatus.OPEN)
                item.ActiveDiscussions++;
            else
                item.ClosedDiscussions++;

            var issueCommentCount = CountComments(issue.Comments);
            totalComments += issueCommentCount;
            item.TotalComments += issueCommentCount;
        }

        return new AdminDiscussionStatisticsResponse
        {
            TotalDiscussions = allIssues.Count,
            ActiveDiscussions = activeCount,
            ClosedDiscussions = closedCount,
            TotalComments = totalComments,
            TotalViews = totalViews,
            DiscussionsByClassroom = byClassroom.Values
                .OrderByDescending(x => x.TotalDiscussions)
                .ToList(),
        };
    }

    private static int CountComments(List<Comment> comments)
    {
        if (comments == null || comments.Count == 0) return 0;
        var count = comments.Count;
        foreach (var comment in comments)
        {
            count += CountComments(comment.Replies ?? new List<Models.Comment>());
        }
        return count;
    }
}
