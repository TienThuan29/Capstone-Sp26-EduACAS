using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;

namespace AcasService.Repositories.Question;

public class QuestionRepository : DynamoRepository, IQuestionRepository
{
    private readonly string _questionTableName;
    private readonly IConfiguration _configuration;

    public QuestionRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<QuestionRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _questionTableName = configuration["DynamoDB:QuestionTableName"] ??
                     throw new ArgumentNullException("DynamoDB:QuestionTableName is not configured");
        base.TableName = _questionTableName;
    }

    public Task<Models.Question?> CreateAsync(Models.Question question)
    {
        throw new NotImplementedException();
    }

    public Task<Models.Question?> FindByIdAsync(string questionId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.Question>> FindAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<Models.Question?> UpdateAsync(Models.Question question)
    {
        throw new NotImplementedException();
    }

    public Task SoftDeleteAsync(string questionId)
    {
        throw new NotImplementedException();
    }

    public Task DeleteAsync(string questionId)
    {
        throw new NotImplementedException();
    }
}
