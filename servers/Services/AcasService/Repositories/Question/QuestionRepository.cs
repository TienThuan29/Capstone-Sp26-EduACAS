using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

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

    public async Task<Models.Question?> CreateAsync(Models.Question question)
    {
        try
        {
            var item = DynamoMapper.QuestionToDynamoItem(question);
            await PutItemAsync(item, _questionTableName);
            return question;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating question");
            throw;
        }
    }

    public async Task<Models.Question?> FindByIdAsync(string questionId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(questionId);
            var response = await GetItemAsync(key, _questionTableName);

            if (response.Item.Count == 0)
            {
                return null;
            }

            return DynamoMapper.DynamoItemToQuestion(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding question {Id}", questionId);
            throw;
        }
    }

    public async Task<Dictionary<string, Models.Question>> FindByIdsAsync(IEnumerable<string> questionIds)
    {
        var result = new Dictionary<string, Models.Question>();
        var questionIdList = questionIds.ToList();
        if (questionIdList.Count == 0) return result;

        const int batchSize = 100;
        for (int i = 0; i < questionIdList.Count; i += batchSize)
        {
            var batch = questionIdList.Skip(i).Take(batchSize).ToList();
            var keys = batch.Select(id => DynamoMapper.CreateKey(id)).ToList();

            try
            {
                var request = new BatchGetItemRequest
                {
                    RequestItems = new Dictionary<string, KeysAndAttributes>
                    {
                        [_questionTableName] = new KeysAndAttributes { Keys = keys }
                    }
                };

                var response = await _dynamoDBClient.BatchGetItemAsync(request);
                if (response.Responses.TryGetValue(_questionTableName, out var items))
                {
                    foreach (var item in items)
                    {
                        var question = DynamoMapper.DynamoItemToQuestion(item);
                        if (question != null)
                        {
                            result[question.Id] = question;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error batch fetching questions");
                throw;
            }
        }

        return result;
    }

    public async Task<List<Models.Question>> FindAllAsync(bool includeDeleted = false)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _questionTableName,
                FilterExpression = includeDeleted ? null : "isDeleted = :isDeleted",
                ExpressionAttributeValues = includeDeleted
                    ? null
                    : new Dictionary<string, AttributeValue>
                      {
                          [":isDeleted"] = new AttributeValue { BOOL = false }
                      }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToQuestion).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all questions");
            throw;
        }
    }

    public async Task<PagedResult<Models.Question>> FindAllPagedAsync(
        int pageIndex,
        int pageSize,
        bool includeDeleted = false,
        string? searchTerm = null,
        string? type = null)
    {
        try
        {
            var filterExpressions = new List<string>();
            var expressionAttributeValues = new Dictionary<string, AttributeValue>();

            if (!includeDeleted)
            {
                filterExpressions.Add("isDeleted = :isDeleted");
                expressionAttributeValues[":isDeleted"] = new AttributeValue { BOOL = false };
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filterExpressions.Add("contains(content, :searchTerm)");
                expressionAttributeValues[":searchTerm"] = new AttributeValue { S = searchTerm };
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                filterExpressions.Add("#type = :type");
                expressionAttributeValues[":type"] = new AttributeValue { S = type };
            }

            var request = new ScanRequest
            {
                TableName = _questionTableName,
                FilterExpression = filterExpressions.Count > 0
                    ? string.Join(" AND ", filterExpressions)
                    : null,
                ExpressionAttributeNames = !string.IsNullOrWhiteSpace(type)
                    ? new Dictionary<string, string> { ["#type"] = "type" }
                    : null,
                ExpressionAttributeValues = expressionAttributeValues.Count > 0
                    ? expressionAttributeValues
                    : null
            };

            var allItems = new List<Dictionary<string, AttributeValue>>();
            do
            {
                var response = await _dynamoDBClient.ScanAsync(request);
                allItems.AddRange(response.Items);
                request.ExclusiveStartKey = response.LastEvaluatedKey;
            }
            while (request.ExclusiveStartKey != null && request.ExclusiveStartKey.Count > 0);

            var allQuestions = allItems.Select(DynamoMapper.DynamoItemToQuestion).ToList();
            var totalCount = allQuestions.Count;

            var pagedItems = allQuestions
                .OrderByDescending(q => q.UpdatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<Models.Question>(pagedItems, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding paged questions");
            throw;
        }
    }

    public async Task<Models.Question?> UpdateAsync(Models.Question question)
    {
        try
        {
            var item = DynamoMapper.QuestionToDynamoItem(question);
            await PutItemAsync(item, _questionTableName);
            return question;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating question {Id}", question.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string questionId)
    {
        try
        {
            var question = await FindByIdAsync(questionId);
            if (question == null)
            {
                throw new KeyNotFoundException($"Question with id {questionId} not found");
            }

            question.IsDeleted = true;
            question.UpdatedAt = DateTime.UtcNow;

            var item = DynamoMapper.QuestionToDynamoItem(question);
            await PutItemAsync(item, _questionTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting question {Id}", questionId);
            throw;
        }
    }

    public async Task DeleteAsync(string questionId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(questionId);
            await DeleteItemAsync(key, _questionTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting question {Id}", questionId);
            throw;
        }
    }
}
