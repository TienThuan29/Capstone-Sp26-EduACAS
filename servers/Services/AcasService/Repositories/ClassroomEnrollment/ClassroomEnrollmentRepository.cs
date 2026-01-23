
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.ClassroomEnrollment;

public class ClassroomEnrollmentRepository: DynamoRepository, IClassroomEnrollmentRepository
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
    try
    {
        Dictionary<string, AttributeValue>? lastKey = null;
        do
        {
            var scanRequest = new ScanRequest
            {
                TableName = _classroomEnrollmentTableName,
                FilterExpression = "classId = :classId AND studentId = :studentId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":classId"] = new AttributeValue { S = classId },
                    [":studentId"] = new AttributeValue { S = studentId }
                },
                ExclusiveStartKey = lastKey
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);

            foreach (var item in response.Items)
            {
                return DynamoMapper.DynamoItemToClassEnrollment(item);
            }

            lastKey = response.LastEvaluatedKey;

        } while (lastKey != null && lastKey.Count > 0);

        return null;
    }
    catch (Exception exception)
    {
        throw new Exception($"Error finding classroom enrollment for class {classId} and student {studentId}",
            exception);
    }
}
}