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

    public async Task<List<Models.Submission>> GetByStudentIdsAsync(List<string> studentIds)
    {
        if (studentIds == null || studentIds.Count == 0)
            return new List<Models.Submission>();

        try
        {
            var filterValues = new Dictionary<string, AttributeValue>();
            var filterExpressions = new List<string>();

            for (int i = 0; i < studentIds.Count; i++)
            {
                var key = $":studentId{i}";
                filterValues[key] = new AttributeValue { S = studentIds[i] };
                filterExpressions.Add($"studentId = {key}");
            }

            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = string.Join(" OR ", filterExpressions)
            };

            request.ExpressionAttributeValues = filterValues;

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for {Count} students", studentIds.Count);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetByExamIdAsync(string examId)
    {
        try
        {
            var allSubmissions = new List<Models.Submission>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var request = new ScanRequest
                {
                    TableName = _submissionTableName,
                    FilterExpression = "examId = :examId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":examId"] = new AttributeValue { S = examId }
                    },
                    ExclusiveStartKey = lastKey
                };

                var response = await _dynamoDBClient.ScanAsync(request);
                allSubmissions.AddRange(response.Items.Select(DynamoMapper.DynamoItemToSubmission));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            return allSubmissions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving submissions for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetByExamIdsAsync(List<string> examIds)
    {
        if (examIds == null || examIds.Count == 0)
            return new List<Models.Submission>();

        var examIdSet = examIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var allSubmissions = new List<Models.Submission>();
        Dictionary<string, AttributeValue>? lastKey = null;

        do
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                ExclusiveStartKey = lastKey
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            var filtered = response.Items
                .Where(item => item.TryGetValue("examId", out var v) && examIdSet.Contains(v.S))
                .Select(DynamoMapper.DynamoItemToSubmission)
                .ToList();
            allSubmissions.AddRange(filtered);
            lastKey = response.LastEvaluatedKey;
        } while (lastKey != null && lastKey.Count > 0);

        return allSubmissions;
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

    public async Task<List<Models.Submission>> GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(string examId, string problemId)
    {
        try
        {
            var allSubmissions = new List<Models.Submission>();
            Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

            do
            {
                var request = new ScanRequest
                {
                    TableName = _submissionTableName,
                    FilterExpression = "examId = :examId AND problemId = :problemId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":examId"] = new AttributeValue { S = examId },
                        [":problemId"] = new AttributeValue { S = problemId }
                    },
                    ExclusiveStartKey = lastEvaluatedKey
                };

                var response = await _dynamoDBClient.ScanAsync(request);
                allSubmissions.AddRange(response.Items.Select(DynamoMapper.DynamoItemToSubmission));
                lastEvaluatedKey = response.LastEvaluatedKey;
            } while (lastEvaluatedKey != null && lastEvaluatedKey.Count > 0);

            return allSubmissions
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

    public async Task<Dictionary<string, List<Models.Submission>>> GetLatestVersionSubmissionsByExamAsync(string examId, string? studentId = null)
    {
        try
        {
            ScanRequest request;
            if (!string.IsNullOrWhiteSpace(studentId))
            {
                request = new ScanRequest
                {
                    TableName = _submissionTableName,
                    FilterExpression = "examId = :examId AND studentId = :studentId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":examId"] = new AttributeValue { S = examId },
                        [":studentId"] = new AttributeValue { S = studentId }
                    }
                };
            }
            else
            {
                request = new ScanRequest
                {
                    TableName = _submissionTableName,
                    FilterExpression = "examId = :examId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":examId"] = new AttributeValue { S = examId }
                    }
                };
            }

            var response = await _dynamoDBClient.ScanAsync(request);
            var allSubmissions = response.Items.Select(DynamoMapper.DynamoItemToSubmission).ToList();

            var byProblem = allSubmissions
                .GroupBy(s => s.ProblemId)
                .ToDictionary(g => g.Key, g => g
                    .GroupBy(s => s.StudentId)
                    .Select(studentGroup => studentGroup.OrderByDescending(s => s.Version).First())
                    .ToList());
            return byProblem;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving latest submissions for exam {ExamId}, student {StudentId}", examId, studentId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetVersionsBySubmissionKey(string studentId, string examId, string problemId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _submissionTableName,
                FilterExpression = "studentId = :studentId AND examId = :examId AND problemId = :problemId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":studentId"] = new AttributeValue { S = studentId },
                    [":examId"] = new AttributeValue { S = examId },
                    [":problemId"] = new AttributeValue { S = problemId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(DynamoMapper.DynamoItemToSubmission)
                .OrderByDescending(s => s.Version)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving versions for student {StudentId}, exam {ExamId}, problem {ProblemId}", studentId, examId, problemId);
            throw;
        }
    }

    public async Task<List<Models.Submission>> GetAllAsync()
    {
        try
        {
            var allSubmissions = new List<Models.Submission>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var request = new ScanRequest
                {
                    TableName = _submissionTableName,
                    ExclusiveStartKey = lastKey
                };

                var response = await _dynamoDBClient.ScanAsync(request);
                allSubmissions.AddRange(response.Items.Select(DynamoMapper.DynamoItemToSubmission).Where(s => s != null).Cast<Models.Submission>());
                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            return allSubmissions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all submissions");
            throw;
        }
    }
}