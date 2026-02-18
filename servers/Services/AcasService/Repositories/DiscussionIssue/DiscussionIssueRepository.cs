using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.DiscussionIssue;

public class DiscussionIssueRepository : DynamoRepository, IDiscussionIssueRepository
{
    private readonly string _discussionIssueTableName;

    public DiscussionIssueRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<DiscussionIssueRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _discussionIssueTableName = configuration["DynamoDB:DiscussionIssueTableName"]
            ?? throw new ArgumentNullException("DynamoDB:DiscussionIssueTableName is not configured");
    }

    public async Task<Models.DiscussionIssue?> CreateAsync(Models.DiscussionIssue issue)
    {
        try
        {
            var item = DynamoMapper.DiscussionIssueToDynamoItem(issue);
            await PutItemAsync(item, _discussionIssueTableName);
            return issue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating discussion issue");
            throw;
        }
    }

    public async Task<Models.DiscussionIssue?> FindByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _discussionIssueTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToDiscussionIssue(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding discussion issue {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.DiscussionIssue>> FindByClassroomIdAsync(string classroomId)
    {
        try
        {
            Dictionary<string, AttributeValue>? lastKey = null;
            var issues = new List<Models.DiscussionIssue>();

            do
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _discussionIssueTableName,
                    FilterExpression = "classroomId = :classroomId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":classroomId"] = new AttributeValue { S = classroomId },
                        [":false"] = new AttributeValue { BOOL = false }
                    }
                };
                if (lastKey != null && lastKey.Count > 0)
                    scanRequest.ExclusiveStartKey = lastKey;

                var response = await _dynamoDBClient.ScanAsync(scanRequest);

                foreach (var item in response.Items)
                {
                    issues.Add(DynamoMapper.DynamoItemToDiscussionIssue(item));
                }

                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            return issues;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding discussion issues for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<Models.DiscussionIssue?> UpdateAsync(Models.DiscussionIssue issue)
    {
        try
        {
            var item = DynamoMapper.DiscussionIssueToDynamoItem(issue);
            await PutItemAsync(item, _discussionIssueTableName);
            return issue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating discussion issue {Id}", issue.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                ["isDeleted"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { BOOL = true }
                },
                ["updatedDate"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = DateTime.UtcNow.ToString("o") }
                }
            };
            await UpdateItemAsync(key, updates, _discussionIssueTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting discussion issue {Id}", id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _discussionIssueTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting discussion issue {Id}", id);
            throw;
        }
    }
}
