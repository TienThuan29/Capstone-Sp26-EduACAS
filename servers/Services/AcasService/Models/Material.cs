using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Material
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string LecturerId { get; set; } = string.Empty;
    
    [Required]
    public string ClassroomId { get; set; } = string.Empty;
    
    [Required]
    public string Filename { get; set; } = string.Empty;
    
    public string FileUrl { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public bool IsDeleted { get; set; }
    
    public DateTime CreatedDate { get; set; }
}