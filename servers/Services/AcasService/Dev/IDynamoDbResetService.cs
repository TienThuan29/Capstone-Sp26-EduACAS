namespace AcasService.Dev;

public interface IDynamoDbResetService
{
    /// <summary>
    /// Wipes all discovered DynamoDB tables and re-seeds them with realistic mock data.
    /// Only safe to call in Development environment.
    /// </summary>
    Task<ResetResult> ResetAndSeedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Wipes all discovered DynamoDB tables and re-seeds them with seed-data-2.
    /// Only safe to call in Development environment.
    /// </summary>
    Task<ResetResult> ResetAndSeedSeedData2Async(CancellationToken cancellationToken = default);

    /// <summary>
    /// Wipes and re-seeds only quiz-related tables: Quiz, Question, and AnswerOption.
    /// Only safe to call in Development environment.
    /// </summary>
    Task<ResetResult> ResetAndSeedQuizDataAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Seeds quiz data (questions, answer options, quizzes, classroom quizzes, quiz attempts)
    /// for the Introduction to Programming class (cls-001) without wiping existing data.
    /// Creates rich realistic data for dashboard visualization including multi-attempt students.
    /// Only safe to call in Development environment.
    /// </summary>
    Task<ResetResult> SeedCls001QuizDataAsync(CancellationToken cancellationToken = default);
}

public record ResetResult(bool Success, int TablesWiped, int ItemsSeeded, string? ErrorMessage = null);
