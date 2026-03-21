using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;

namespace AcasService.Repositories.Quiz;

public class QuizRepository : DynamoRepository, IQuizRepository
{
    private readonly string _quizTableName;
    private readonly IConfiguration _configuration;

    public QuizRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<QuizRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _quizTableName = configuration["DynamoDB:QuizTableName"] ??
                     throw new ArgumentNullException("DynamoDB:QuizTableName is not configured");
        base.TableName = _quizTableName;
    }

    public Task<Models.Quiz?> CreateAsync(Models.Quiz quiz)
    {
        throw new NotImplementedException();
    }

    public Task<Models.Quiz?> FindByIdAsync(string quizId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.Quiz>> FindAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<Models.Quiz?> UpdateAsync(Models.Quiz quiz)
    {
        throw new NotImplementedException();
    }

    public Task SoftDeleteAsync(string quizId)
    {
        throw new NotImplementedException();
    }

    public Task DeleteAsync(string quizId)
    {
        throw new NotImplementedException();
    }
}
