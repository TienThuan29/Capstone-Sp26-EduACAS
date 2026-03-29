using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("QuestionTableName")]
public class Question
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    [Required]
    public QuestionType Type { get; set; }

    public string? TextAnswer { get; set; }

    public bool IsDeleted { get; set; }

    [Required]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<AnswerOption> AnswerOptions { get; set; } = new List<AnswerOption>();
}

public enum QuestionType
{
    MULTIPLE_CHOICE,
    SINGLE_CHOICE,
    ESSAY
}
