using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("StudentAnswerTableName")]
public class StudentAnswer
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string AttemptId { get; set; } = string.Empty;

    [Required]
    public string QuestionId { get; set; } = string.Empty;

    public string? AnswerOptionId { get; set; }  

    public string? TextAnswer { get; set; } 

    public bool IsCorrect { get; set; }
}
