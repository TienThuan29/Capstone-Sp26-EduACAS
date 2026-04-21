using Amazon.DynamoDBv2.DataModel;
using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("ErrorGroupTableName")]
public class ErrorGroup
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string ProblemId { get; set; } = string.Empty;

    public string ExamId { get; set; } = string.Empty;

    public string ErrorSignature { get; set; } = string.Empty;

    public JPlagStatus JPlagStatus { get; set; } = JPlagStatus.PENDING; 

    public List<string> SubmissionIds { get; set; } = new List<string>();

    public List<JPlagMatch> JPlagResults { get; set; } = new List<JPlagMatch>();
    
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}

public class JPlagMatch
{
    public string Submission1Id { get; set; } = string.Empty;
    public string Submission2Id { get; set; } = string.Empty;
    public float SimilarityScore { get; set; } 
    public List<JPlagMatchDetail> Details { get; set; } = new List<JPlagMatchDetail>();
}

public class JPlagMatchDetail
{
    public int StartLine1 { get; set; }
    public int EndLine1 { get; set; }
    public int StartLine2 { get; set; }
    public int EndLine2 { get; set; }
    public int Tokens { get; set; }
}

public enum JPlagStatus
{
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED
}