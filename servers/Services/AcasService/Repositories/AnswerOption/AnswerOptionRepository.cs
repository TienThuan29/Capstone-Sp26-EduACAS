using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.AnswerOption;

public class AnswerOptionRepository : DynamoRepository, IAnswerOptionRepository
{
    private readonly string _answerOptionTableName;

    public AnswerOptionRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<AnswerOptionRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _answerOptionTableName = configuration["DynamoDB:AnswerOptionTableName"] ??
                     throw new ArgumentNullException("DynamoDB:AnswerOptionTableName is not configured");
        base.TableName = _answerOptionTableName;
    }

    public async Task<List<Models.AnswerOption>> CreateBatchAsync(List<Models.AnswerOption> answerOptions)
    {
        if (answerOptions.Count == 0)
        {
            return answerOptions;
        }

        foreach (var option in answerOptions)
        {
            var item = DynamoMapper.AnswerOptionToDynamoItem(option);
            await PutItemAsync(item, _answerOptionTableName);
        }

        return answerOptions;
    }

    public async Task<List<Models.AnswerOption>> FindByQuestionIdAsync(string questionId)
    {
        var request = new ScanRequest
        {
            TableName = _answerOptionTableName,
            FilterExpression = "questionId = :questionId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":questionId"] = new AttributeValue { S = questionId }
            }
        };

        var results = new List<Models.AnswerOption>();
        Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

        do
        {
            request.ExclusiveStartKey = lastEvaluatedKey;
            var response = await _dynamoDBClient.ScanAsync(request);
            _logger.LogInformation($"Successfully scanned table {_answerOptionTableName} for question {questionId}. Found {response.Items.Count} items.");
            results.AddRange(response.Items.Select(DynamoMapper.DynamoItemToAnswerOption));
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey != null && lastEvaluatedKey.Count > 0);

        return results.OrderBy(x => x.CreatedAt).ToList();
    }

    public async Task<Dictionary<string, List<Models.AnswerOption>>> FindByQuestionIdsAsync(IEnumerable<string> questionIds)
    {
        var ids = questionIds.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList();
        var result = new Dictionary<string, List<Models.AnswerOption>>();

        foreach (var questionId in ids)
        {
            result[questionId] = await FindByQuestionIdAsync(questionId);
        }

        return result;
    }

    public async Task DeleteByQuestionIdAsync(string questionId)
    {
        var existingOptions = await FindByQuestionIdAsync(questionId);
        if (existingOptions.Count == 0)
        {
            return;
        }

        foreach (var option in existingOptions)
        {
            var key = DynamoMapper.CreateKey(option.Id);
            await DeleteItemAsync(key, _answerOptionTableName);
        }
    }
}
