using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Slot
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ClassroomId { get; set; } = string.Empty;
    
    [Required]
    public string SlotNumber { get; set; } = string.Empty;
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime? UpdatedDate { get; set; }
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
}
