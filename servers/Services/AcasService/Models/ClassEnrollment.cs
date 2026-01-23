using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class ClassEnrollment
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ClassId { get; set; } = string.Empty;
    
    [Required]
    public string StudentId { get; set; } = string.Empty;
      public DateTime JoinedDate { get; set; }
    
    public DateTime? MovedOutDate { get; set; }
    
    public bool IsJoining { get; set; }
}