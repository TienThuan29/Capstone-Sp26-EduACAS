using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Quiz;

public class QuizRepository : DynamoRepository, IQuizRepository
{
    private readonly string _quizTableName;
    private readonly IConfiguration _configuration;

    public QuizRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<QuizRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _quizTableName = configuration["DynamoDB:QuizTableName"] ??
                     throw new ArgumentNullException("DynamoDB:QuizTableName is not configured");
        base.TableName = _quizTableName;
    }

    public Task<Models.Quiz?> CreateAsync(Models.Quiz quiz)
    {
        return CreateInternalAsync(quiz);
    }

    private async Task<Models.Quiz?> CreateInternalAsync(Models.Quiz quiz)
    {
        try
        {
            var item = DynamoMapper.QuizToDynamoItem(quiz);
            await PutItemAsync(item, _quizTableName);
            return quiz;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating quiz");
            throw;
        }
    }

    public async Task<Models.Quiz?> FindByIdAsync(string quizId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(quizId);
            var response = await GetItemAsync(key, _quizTableName);

            if (response.Item.Count == 0)
            {
                return null;
            }

            return DynamoMapper.DynamoItemToQuiz(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding quiz {Id}", quizId);
            throw;
        }
    }

    public async Task<List<Models.Quiz>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _quizTableName };
            var response = await _dynamoDBClient.ScanAsync(request);

            return response.Items.Select(DynamoMapper.DynamoItemToQuiz).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all quizzes");
            throw;
        }
    }

    public async Task<Models.Quiz?> UpdateAsync(Models.Quiz quiz)
    {
        try
        {
            var item = DynamoMapper.QuizToDynamoItem(quiz);
            await PutItemAsync(item, _quizTableName);
            return quiz;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quiz {Id}", quiz.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string quizId)
    {
        try
        {
            var quiz = await FindByIdAsync(quizId);
            if (quiz == null)
            {
                throw new KeyNotFoundException($"Quiz with id {quizId} not found");
            }

            quiz.IsDeleted = true;
            quiz.UpdatedAt = DateTime.UtcNow;

            var item = DynamoMapper.QuizToDynamoItem(quiz);
            await PutItemAsync(item, _quizTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting quiz {Id}", quizId);
            throw;
        }
    }

    public async Task DeleteAsync(string quizId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(quizId);
            await DeleteItemAsync(key, _quizTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting quiz {Id}", quizId);
            throw;
        }
    }
}
