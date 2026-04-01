namespace AcasService.Application.ResponseDTOs;

public class QuizResponse
{
    public string Id { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int TotalQuestions { get; set; }
    public bool IsDeleted { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<QuizQuestionResponse> Questions { get; set; } = new();
}

public class QuizQuestionResponse
{
    public string QuizId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public double Marks { get; set; }
    public int DisplayOrder { get; set; }
}
