using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs
{
    public class DiscussionIssueResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("classroomId")]
        public string ClassroomId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("authorId")]
        public string AuthorId { get; set; } = string.Empty;

        [JsonPropertyName("authorName")]
        public string AuthorName { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("imagesName")]
        public string[] ImagesName { get; set; } = Array.Empty<string>();

        [JsonPropertyName("filesName")]
        public string[] FilesName { get; set; } = Array.Empty<string>();

        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }

        [JsonPropertyName("commentCount")]
        public int CommentCount { get; set; }

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; }

        [JsonPropertyName("updatedDate")]
        public DateTime UpdatedDate { get; set; }
    }
}
