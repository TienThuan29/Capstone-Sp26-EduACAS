using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.ExamLog;

public class ExamLogRepository : DynamoRepository, IExamLogRepository
{
    private readonly string _examLogTableName;

    public ExamLogRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ExamLogRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _examLogTableName = configuration["DynamoDB:ExamLogTableName"] ??
            throw new ArgumentNullException("DynamoDB:ExamLogTableName is not configured");
        base.TableName = _examLogTableName;
    }

    public async Task<Models.ExamLog?> CreateAsync(Models.ExamLog examLog)
    {
        try
        {
            examLog.Id = Guid.NewGuid().ToString();
            examLog.CreatedDate = DateTime.UtcNow;
            if (examLog.ClientTimestamp == default)
                examLog.ClientTimestamp = examLog.CreatedDate;

            var item = DynamoMapper.ExamLogToDynamoItem(examLog);
            await PutItemAsync(item, _examLogTableName);
            return examLog;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating exam log");
            throw;
        }
    }

    public async Task<Models.ExamLog?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _examLogTableName);
            if (response.Item == null || response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToExamLog(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exam log {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.ExamLog>> GetBySubmissionIdAsync(string submissionId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _examLogTableName,
                FilterExpression = "submissionId = :submissionId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":submissionId"] = new AttributeValue { S = submissionId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(DynamoMapper.DynamoItemToExamLog)
                .OrderByDescending(log => log.CreatedDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exam logs for submission {SubmissionId}", submissionId);
            throw;
        }
    }
}
