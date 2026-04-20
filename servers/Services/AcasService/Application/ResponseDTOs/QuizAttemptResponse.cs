using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class QuizAttemptResponse
{
    public string Id { get; set; } = string.Empty;
    public string ClassroomQuizId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public double? Score { get; set; }
    public int AttemptNumber { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string QuizTitle { get; set; } = string.Empty;
    public int Duration { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public Dictionary<string, bool> QuestionResults { get; set; } = new();
    public List<StudentQuizQuestionResponse> Questions { get; set; } = new();
    public Dictionary<string, string> Answers { get; set; } = new();
}

public class StudentQuizQuestionResponse
{
    public string Id { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public string? TextAnswer { get; set; }
    public string? ImageUrl { get; set; }
    public int CorrectCount { get; set; }
    public double Marks { get; set; }
    public int DisplayOrder { get; set; }
    public List<StudentAnswerOptionResponse> Options { get; set; } = new();
}

public class StudentAnswerOptionResponse
{
    public string Id { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
