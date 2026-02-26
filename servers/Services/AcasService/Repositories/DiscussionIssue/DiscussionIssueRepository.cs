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
        _discussionIssueTableName = configuration["DynamoDB:DiscussionIssueTableName"] ??
                     throw new ArgumentNullException("DynamoDB:DiscussionIssueTableName is not configured");
        base.TableName = _discussionIssueTableName;
    }

    public async Task<Models.DiscussionIssue?> CreateAsync(Models.DiscussionIssue issue)
    {
        try
        {
            var item = DynamoMapper.IssueToDynamoItem(issue);
            await PutItemAsync(item, _discussionIssueTableName);
            return issue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating discussion issue");
            throw;
        }
    }

    public async Task<Models.DiscussionIssue?> FindByIdAsync(string issueId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(issueId);
            var response = await GetItemAsync(key, _discussionIssueTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToIssue(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding discussion issue {Id}", issueId);
            throw;
        }
    }

    public async Task<List<Models.DiscussionIssue>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _discussionIssueTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToIssue(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all discussion issues");
            throw;
        }
    }

    public async Task<List<Models.DiscussionIssue>> FindByClassroomIdAsync(string classroomId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _discussionIssueTableName,
                FilterExpression = "classroomId = :classroomId and isDeleted = :isDeleted",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":classroomId"] = new AttributeValue { S = classroomId },
                    [":isDeleted"] = new AttributeValue { BOOL = false }
                }
            };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToIssue(item))
                .OrderByDescending(i => i.CreatedDate)
                .ToList();
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
            var item = DynamoMapper.IssueToDynamoItem(issue);
            await PutItemAsync(item, _discussionIssueTableName);
            return issue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating discussion issue {Id}", issue.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string issueId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(issueId);
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                {
                    "isDeleted", new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { BOOL = true }
                    }
                }
            };
            await UpdateItemAsync(key, updates, _discussionIssueTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting discussion issue {Id}", issueId);
            throw;
        }
    }

    public async Task DeleteAsync(string issueId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(issueId);
            await DeleteItemAsync(key, _discussionIssueTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting discussion issue {Id}", issueId);
            throw;
        }
    }
}
