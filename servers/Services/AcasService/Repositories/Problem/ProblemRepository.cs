using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AcasService.Models;
using AcasService.Repositories.DynamoDb;
using System.Net;

namespace AcasService.Repositories.Problem;

public class ProblemRepository : DynamoRepository, IProblemRepository
{
    private readonly IConfiguration _configuration;
    private readonly string _problemTableName;
    private readonly string _testCaseTableName;

    public ProblemRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<DynamoRepository> logger) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        // Support both legacy keys (ProblemTable/TestCaseTable) and the current *TableName keys.
        _problemTableName =
            configuration["DynamoDB:ProblemTableName"] ??
            configuration["DynamoDB:ProblemTable"] ??
            throw new ArgumentNullException("DynamoDB:ProblemTableName is not configured");

        _testCaseTableName =
            configuration["DynamoDB:TestCaseTableName"] ??
            configuration["DynamoDB:TestCaseTable"] ??
            throw new ArgumentNullException("DynamoDB:TestCaseTableName is not configured");
        
        base.TableName = _problemTableName;
        var awsRegion = configuration["AWS:Region"] ?? "Not configured";
        logger.LogInformation("ProblemRepository initialized - Region: {Region}, ProblemTable: {ProblemTable}, TestCaseTable: {TestCaseTable}", 
            awsRegion, _problemTableName, _testCaseTableName);
    }

    public async Task<string> CreateAsync(Models.Problem problem)
    {
        try
        {
            problem.Id = Guid.NewGuid().ToString();
            problem.CreatedDate = DateTime.UtcNow;
            problem.UpdatedDate = DateTime.UtcNow;

            var dynamoItem = DynamoMapper.ProblemToDynamoItem(problem);
            var response = await PutItemAsync(dynamoItem, _problemTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Problem {ProblemId} created successfully", problem.Id);
                return problem.Id;
            }

            throw new Exception("Failed to create problem in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating problem");
            throw;
        }
    }

    public async Task<Models.Problem?> GetByIdAsync(string problemId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(problemId);
            var response = await GetItemAsync(key, _problemTableName);

            if (response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToProblem(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<List<Models.Problem>> GetByExamIdAsync(string examId)
    {
        try
        {
            var request = new QueryRequest
            {
                TableName = _problemTableName,
                IndexName = "examId-index",
                KeyConditionExpression = "examId = :examId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":examId"] = new AttributeValue { S = examId }
                }
            };

            var response = await _dynamoDBClient.QueryAsync(request);
            
            var problems = response.Items
                .Where(item => item.ContainsKey("isDeleted") && item["isDeleted"].BOOL == false)
                .Select(DynamoMapper.DynamoItemToProblem)
                .ToList();

            return problems;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<AcasService.Models.Problem>> GetByLecturerIdAsync(string lecturerId)
    {
        try
        {
            var request = new QueryRequest
            {
                TableName = _problemTableName,
                IndexName = "lecturerId-index",
                KeyConditionExpression = "lecturerId = :lecturerId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":lecturerId"] = new AttributeValue { S = lecturerId }
                }
            };

            var response = await _dynamoDBClient.QueryAsync(request);

            var problems = response.Items
                .Where(item => item.ContainsKey("isDeleted") && item["isDeleted"].BOOL == false)
                .Select(DynamoMapper.DynamoItemToProblem)
                .ToList();

            return problems;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving problems for lecturer {LecturerId}", lecturerId);
            throw;
        }
    }

    public async Task<List<Models.Problem>> GetAllAsync()
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _problemTableName,
                FilterExpression = "isDeleted = :false",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":false"] = new AttributeValue { BOOL = false }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            var problems = response.Items.Select(DynamoMapper.DynamoItemToProblem).ToList();

            return problems;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all problems");
            throw;
        }
    }

    public async Task UpdateAsync(Models.Problem problem)
    {
        try
        {
            var existingProblem = await GetByIdAsync(problem.Id);
            if (existingProblem == null)
                throw new KeyNotFoundException($"Problem {problem.Id} not found");

            problem.UpdatedDate = DateTime.UtcNow;
            problem.CreatedDate = existingProblem.CreatedDate;

            var dynamoItem = DynamoMapper.ProblemToDynamoItem(problem);
            var response = await PutItemAsync(dynamoItem, _problemTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Problem {ProblemId} updated successfully", problem.Id);
                return;
            }

            throw new Exception("Failed to update problem in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating problem {ProblemId}", problem.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string problemId)
    {
        try
        {
            var problem = await GetByIdAsync(problemId);
            if (problem == null)
                throw new KeyNotFoundException($"Problem {problemId} not found");

            problem.IsDeleted = true;
            problem.UpdatedDate = DateTime.UtcNow;

            var dynamoItem = DynamoMapper.ProblemToDynamoItem(problem);
            var response = await PutItemAsync(dynamoItem, _problemTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Problem {ProblemId} deleted successfully", problemId);
                return;
            }

            throw new Exception("Failed to delete problem in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string problemId)
    {
        try
        {
            var problem = await GetByIdAsync(problemId);
            return problem != null && !problem.IsDeleted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if problem {ProblemId} exists", problemId);
            throw;
        }
    }

    public async Task AddTestCaseAsync(string problemId, TestCase testCase)
    {
        try
        {
            testCase.Id = Guid.NewGuid().ToString();
            testCase.IsDeleted = false;

            var dynamoItem = DynamoMapper.TestCaseToDynamoItem(problemId, testCase);
            var response = await PutItemAsync(dynamoItem, _testCaseTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Test case {TestCaseId} added to problem {ProblemId}", testCase.Id, problemId);
                return;
            }

            throw new Exception("Failed to add test case in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding test case to problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task UpdateTestCaseAsync(string problemId, TestCase testCase)
    {
        try
        {
            var existingTestCase = await GetTestCaseAsync(problemId, testCase.Id);
            if (existingTestCase == null)
                throw new KeyNotFoundException($"Test case {testCase.Id} not found for problem {problemId}");

            var dynamoItem = DynamoMapper.TestCaseToDynamoItem(problemId, testCase);
            var response = await PutItemAsync(dynamoItem, _testCaseTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Test case {TestCaseId} updated for problem {ProblemId}", testCase.Id, problemId);
                return;
            }

            throw new Exception("Failed to update test case in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating test case {TestCaseId} for problem {ProblemId}", testCase.Id, problemId);
            throw;
        }
    }

    public async Task DeleteTestCaseAsync(string problemId, string testCaseId)
    {
        try
        {
            var testCase = await GetTestCaseAsync(problemId, testCaseId);
            if (testCase == null)
                throw new KeyNotFoundException($"Test case {testCaseId} not found for problem {problemId}");

            testCase.IsDeleted = true;
            var dynamoItem = DynamoMapper.TestCaseToDynamoItem(problemId, testCase);
            var response = await PutItemAsync(dynamoItem, _testCaseTableName);
            
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("Test case {TestCaseId} deleted from problem {ProblemId}", testCaseId, problemId);
                return;
            }

            throw new Exception("Failed to delete test case in DynamoDB");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting test case {TestCaseId} from problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }

    public async Task<TestCase?> GetTestCaseAsync(string problemId, string testCaseId)
    {
        try
        {
            var request = new QueryRequest
            {
                TableName = _testCaseTableName,
                IndexName = "problemId-index",
                KeyConditionExpression = "problemId = :problemId",
                FilterExpression = "id = :id AND isDeleted = :false",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":problemId"] = new AttributeValue { S = problemId },
                    [":id"] = new AttributeValue { S = testCaseId },
                    [":false"] = new AttributeValue { BOOL = false }
                }
            };

            var response = await _dynamoDBClient.QueryAsync(request);

            if (response.Items.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToTestCase(response.Items[0]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test case {TestCaseId} for problem {ProblemId}", testCaseId, problemId);
            throw;
        }
    }

    public async Task<List<TestCase>> GetTestCasesByProblemIdAsync(string problemId)
    {
        try
        {
            var request = new QueryRequest
            {
                TableName = _testCaseTableName,
                IndexName = "problemId-index",
                KeyConditionExpression = "problemId = :problemId",
                FilterExpression = "isDeleted = :false",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":problemId"] = new AttributeValue { S = problemId },
                    [":false"] = new AttributeValue { BOOL = false }
                }
            };

            var response = await _dynamoDBClient.QueryAsync(request);
            var testCases = response.Items.Select(DynamoMapper.DynamoItemToTestCase).ToList();

            return testCases;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving test cases for problem {ProblemId}", problemId);
            throw;
        }
    }
}
