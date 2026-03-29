using System.Linq;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.DynamoDB;

public class DynamoDbHostedService : IHostedService
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly ILogger<DynamoDbHostedService> _logger;
    private readonly IReadOnlyCollection<string> _tablesToWarmUp;

    public DynamoDbHostedService(
        IAmazonDynamoDB dynamoDb,
        IConfiguration configuration,
        ILogger<DynamoDbHostedService> logger)
    {
        _dynamoDb = dynamoDb;
        _logger = logger;
        _tablesToWarmUp = BuildWarmUpTableList(configuration);
    }
    
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        if (_tablesToWarmUp.Count == 0)
        {
            _logger.LogInformation("No DynamoDB tables configured for warm-up");
            return;
        }

        foreach (var tableName in _tablesToWarmUp)
        {
            try
            {
                _logger.LogInformation("Warming up DynamoDB table: {Table}", tableName);
                await _dynamoDb.DescribeTableAsync(new DescribeTableRequest
                {
                    TableName = tableName
                }, linkedCts.Token);
                _logger.LogInformation("DynamoDB table warm-up completed: {Table}", tableName);
            }
            catch (ResourceNotFoundException)
            {
                _logger.LogWarning("DynamoDB table not found (may belong to another service): {Table}", tableName);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("DynamoDB warm-up timed out for table: {Table}; continuing startup", tableName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DynamoDB warm-up failed for table: {Table}; will retry on first real call", tableName);
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static IReadOnlyCollection<string> BuildWarmUpTableList(IConfiguration configuration)
    {
        var tables = new[]
        {
            configuration["DynamoDB:ClassroomTableName"] ?? "acas-classrooms",
            configuration["DynamoDB:ClassroomEnrollmentTableName"] ?? "acas-classroom-enrollments",
            configuration["DynamoDB:CommentTableName"] ?? "acas-comments",
            configuration["DynamoDB:DiscussionIssueTableName"] ?? "acas-discussion-issues",
            configuration["DynamoDB:ExaminationTableName"] ?? "acas-examinations",
            configuration["DynamoDB:MaterialTableName"] ?? "acas-materials",
            configuration["DynamoDB:ProblemTableName"] ?? "acas-problems",
            configuration["DynamoDB:ProgrammingLanguageTableName"] ?? "acas-programming-languages",
            configuration["DynamoDB:RegradingRequestTableName"] ?? "acas-regrading-requests",
            configuration["DynamoDB:SubjectTableName"] ?? "acas-subjects",
            configuration["DynamoDB:SubmissionTableName"] ?? "acas-submissions",
            configuration["DynamoDB:NotificationTableName"] ?? "acas-notifications",
            configuration["DynamoDB:SlotTableName"] ?? "acas-slots",
            configuration["DynamoDB:KeystrokeLogsTableName"] ?? "keystrokelogs",
            configuration["DynamoDB:QuizTableName"] ?? "acas-quizzes",
            configuration["DynamoDB:QuestionTableName"] ?? "acas-questions",
            configuration["DynamoDB:AnswerOptionTableName"] ?? "acas-answer-options",
            configuration["DynamoDB:ClassroomQuizTableName"] ?? "acas-classroom-quizzes",
            configuration["DynamoDB:QuizAttemptTableName"] ?? "acas-quiz-attempts",
            configuration["DynamoDB:StudentAnswerTableName"] ?? "acas-student-answers",
            configuration["DynamoDB:ErrorGroupTableName"] ?? "acas-error-groups"
        };

        return tables
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
