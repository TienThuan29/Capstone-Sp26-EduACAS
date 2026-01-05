using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Subject
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string SubjectCode { get; set; } = string.Empty;
    
    [Required]
    public string SubjectName { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string CreatedBy { get; set; } = string.Empty;
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime? UpdatedDate { get; set; }
}