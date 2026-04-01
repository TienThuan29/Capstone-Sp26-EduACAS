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

    public async Task<List<Models.Question>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _questionTableName };
            var response = await _dynamoDBClient.ScanAsync(request);

            return response.Items.Select(DynamoMapper.DynamoItemToQuestion).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all questions");
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
