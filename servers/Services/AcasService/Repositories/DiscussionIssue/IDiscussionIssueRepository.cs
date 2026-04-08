namespace AcasService.Repositories.DiscussionIssue;

public interface IDiscussionIssueRepository
{
    Task<Models.DiscussionIssue?> CreateAsync(Models.DiscussionIssue issue);
    Task<Models.DiscussionIssue?> FindByIdAsync(string id);
    Task<List<Models.DiscussionIssue>> FindByClassroomIdAsync(string classroomId);
    Task<int> CountByClassroomIdAsync(string classroomId);
    Task<Models.DiscussionIssue?> UpdateAsync(Models.DiscussionIssue issue);
    Task<List<Models.DiscussionIssue>> FindAllAsync();
    Task SoftDeleteAsync(string id);
    Task DeleteAsync(string id);
}
