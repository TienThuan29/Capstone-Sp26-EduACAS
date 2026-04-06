using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

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

    public async Task<Models.ClassroomQuiz?> CreateAsync(Models.ClassroomQuiz classroomQuiz)
    {
        var item = DynamoMapper.ClassroomQuizToDynamoItem(classroomQuiz);
        await PutItemAsync(item, _classroomQuizTableName);
        return classroomQuiz;
    }

    public async Task<Models.ClassroomQuiz?> FindByIdAsync(string classroomQuizId)
    {
        var key = new Dictionary<string, AttributeValue> { ["id"] = new AttributeValue { S = classroomQuizId } };
        var response = await GetItemAsync(key, _classroomQuizTableName);
        return response.Item.Count > 0 ? DynamoMapper.DynamoItemToClassroomQuiz(response.Item) : null;
    }

    public async Task<List<Models.ClassroomQuiz>> FindAllAsync()
    {
        var response = await ScanAsync(_classroomQuizTableName);
        return response.Items.Select(DynamoMapper.DynamoItemToClassroomQuiz).ToList();
    }

    public async Task<List<Models.ClassroomQuiz>> FindByClassroomIdAsync(string classroomId)
    {
        var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest
        {
            TableName = _classroomQuizTableName,
            FilterExpression = "classroomId = :cid AND isDeleted = :deleted",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":cid"] = new AttributeValue { S = classroomId },
                [":deleted"] = new AttributeValue { BOOL = false }
            }
        };
        var response = await _dynamoDBClient.ScanAsync(scanRequest);
        return response.Items.Select(DynamoMapper.DynamoItemToClassroomQuiz).ToList();
    }

    public async Task<Models.ClassroomQuiz?> UpdateAsync(Models.ClassroomQuiz classroomQuiz)
    {
        var item = DynamoMapper.ClassroomQuizToDynamoItem(classroomQuiz);
        await PutItemAsync(item, _classroomQuizTableName);
        return classroomQuiz;
    }

    public async Task SoftDeleteAsync(string classroomQuizId)
    {
        var existing = await FindByIdAsync(classroomQuizId);
        if (existing != null)
        {
            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.UtcNow;
            await UpdateAsync(existing);
        }
    }

    public async Task DeleteAsync(string classroomQuizId)
    {
        var key = new Dictionary<string, AttributeValue> { ["id"] = new AttributeValue { S = classroomQuizId } };
        await DeleteItemAsync(key, _classroomQuizTableName);
    }
}
