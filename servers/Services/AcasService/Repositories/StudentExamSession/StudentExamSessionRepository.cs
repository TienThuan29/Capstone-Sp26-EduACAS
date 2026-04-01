using System.Net;
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.StudentExamSession;

public class StudentExamSessionRepository : DynamoRepository, IStudentExamSessionRepository
{
    private readonly string _sessionTableName;

    public StudentExamSessionRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<StudentExamSessionRepository> logger)
        : base(dynamoDbClient, logger)
    {
        _sessionTableName = configuration["DynamoDB:StudentExamSessionTableName"] ??
                     throw new ArgumentNullException("DynamoDB:StudentExamSessionTableName is not configured");
        base.TableName = _sessionTableName;
    }

    public async Task<Models.StudentExamSession?> GetByStudentAndExamAsync(string studentId, string examId)
    {
        var id = Models.StudentExamSession.ComposeId(studentId, examId);
        var key = DynamoMapper.CreateKey(id);
        var response = await GetItemAsync(key, _sessionTableName);
        if (response.Item == null || response.Item.Count == 0)
            return null;
        return DynamoMapper.FromDynamoItem(response.Item);
    }

    public async Task<Models.StudentExamSession?> UpsertAsync(Models.StudentExamSession session)
    {
        session.UpdatedDate = DateTime.UtcNow;
        if (session.CreatedDate == default)
            session.CreatedDate = DateTime.UtcNow;
        var item = DynamoMapper.ToDynamoItem(session);
        var response = await PutItemAsync(item, _sessionTableName);
        if (response.HttpStatusCode != HttpStatusCode.OK)
            return null;
        return await GetByStudentAndExamAsync(session.StudentId, session.ExamId);
    }

    public async Task<Models.StudentExamSession?> FindActiveByStudentAsync(string studentId)
    {
        // Filtered scan — acceptable for low volume; add GSI (studentId + phase) for scale.
        var request = new ScanRequest
        {
            TableName = _sessionTableName,
            FilterExpression = "studentId = :sid AND phase = :ph",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":sid"] = new AttributeValue { S = studentId },
                [":ph"] = new AttributeValue { N = ((int)Models.StudentExamSessionPhase.Active).ToString() },
            },
            Limit = 10,
        };

        ScanResponse response;
        do
        {
            response = await _dynamoDBClient.ScanAsync(request);
            foreach (var it in response.Items)
            {
                var s = DynamoMapper.FromDynamoItem(it);
                if (s.Phase == Models.StudentExamSessionPhase.Active)
                    return s;
            }
            request.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

        return null;
    }
}
