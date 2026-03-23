using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("AnswerOptionTableName")]
public class AnswerOption
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string QuestionId { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
