using System.Net;
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.KeystrokeLogs;

public class KeystrokeLogRepository : DynamoRepository, IKeystrokeLogRepository
{
    private readonly string _keystrokeLogsTableName;

    public KeystrokeLogRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<KeystrokeLogRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _keystrokeLogsTableName = configuration["DynamoDB:KeystrokeLogsTableName"] ??
            throw new ArgumentNullException("DynamoDB:KeystrokeLogsTableName is not configured");
        base.TableName = _keystrokeLogsTableName;
    }

    public async Task<Models.KeystrokeLog?> CreateAsync(Models.KeystrokeLog keystrokeLog)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keystrokeLog.Id))
                keystrokeLog.Id = Guid.NewGuid().ToString();
            if (keystrokeLog.CreatedAt == default)
                keystrokeLog.CreatedAt = DateTime.UtcNow;

            var item = DynamoMapper.ToDynamoItem(keystrokeLog);
            var response = await PutItemAsync(item, _keystrokeLogsTableName);
            return response.HttpStatusCode == HttpStatusCode.OK ? keystrokeLog : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating keystroke log for submission {SubmissionId}", keystrokeLog.SubmissionId);
            throw;
        }
    }

    public async Task<List<Models.KeystrokeLog>> GetBySubmissionIdAsync(string submissionId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _keystrokeLogsTableName,
                FilterExpression = "submissionId = :submissionId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":submissionId"] = new AttributeValue { S = submissionId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(DynamoMapper.ToEntity)
                .OrderBy(x => x.CreatedAt)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting keystroke logs for submission {SubmissionId}", submissionId);
            throw;
        }
    }
}
