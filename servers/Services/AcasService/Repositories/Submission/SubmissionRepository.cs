using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Net;

namespace AcasService.Repositories.Submission;

public class SubmissionRepository : DynamoRepository, ISubmissionRepository
{
    private readonly string _submissionTableName;
    private readonly IConfiguration _configuration;

    public SubmissionRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<SubmissionRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _submissionTableName = configuration["DynamoDB:SubmissionTableName"] ??
            throw new ArgumentNullException("DynamoDB:SubmissionTableName is not configured");
        base.TableName = _submissionTableName;
    }

    public async Task<Models.Submission?> CreateAsync(Models.Submission submission)
    {
        try
        {
            submission.Id = Guid.NewGuid().ToString();
            submission.SubmittedDate = DateTime.UtcNow;
            submission.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.SubmissionToDynamoItem(submission);
            var response = await PutItemAsync(item, _submissionTableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Submission {Id} created successfully", submission.Id);
                return await GetByIdAsync(submission.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating submission");
            throw;
        }
    }

    public async Task<Models.Submission?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _submissionTableName);

            if (response.Item == null || response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToSubmission(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submission {Id}", id);
            throw;
        }
    }

    public async Task<Models.Submission?> UpdateAsync(Models.Submission submission)
    {
        try
        {
            submission.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.SubmissionToDynamoItem(submission);
            var response = await PutItemAsync(item, _submissionTableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Submission {Id} updated successfully", submission.Id);
                return await GetByIdAsync(submission.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating submission {Id}", submission.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _submissionTableName);
            _logger.LogInformation("Submission {Id} deleted successfully", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting submission {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetByStudentIdAsync(string studentId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = "studentId = :studentId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":studentId"] = new AttributeValue { S = studentId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetByExamIdAsync(string examId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = "examId = :examId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":examId"] = new AttributeValue { S = examId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetByProblemIdAsync(string problemId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = "problemId = :problemId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":problemId"] = new AttributeValue { S = problemId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetLatestVersionSubmissionsOfProblemInExam(string examId, string problemId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = "examId = :examId AND problemId = :problemId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":examId"] = new AttributeValue { S = examId },
                    [":problemId"] = new AttributeValue { S = problemId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            var submissions = response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();

            return submissions
                .GroupBy(s => s.StudentId)
                .Select(g => g.OrderByDescending(s => s.Version).First())
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving latest submissions for exam {ExamId}, problem {ProblemId}", examId, problemId);
            throw;
        }
    }
}