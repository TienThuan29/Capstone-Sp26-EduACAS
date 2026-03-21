using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;

namespace AcasService.Repositories.ClassroomQuiz;

public class ClassroomQuizRepository : DynamoRepository, IClassroomQuizRepository
{
    private readonly string _classroomQuizTableName;
    private readonly IConfiguration _configuration;

    public ClassroomQuizRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ClassroomQuizRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _classroomQuizTableName = configuration["DynamoDB:ClassroomQuizTableName"] ??
                     throw new ArgumentNullException("DynamoDB:ClassroomQuizTableName is not configured");
        base.TableName = _classroomQuizTableName;
    }

    public Task<Models.ClassroomQuiz?> CreateAsync(Models.ClassroomQuiz classroomQuiz)
    {
        throw new NotImplementedException();
    }

    public Task<Models.ClassroomQuiz?> FindByIdAsync(string classroomQuizId)
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.ClassroomQuiz>> FindAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<List<Models.ClassroomQuiz>> FindByClassroomIdAsync(string classroomId)
    {
        throw new NotImplementedException();
    }

    public Task<Models.ClassroomQuiz?> UpdateAsync(Models.ClassroomQuiz classroomQuiz)
    {
        throw new NotImplementedException();
    }

    public Task SoftDeleteAsync(string classroomQuizId)
    {
        throw new NotImplementedException();
    }

    public Task DeleteAsync(string classroomQuizId)
    {
        throw new NotImplementedException();
    }
}
