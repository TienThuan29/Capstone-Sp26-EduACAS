namespace AcasService.Repositories.Comment;

public interface ICommentRepository
{
    Task<Models.Comment?> CreateAsync(Models.Comment comment);
    Task<Models.Comment?> FindByIdAsync(string commentId);
    Task<List<Models.Comment>> FindByDiscussionIssueIdAsync(string discussionIssueId);
    Task<int> CountByDiscussionIssueIdAsync(string discussionIssueId);
    Task<Models.Comment?> UpdateAsync(Models.Comment comment);
    Task SoftDeleteAsync(string commentId);
    Task DeleteAsync(string commentId);
}