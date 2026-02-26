using System.ComponentModel.DataAnnotations;

namespace AcasService.Web.Requests
{
    public class CreateDiscussionIssueRequest
    {
        [Required(ErrorMessage = "Classroom ID is required")]
        public string ClassroomId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Title is required")]
        [StringLength(300, ErrorMessage = "Title cannot exceed 300 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Author ID is required")]
        public string AuthorId { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public string[] ImagesName { get; set; } = Array.Empty<string>();

        public string[] FilesName { get; set; } = Array.Empty<string>();
    }

    public class UpdateDiscussionIssueRequest
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(300, ErrorMessage = "Title cannot exceed 300 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public string[] ImagesName { get; set; } = Array.Empty<string>();

        public string[] FilesName { get; set; } = Array.Empty<string>();
    }

    public class CreateCommentRequest
    {
        [Required(ErrorMessage = "Discussion Issue ID is required")]
        public string DiscussionIssueId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Author ID is required")]
        public string AuthorId { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public string[] ImagesName { get; set; } = Array.Empty<string>();

        public string[] FilesName { get; set; } = Array.Empty<string>();
    }

    public class UpdateCommentRequest
    {
        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; } = string.Empty;

        public string[] ImagesName { get; set; } = Array.Empty<string>();

        public string[] FilesName { get; set; } = Array.Empty<string>();
    }
}
