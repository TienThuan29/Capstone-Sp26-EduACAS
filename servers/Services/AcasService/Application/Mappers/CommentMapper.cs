using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers
{
    public class CommentMapper
    {
        public CommentResponse ToResponse(Comment comment)
        {
            return new CommentResponse
            {
                Id = comment.Id,
                DiscussionIssueId = comment.DiscussionIssueId,
                AuthorId = comment.AuthorId,
                AuthorName = comment.AuthorName,
                Content = comment.Content,
                ImagesName = comment.ImagesName,
                FilesName = comment.FilesName,
                IsDeleted = comment.IsDeleted,
                CreatedDate = comment.CreatedDate,
                UpdatedDate = comment.UpdatedDate
            };
        }
    }
}
