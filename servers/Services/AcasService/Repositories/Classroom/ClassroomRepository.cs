using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Classroom;

public class ClassroomRepository : DynamoRepository, IClassroomRepository
{
    private readonly string _classroomTableName;
    private readonly IConfiguration _configuration;

    public ClassroomRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ClassroomRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _classroomTableName = configuration["DynamoDB:ClassroomTableName"] ??
                     throw new ArgumentNullException("DynamoDB:ClassroomTableName is not configured");
        base.TableName = _classroomTableName;
    }

    public async Task<Models.Classroom?> CreateAsync(Models.Classroom classroom)
    {
        try
        {
            var item = DynamoMapper.ClassroomToDynamoItem(classroom);
            await PutItemAsync(item, _classroomTableName);
            return classroom;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating classroom");
            throw;
        }
    }

    public async Task<Models.Classroom?> FindByIdAsync(string classroomId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(classroomId);
            var response = await GetItemAsync(key, _classroomTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToClassroom(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding classroom {Id}", classroomId);
            throw;
        }
    }

    public async Task<List<Models.Classroom>> FindAllAsync()
        {
        try
        {
            var request = new ScanRequest { TableName = _classroomTableName };
            
            var response = await _dynamoDBClient.ScanAsync(request);
               return response.Items
                .Select(item => DynamoMapper.DynamoItemToClassroom(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all classrooms");
            throw;
        }
    }

    public async Task<Models.Classroom?> UpdateAsync(Models.Classroom classroom)
    {
        try
        {
            var item = DynamoMapper.ClassroomToDynamoItem(classroom);
            await PutItemAsync(item, _classroomTableName);
            return classroom;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating classroom {Id}", classroom.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string classroomId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(classroomId);

            await DeleteItemAsync(key, _classroomTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting classroom {Id}", classroomId);
            throw;
        }
    }




}