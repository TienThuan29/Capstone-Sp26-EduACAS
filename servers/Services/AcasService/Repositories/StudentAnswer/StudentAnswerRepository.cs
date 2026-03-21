using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;

namespace AcasService.Repositories.StudentAnswer;

public class StudentAnswerRepository : DynamoRepository, IStudentAnswerRepository
{
    private readonly string _studentAnswerTableName;
    private readonly IConfiguration _configuration;

    public StudentAnswerRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<StudentAnswerRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _studentAnswerTableName = configuration["DynamoDB:StudentAnswerTableName"] ??
                     throw new ArgumentNullException("DynamoDB:StudentAnswerTableName is not configured");
        base.TableName = _studentAnswerTableName;
    }

    public Task<Models.StudentAnswer?> CreateAsync(Models.StudentAnswer studentAnswer)
    {
        throw new NotImplementedException();
    }

    public Task<Models.StudentAnswer?> FindByIdAsync(string studentAnswerId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.StudentAnswer>> FindByAttemptIdAsync(string attemptId)
    {
        throw new NotImplementedException();
    }

    public Task<Models.StudentAnswer?> UpdateAsync(Models.StudentAnswer studentAnswer)
    {
        throw new NotImplementedException();
    }

    public Task DeleteAsync(string studentAnswerId)
    {
        throw new NotImplementedException();
    }
}
