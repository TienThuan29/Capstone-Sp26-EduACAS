using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class RegradingRequest
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    private string ExaminationId { get; set; } = string.Empty;
    
    private string ProblemId { get; set; } = string.Empty;
    
    private string SubmissionId { get; set; } = string.Empty;
    
    [Required]
    public string StudentId { get; set; } = string.Empty;
    
    [Required]
    public string Reason { get; set; } = string.Empty;
    
    public DateTime CreatedDate { get; set; }
    
    [Required]
    public RegradingRequestStatus Status { get; set; }
    
    public string LecturerNote { get; set; } = string.Empty;
    
    public DateTime HandledDate { get; set; }
}

public enum RegradingRequestStatus
{
    PENDING,
    APPROVED,
    REJECTED,
    CANCELED
}