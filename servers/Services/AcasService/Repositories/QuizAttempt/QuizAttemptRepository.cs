using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Globalization;

namespace AcasService.Repositories.QuizAttempt;

public class QuizAttemptRepository : DynamoRepository, IQuizAttemptRepository
{
    private readonly string _quizAttemptTableName;
    private readonly IConfiguration _configuration;

    public QuizAttemptRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<QuizAttemptRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _quizAttemptTableName = configuration["DynamoDB:QuizAttemptTableName"] ??
                     throw new ArgumentNullException("DynamoDB:QuizAttemptTableName is not configured");
        base.TableName = _quizAttemptTableName;
    }

    public async Task<Models.QuizAttempt?> CreateAsync(Models.QuizAttempt quizAttempt)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = quizAttempt.Id },
            ["classroomQuizId"] = new AttributeValue { S = quizAttempt.ClassroomQuizId },
            ["studentId"] = new AttributeValue { S = quizAttempt.StudentId },
            ["startTime"] = new AttributeValue { S = quizAttempt.StartTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["status"] = new AttributeValue { S = quizAttempt.Status.ToString() },
            ["attemptNumber"] = new AttributeValue { N = quizAttempt.AttemptNumber.ToString() }
        };

        if (quizAttempt.EndTime.HasValue)
            item["endTime"] = new AttributeValue { S = quizAttempt.EndTime.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        if (quizAttempt.FinalScore.HasValue)
            item["finalScore"] = new AttributeValue { N = quizAttempt.FinalScore.Value.ToString(CultureInfo.InvariantCulture) };

        await PutItemAsync(item, _quizAttemptTableName);
        return quizAttempt;
    }

    public async Task<Models.QuizAttempt?> FindByIdAsync(string quizAttemptId)
    {
        var key = new Dictionary<string, AttributeValue> { ["id"] = new AttributeValue { S = quizAttemptId } };
        var response = await GetItemAsync(key, _quizAttemptTableName);
        if (response.Item.Count == 0) return null;

        var item = response.Item;
        return new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N, CultureInfo.InvariantCulture) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        };
    }

    public async Task<List<Models.QuizAttempt>> FindAllAsync()
    {
        var response = await ScanAsync(_quizAttemptTableName);
        return response.Items.Select(item => new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N, CultureInfo.InvariantCulture) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        }).ToList();
    }

    public async Task<List<Models.QuizAttempt>> FindByClassroomQuizIdAsync(string classroomQuizId)
    {
        var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest
        {
            TableName = _quizAttemptTableName,
            FilterExpression = "classroomQuizId = :cqid",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":cqid"] = new AttributeValue { S = classroomQuizId }
            }
        };
        var response = await _dynamoDBClient.ScanAsync(scanRequest);
        return response.Items.Select(item => new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N, CultureInfo.InvariantCulture) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        }).ToList();
    }

    public async Task<List<Models.QuizAttempt>> FindByStudentIdAsync(string studentId)
    {
        var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest
        {
            TableName = _quizAttemptTableName,
            FilterExpression = "studentId = :sid",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":sid"] = new AttributeValue { S = studentId }
            }
        };
        var response = await _dynamoDBClient.ScanAsync(scanRequest);
        return response.Items.Select(item => new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        }).ToList();
    }

    public async Task<Models.QuizAttempt?> UpdateAsync(Models.QuizAttempt quizAttempt)
    {
        await CreateAsync(quizAttempt);
        return quizAttempt;
    }

    public async Task DeleteAsync(string quizAttemptId)
    {
        var key = new Dictionary<string, AttributeValue> { ["id"] = new AttributeValue { S = quizAttemptId } };
        await DeleteItemAsync(key, _quizAttemptTableName);
    }
    
    public async Task<int> GetMaxAttemptNumberAsync(string classroomQuizId)
{
    var filterExpression = "classroomQuizId = :cqid";
    var attributeValues = new Dictionary<string, AttributeValue> {
        [":cqid"] = new AttributeValue { S = classroomQuizId }
    };
    
    var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest {
        TableName = _quizAttemptTableName,
        FilterExpression = filterExpression,
        ExpressionAttributeValues = attributeValues
    };
    
    var response = await _dynamoDBClient.ScanAsync(scanRequest);
    if (response.Items.Count == 0) return 0;
    
    return response.Items.Max(i => int.Parse(i["attemptNumber"].N));
}

public async Task<int> GetMaxAttemptNumberAsync(string classroomQuizId, string studentId)
{
    var filterExpression = "classroomQuizId = :cqid AND studentId = :sid";
    var attributeValues = new Dictionary<string, AttributeValue> {
        [":cqid"] = new AttributeValue { S = classroomQuizId },
        [":sid"] = new AttributeValue { S = studentId }
    };

    var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest {
        TableName = _quizAttemptTableName,
        FilterExpression = filterExpression,
        ExpressionAttributeValues = attributeValues
    };

    var response = await _dynamoDBClient.ScanAsync(scanRequest);
    if (response.Items.Count == 0) return 0;

    return response.Items.Max(i => int.Parse(i["attemptNumber"].N));
}

    public async Task<List<Models.QuizAttempt>> FindHistoryAsync(string classroomQuizId, string studentId)
    {
        var filterExpression = "classroomQuizId = :cqid AND studentId = :sid";
        var attributeValues = new Dictionary<string, AttributeValue> {
            [":cqid"] = new AttributeValue { S = classroomQuizId },
            [":sid"] = new AttributeValue { S = studentId }
        };

        var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest {
            TableName = _quizAttemptTableName,
            FilterExpression = filterExpression,
            ExpressionAttributeValues = attributeValues
        };

        var response = await _dynamoDBClient.ScanAsync(scanRequest);
        return response.Items.Select(item => new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        }).ToList();
    }

    public async Task<Application.ResponseDTOs.PagedResult<Models.QuizAttempt>> FindPagedByClassroomQuizIdAsync(string classroomQuizId, int pageIndex, int pageSize)
    {
        var filterExpression = "classroomQuizId = :cqid";
        var attributeValues = new Dictionary<string, AttributeValue> {
            [":cqid"] = new AttributeValue { S = classroomQuizId }
        };

        var scanRequest = new Amazon.DynamoDBv2.Model.ScanRequest {
            TableName = _quizAttemptTableName,
            FilterExpression = filterExpression,
            ExpressionAttributeValues = attributeValues
        };

        var response = await _dynamoDBClient.ScanAsync(scanRequest);
        var allAttempts = response.Items.Select(item => new Models.QuizAttempt
        {
            Id = item["id"].S,
            ClassroomQuizId = item["classroomQuizId"].S,
            StudentId = item["studentId"].S,
            StartTime = DateTime.Parse(item["startTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            EndTime = item.ContainsKey("endTime") ? DateTime.Parse(item["endTime"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal) : null,
            Status = Enum.Parse<Models.QuizAttemptStatus>(item["status"].S),
            FinalScore = item.ContainsKey("finalScore") ? double.Parse(item["finalScore"].N) : null,
            AttemptNumber = int.Parse(item["attemptNumber"].N)
        }).OrderByDescending(a => a.StartTime).ToList();

        var pagedItems = allAttempts.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();
        return new Application.ResponseDTOs.PagedResult<Models.QuizAttempt>(pagedItems, allAttempts.Count, pageIndex, pageSize);
    }
}

