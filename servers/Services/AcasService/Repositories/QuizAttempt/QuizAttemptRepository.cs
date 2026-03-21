using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;

namespace AcasService.Repositories.QuizAttempt;

public class QuizAttemptRepository : DynamoRepository, IQuizAttemptRepository
{
    private readonly string _quizAttemptTableName;
    private readonly IConfiguration _configuration;

    public QuizAttemptRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<QuizAttemptRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _quizAttemptTableName = configuration["DynamoDB:QuizAttemptTableName"] ??
                     throw new ArgumentNullException("DynamoDB:QuizAttemptTableName is not configured");
        base.TableName = _quizAttemptTableName;
    }

    public Task<Models.QuizAttempt?> CreateAsync(Models.QuizAttempt quizAttempt)
    {
        throw new NotImplementedException();
    }

    public Task<Models.QuizAttempt?> FindByIdAsync(string quizAttemptId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.QuizAttempt>> FindAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.QuizAttempt>> FindByClassroomQuizIdAsync(string classroomQuizId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.QuizAttempt>> FindByStudentIdAsync(string studentId)
    {
        throw new NotImplementedException();
    }

    public Task<Models.QuizAttempt?> UpdateAsync(Models.QuizAttempt quizAttempt)
    {
        throw new NotImplementedException();
    }

    public Task DeleteAsync(string quizAttemptId)
    {
        throw new NotImplementedException();
    }
}
