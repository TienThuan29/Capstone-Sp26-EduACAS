using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

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

    public async Task<Models.StudentAnswer?> CreateAsync(Models.StudentAnswer studentAnswer)
    {
        try
        {
            var item = DynamoMapper.StudentAnswerToDynamoItem(studentAnswer);
            await PutItemAsync(item, _studentAnswerTableName);
            return studentAnswer;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating student answer");
            throw;
        }
    }

    public async Task BatchCreateAsync(List<Models.StudentAnswer> answers)
    {
        if (answers == null || answers.Count == 0) return;

        try
        {
            for (int i = 0; i < answers.Count; i += 25)
            {
                var batch = answers.Skip(i).Take(25).ToList();
                var writeRequests = batch.Select(a => new Amazon.DynamoDBv2.Model.WriteRequest
                {
                    PutRequest = new Amazon.DynamoDBv2.Model.PutRequest
                    {
                        Item = DynamoMapper.StudentAnswerToDynamoItem(a)
                    }
                }).ToList();

                var batchRequest = new Amazon.DynamoDBv2.Model.BatchWriteItemRequest
                {
                    RequestItems = new Dictionary<string, List<Amazon.DynamoDBv2.Model.WriteRequest>>
                    {
                        [_studentAnswerTableName] = writeRequests
                    }
                };

                await _dynamoDBClient.BatchWriteItemAsync(batchRequest);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch creating student answers");
            throw;
        }
    }

    public async Task<Models.StudentAnswer?> FindByIdAsync(string studentAnswerId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(studentAnswerId);
            var response = await GetItemAsync(key, _studentAnswerTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToStudentAnswer(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding student answer {Id}", studentAnswerId);
            throw;
        }
    }

    public async Task<List<Models.StudentAnswer>> FindByAttemptIdAsync(string attemptId)
    {
        try
        {
            var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest
            {
                TableName = _studentAnswerTableName,
                FilterExpression = "attemptId = :aid",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":aid"] = new AttributeValue { S = attemptId }
                }
            };
            var response = await _dynamoDBClient.ScanAsync(scanRequest);
            return response.Items.Select(DynamoMapper.DynamoItemToStudentAnswer).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding student answers for attempt {Id}", attemptId);
            throw;
        }
    }

    public async Task<Models.StudentAnswer?> UpdateAsync(Models.StudentAnswer studentAnswer)
    {
        return await CreateAsync(studentAnswer);
    }

    public async Task DeleteAsync(string studentAnswerId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(studentAnswerId);
            await DeleteItemAsync(key, _studentAnswerTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting student answer {Id}", studentAnswerId);
            throw;
        }
    }
}
