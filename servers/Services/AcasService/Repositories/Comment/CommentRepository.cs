using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Comment;

public class CommentRepository : DynamoRepository, ICommentRepository
{
    private readonly string _commentTableName;

    public CommentRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<CommentRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _commentTableName = configuration["DynamoDB:CommentTableName"] ??
                     throw new ArgumentNullException("DynamoDB:CommentTableName is not configured");
        base.TableName = _commentTableName;
    }

    public async Task<Models.Comment?> CreateAsync(Models.Comment comment)
    {
        try
        {
            var item = DynamoMapper.CommentToDynamoItem(comment);
            await PutItemAsync(item, _commentTableName);
            return comment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment");
            throw;
        }
    }

    public async Task<Models.Comment?> FindByIdAsync(string commentId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(commentId);
            var response = await GetItemAsync(key, _commentTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToComment(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding comment {Id}", commentId);
            throw;
        }
    }

    public async Task<List<Models.Comment>> FindByDiscussionIssueIdAsync(string discussionIssueId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _commentTableName,
                FilterExpression = "discussionIssueId = :discussionIssueId and isDeleted = :isDeleted",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":discussionIssueId"] = new AttributeValue { S = discussionIssueId },
                    [":isDeleted"] = new AttributeValue { BOOL = false }
                }
            };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToComment(item))
                .OrderBy(c => c.CreatedDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding comments for discussion issue {IssueId}", discussionIssueId);
            throw;
        }
    }

    public async Task<int> CountByDiscussionIssueIdAsync(string discussionIssueId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _commentTableName,
                FilterExpression = "discussionIssueId = :discussionIssueId and isDeleted = :isDeleted",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":discussionIssueId"] = new AttributeValue { S = discussionIssueId },
                    [":isDeleted"] = new AttributeValue { BOOL = false }
                },
                Select = Select.COUNT
            };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting comments for discussion issue {IssueId}", discussionIssueId);
            throw;
        }
    }

    public async Task<Models.Comment?> UpdateAsync(Models.Comment comment)
    {
        try
        {
            var item = DynamoMapper.CommentToDynamoItem(comment);
            await PutItemAsync(item, _commentTableName);
            return comment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {Id}", comment.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string commentId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(commentId);
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
            await UpdateItemAsync(key, updates, _commentTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting comment {Id}", commentId);
            throw;
        }
    }

    public async Task DeleteAsync(string commentId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(commentId);
            await DeleteItemAsync(key, _commentTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {Id}", commentId);
            throw;
        }
    }
}
