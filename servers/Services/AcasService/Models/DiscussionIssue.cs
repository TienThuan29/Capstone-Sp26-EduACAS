using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class DiscussionIssue
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ClassroomId { get; set; } = string.Empty;
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string AuthorId { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty; // markdown content
    
    public string[] ImagesName { get; set; } = Array.Empty<string>();
    
    public string[] FilesName { get; set; } = Array.Empty<string>();
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime UpdatedDate { get; set; }
}