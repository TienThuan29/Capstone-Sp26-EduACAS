
using AcasService.Models;
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.ClassroomEnrollment;

public class ClassroomEnrollmentRepository : DynamoRepository, IClassroomEnrollmentRepository
{
    private readonly string _classroomEnrollmentTableName;
    private readonly IConfiguration _configuration;

    public ClassroomEnrollmentRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ClassroomEnrollmentRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _classroomEnrollmentTableName = configuration["DynamoDB:ClassroomEnrollmentTableName"] ??
                                         throw new ArgumentNullException("DynamoDB:ClassroomEnrollmentTableName is not configured");
    }

    public async Task<Models.ClassEnrollment?> CreateAsync(Models.ClassEnrollment enrollment)
    {
        try
        {
            var item = DynamoMapper.ToDynamoItem(enrollment);
            await PutItemAsync(item, _classroomEnrollmentTableName);
            return enrollment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating classroom enrollment");
            throw;
        }
    }

    public async Task<Models.ClassEnrollment?> FindByIdAsync(string enrollmentId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(enrollmentId);
            var response = await GetItemAsync(key, "ClassroomEnrollments");
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToClassEnrollment(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding classroom enrollment {Id}", enrollmentId);
            throw;
        }
    }

    public async Task<List<Models.ClassEnrollment>> FindByAllAsync()
    {
        try
        {
            var response = await ScanAsync(_classroomEnrollmentTableName);
            var enrollments = new List<Models.ClassEnrollment>();

            foreach (var item in response.Items)
            {
                var enrollment = DynamoMapper.DynamoItemToClassEnrollment(item);
                enrollments.Add(enrollment);
            }

            return enrollments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding classroom enrollments");
            throw;
        }
    }

    public async Task<Models.ClassEnrollment?> UpdateAsync(Models.ClassEnrollment enrollment)
    {
        try
        {
            var item = DynamoMapper.ToDynamoItem(enrollment);
            await PutItemAsync(item, _classroomEnrollmentTableName);
            return enrollment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating classroom enrollment {Id}", enrollment.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string enrollmentId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(enrollmentId);
            await DeleteItemAsync(key, "ClassroomEnrollments");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting classroom enrollment {Id}", enrollmentId);
            throw;
        }
    }


    public async Task<List<Models.ClassEnrollment>> FindByStudentIdAsync(string studentId)
    {
        try
        {
            var enrollments = new List<Models.ClassEnrollment>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _classroomEnrollmentTableName,
                    FilterExpression = "studentId = :studentId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":studentId"] = new AttributeValue { S = studentId }
                    },
                    ExclusiveStartKey = lastKey
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);

                foreach (var item in response.Items)
                {
                    enrollments.Add(
                        DynamoMapper.DynamoItemToClassEnrollment(item)
                    );
                }

                lastKey = response.LastEvaluatedKey;

            } while (lastKey != null && lastKey.Count > 0);

            return enrollments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding classroom enrollments for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<Models.ClassEnrollment?> FindByClassAndStudentIdAsync(string classId, string studentId)
    {
        var result = await FindByClassIdsAndStudentIdAsync(new[] { classId }, studentId);
        return result.GetValueOrDefault(classId);
    }

    public async Task<Dictionary<string, Models.ClassEnrollment?>> FindByClassIdsAndStudentIdAsync(IEnumerable<string> classIds, string studentId)
    {
        var idList = classIds.Distinct().Where(id => !string.IsNullOrWhiteSpace(id)).ToList();
        var result = new Dictionary<string, Models.ClassEnrollment?>(StringComparer.OrdinalIgnoreCase);
        if (idList.Count == 0)
            return result;
        foreach (var id in idList)
            result[id] = null;

        const int inLimit = 100; 
        var chunks = idList.Chunk(inLimit).ToList();

        var chunkTasks = chunks.Select(async chunk =>
        {
            var enrollments = new List<Models.ClassEnrollment>();
            var inValues = new Dictionary<string, AttributeValue>();
            inValues[":studentId"] = new AttributeValue { S = studentId };
            for (var i = 0; i < chunk.Length; i++)
                inValues[":c" + i] = new AttributeValue { S = chunk[i] };

            var inExpr = string.Join(", ", chunk.Select((_, i) => ":c" + i));
            Dictionary<string, AttributeValue>? lastKey = null;
            do
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _classroomEnrollmentTableName,
                    FilterExpression = "studentId = :studentId AND classId IN (" + inExpr + ")",
                    ExpressionAttributeValues = inValues,
                    ExclusiveStartKey = lastKey
                };
                var response = await _dynamoDBClient.ScanAsync(scanRequest);
                foreach (var item in response.Items)
                    enrollments.Add(DynamoMapper.DynamoItemToClassEnrollment(item));
                lastKey = response.LastEvaluatedKey;
            } while (lastKey != null && lastKey.Count > 0);

            return enrollments;
        });

        var chunkResults = await Task.WhenAll(chunkTasks);
        foreach (var enrollment in chunkResults.SelectMany(e => e))
            result[enrollment.ClassId] = enrollment;

        return result;
    }

    public async Task<List<Models.ClassEnrollment>> FindByClassIdAsync(string classId)
    {
        try
        {
            var enrollments = new List<Models.ClassEnrollment>();
            Dictionary<string, AttributeValue>? lastKey = null;

            do
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _classroomEnrollmentTableName,
                    FilterExpression = "classId = :classId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":classId"] = new AttributeValue { S = classId }
                    },
                    ExclusiveStartKey = lastKey
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);

                foreach (var item in response.Items)
                {
                    enrollments.Add(
                        DynamoMapper.DynamoItemToClassEnrollment(item)
                    );
                }

                lastKey = response.LastEvaluatedKey;

            } while (lastKey != null && lastKey.Count > 0);

            return enrollments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error finding classroom enrollments for class {ClassId}", classId);
            throw;
        }
    }

}