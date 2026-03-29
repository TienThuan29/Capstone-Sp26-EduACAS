using System.ComponentModel.DataAnnotations;
using AcasService.Dev;

namespace AcasService.Models;

[DynamoDBEntity("QuizTableName")]
public class Quiz
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string SubjectId { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public int Duration { get; set; } 

    public int TotalQuestions { get; set; }

    public bool IsDeleted { get; set; }

    [Required]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
}

public class QuizQuestion
{
    [Required]
    public string QuizId { get; set; } = string.Empty;

    [Required]
    public string QuestionId { get; set; } = string.Empty;

    public double Marks { get; set; }  

    public int DisplayOrder { get; set; }  
}
