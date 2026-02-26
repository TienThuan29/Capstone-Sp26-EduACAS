namespace AcasService.Repositories.DiscussionIssue;

public interface IDiscussionIssueRepository
{
    Task<Models.DiscussionIssue?> CreateAsync(Models.DiscussionIssue issue);
    Task<Models.DiscussionIssue?> FindByIdAsync(string issueId);
    Task<List<Models.DiscussionIssue>> FindAllAsync();
    Task<List<Models.DiscussionIssue>> FindByClassroomIdAsync(string classroomId);
    Task<Models.DiscussionIssue?> UpdateAsync(Models.DiscussionIssue issue);
    Task SoftDeleteAsync(string issueId);
    Task DeleteAsync(string issueId);
}