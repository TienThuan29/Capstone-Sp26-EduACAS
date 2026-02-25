using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Comment
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string DiscussionIssueId { get; set; } = string.Empty;
    
    [Required]
    public string AuthorId { get; set; } = string.Empty;
    
    public string AuthorName { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty; // markdown content
    
    public string[] ImagesName { get; set; } = Array.Empty<string>();
    
    public string[] FilesName { get; set; } = Array.Empty<string>();
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}