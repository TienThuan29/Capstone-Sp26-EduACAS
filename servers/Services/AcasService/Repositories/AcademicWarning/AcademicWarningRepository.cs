using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.AcademicWarning;

public class AcademicWarningRepository : DynamoRepository, IAcademicWarningRepository
{
    private readonly string _academicWarningTableName;
    private readonly ILogger<AcademicWarningRepository> _logger;

    public AcademicWarningRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<AcademicWarningRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _logger = logger;
        _academicWarningTableName = configuration["DynamoDB:AcademicWarningTableName"] ??
            throw new ArgumentNullException("DynamoDB:AcademicWarningTableName is not configured");
        base.TableName = _academicWarningTableName;
    }

    public async Task<Models.AcademicWarning?> CreateAsync(Models.AcademicWarning academicWarning)
    {
        try
        {
            academicWarning.SentDate = DateTime.UtcNow;
            var item = DynamoMapper.AcademicWarningToDynamoItem(academicWarning);
            await PutItemAsync(item, _academicWarningTableName);
            return academicWarning;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating academic warning");
            throw;
        }
    }

    public async Task<Models.AcademicWarning?> FindByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _academicWarningTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToAcademicWarning(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding academic warning {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.AcademicWarning>> FindByStudentIdAsync(string studentId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _academicWarningTableName,
                FilterExpression = "studentId = :studentId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":studentId"] = new AttributeValue { S = studentId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToAcademicWarning(item))
                .OrderByDescending(aw => aw.SentDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding academic warnings for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<Models.AcademicWarning>> FindByClassroomIdAsync(string classroomId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _academicWarningTableName,
                FilterExpression = "classroomId = :classroomId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":classroomId"] = new AttributeValue { S = classroomId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToAcademicWarning(item))
                .OrderByDescending(aw => aw.SentDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding academic warnings for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<Models.AcademicWarning?> UpdateAsync(Models.AcademicWarning academicWarning)
    {
        try
        {
            academicWarning.UpdatedDate = DateTime.UtcNow;
            var item = DynamoMapper.AcademicWarningToDynamoItem(academicWarning);
            await PutItemAsync(item, _academicWarningTableName);
            return academicWarning;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating academic warning {Id}", academicWarning.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _academicWarningTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting academic warning {Id}", id);
            throw;
        }
    }
}
