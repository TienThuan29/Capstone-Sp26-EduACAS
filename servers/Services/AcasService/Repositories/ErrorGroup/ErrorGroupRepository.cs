using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Net;

namespace AcasService.Repositories.ErrorGroup;

public class ErrorGroupRepository : DynamoRepository, IErrorGroupRepository
{
    private readonly string _tableName;

    public ErrorGroupRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ErrorGroupRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _tableName = configuration["DynamoDB:ErrorGroupTableName"] ?? "ErrorGroups";
        base.TableName = _tableName;
    }

    public async Task<Models.ErrorGroup?> CreateAsync(Models.ErrorGroup errorGroup)
    {
        try
        {
            errorGroup.Id = Guid.NewGuid().ToString();
            errorGroup.CreatedDate = DateTime.UtcNow;

            var item = DynamoMapper.ErrorGroupToDynamoItem(errorGroup);
            var response = await PutItemAsync(item, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("ErrorGroup {Id} created successfully with ExamId {ExamId} and ProblemId {ProblemId}", 
                    errorGroup.Id, errorGroup.ExamId, errorGroup.ProblemId);
                return errorGroup;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ErrorGroup");
            throw;
        }
    }

    public async Task<Models.ErrorGroup?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _tableName);

            if (response.Item == null || response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToErrorGroup(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ErrorGroup {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.ErrorGroup>> GetByProblemIdAsync(string examId, string problemId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "examId = :e AND problemId = :p",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":e"] = new AttributeValue { S = examId },
                    [":p"] = new AttributeValue { S = problemId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            var results = response.Items.Select(DynamoMapper.DynamoItemToErrorGroup).ToList();

            _logger.LogInformation("Retrieved {Count} ErrorGroups for exam {ExamId}, problem {ProblemId}", results.Count, examId, problemId);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ErrorGroups for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }

    public async Task<List<Models.ErrorGroup>> GetByProblemIdPaginatedAsync(string examId, string problemId)
    {
        try
        {
            var results = new List<Models.ErrorGroup>();
            Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

            do
            {
                var request = new ScanRequest
                {
                    TableName = _tableName,
                    FilterExpression = "examId = :e AND problemId = :p",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":e"] = new AttributeValue { S = examId },
                        [":p"] = new AttributeValue { S = problemId }
                    },
                    ExclusiveStartKey = lastEvaluatedKey
                };

                var response = await _dynamoDBClient.ScanAsync(request);
                results.AddRange(response.Items.Select(DynamoMapper.DynamoItemToErrorGroup));
                lastEvaluatedKey = response.LastEvaluatedKey;
            } while (lastEvaluatedKey != null && lastEvaluatedKey.Count > 0);

            _logger.LogInformation("Retrieved {Count} ErrorGroups (paginated) for exam {ExamId}, problem {ProblemId}", results.Count, examId, problemId);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ErrorGroups (paginated) for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }

    public async Task<List<Models.ErrorGroup>> GetByExamIdAsync(string examId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "examId = :e",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":e"] = new AttributeValue { S = examId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            var results = response.Items.Select(DynamoMapper.DynamoItemToErrorGroup).ToList();

            _logger.LogInformation("Retrieved {Count} ErrorGroups for exam {ExamId}", results.Count, examId);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ErrorGroups for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task DeleteByProblemIdAsync(string examId, string problemId)
    {
        try
        {
            var groups = await GetByProblemIdAsync(examId, problemId);
            foreach (var g in groups)
            {
                await DeleteItemAsync(DynamoMapper.CreateKey(g.Id), _tableName);
            }
            _logger.LogInformation("Deleted ErrorGroups for exam {ExamId}, problem {ProblemId}", examId, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ErrorGroups for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }

    public async Task DeleteByProblemIdPaginatedAsync(string examId, string problemId)
    {
        try
        {
            var groups = await GetByProblemIdPaginatedAsync(examId, problemId);
            foreach (var g in groups)
            {
                await DeleteItemAsync(DynamoMapper.CreateKey(g.Id), _tableName);
            }
            _logger.LogInformation("Deleted ErrorGroups (paginated) for exam {ExamId}, problem {ProblemId}", examId, problemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ErrorGroups (paginated) for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }

    public async Task<Models.ErrorGroup?> UpdateAsync(Models.ErrorGroup errorGroup)
    {
        try
        {
            var item = DynamoMapper.ErrorGroupToDynamoItem(errorGroup);
            var response = await PutItemAsync(item, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("ErrorGroup {Id} updated successfully with {ResultCount} results", 
                    errorGroup.Id, errorGroup.JPlagResults?.Count ?? 0);
                return errorGroup;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ErrorGroup {Id}", errorGroup.Id);
            throw;
        }
    }
}
