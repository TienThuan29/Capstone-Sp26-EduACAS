using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ClassroomTableName")]
public class Classroom
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string ClassCode { get; set; } = string.Empty;
    
    [Required]
    public string ClassName { get; set; } = string.Empty;
    
    [Required]
    public string LecturerId { get; set; } = string.Empty;
    
    [Required]
    public string SubjectId { get; set; } = string.Empty;
    
    [Required]
    public string SemesterName { get; set; } = string.Empty;
    
    [Required]
    public string EnrolKey { get; set; } = string.Empty;

    public int MaxSlot {get; set; } 
    
    public DateTime CreatedDate { get; set; }
    
    public DateTime? UpdatedDate { get; set; }
    
    public DateTime EndDate { get; set; }
    
    public bool IsDeleted { get; set; }
}