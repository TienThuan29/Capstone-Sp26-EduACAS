using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers
{
    public class DiscussionIssueMapper
    {
        public DiscussionIssueResponse ToResponse(DiscussionIssue issue, int commentCount = 0)
        {
            return new DiscussionIssueResponse
            {
                Id = issue.Id,
                ClassroomId = issue.ClassroomId,
                Title = issue.Title,
                AuthorId = issue.AuthorId,
                AuthorName = issue.AuthorName,
                Content = issue.Content,
                ImagesName = issue.ImagesName,
                FilesName = issue.FilesName,
                IsDeleted = issue.IsDeleted,
                CommentCount = commentCount,
                CreatedDate = issue.CreatedDate,
                UpdatedDate = issue.UpdatedDate
            };
        }
    }
}
