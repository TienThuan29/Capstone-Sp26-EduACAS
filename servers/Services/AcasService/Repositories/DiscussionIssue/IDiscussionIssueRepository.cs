namespace AcasService.Repositories.DiscussionIssue;

public interface IDiscussionIssueRepository
{
    Task<Models.DiscussionIssue?> CreateAsync(Models.DiscussionIssue issue);
    Task<Models.DiscussionIssue?> FindByIdAsync(string id);
    Task<List<Models.DiscussionIssue>> FindByClassroomIdAsync(string classroomId);
    Task<(List<Models.DiscussionIssue> Items, int TotalCount)> FindPagedByClassroomIdAsync(string classroomId, int pageIndex, int pageSize);
    Task<int> CountByClassroomIdAsync(string classroomId);
    Task<Models.DiscussionIssue?> UpdateAsync(Models.DiscussionIssue issue);
    Task<List<Models.DiscussionIssue>> FindAllAsync();
    Task<(List<Models.DiscussionIssue> Items, int TotalCount)> FindPagedAsync(string? search, int pageIndex, int pageSize);
    Task SoftDeleteAsync(string id);
    Task DeleteAsync(string id);
}
