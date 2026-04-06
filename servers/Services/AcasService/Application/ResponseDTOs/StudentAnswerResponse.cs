namespace AcasService.Application.ResponseDTOs;

public class StudentAnswerResponse
{
    public string Id { get; set; } = string.Empty;
    public string AttemptId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string? AnswerOptionId { get; set; }
    public string? TextAnswer { get; set; }
    public bool IsCorrect { get; set; }
}