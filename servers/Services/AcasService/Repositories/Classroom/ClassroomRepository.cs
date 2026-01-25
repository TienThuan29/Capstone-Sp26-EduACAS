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

    public async Task SoftDeleteAsync(string classroomId)
    {
        try
        {
          
            var key = DynamoMapper.CreateKey(classroomId);
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                {
                    "isDeleted", new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { BOOL = true }
                    }
                },
                {
                    "updatedDate", new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = DateTime.UtcNow.ToString("o") }
                    }
                } 
                
            };
            await UpdateItemAsync(key, updates, _classroomTableName);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting classroom {Id}", classroomId);
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

    public async Task<IEnumerable<Models.Classroom>> GetClassroomsByKeywordAsync(string keyword)
    {
        try
        {
            var request = new ScanRequest { TableName = _classroomTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            var allClassrooms = response.Items
                .Select(item => DynamoMapper.DynamoItemToClassroom(item));
            if (!string.IsNullOrEmpty(keyword))
            {
                var lowerKeyword = keyword.ToLower().Trim();
                return allClassrooms.Where(c =>
                        (!string.IsNullOrEmpty(c.ClassCode) && c.ClassCode.ToLower().Contains(lowerKeyword))
                  );
            }

            return allClassrooms;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving classrooms by keyword {Keyword}", keyword);
            throw;
        }
    }

    public async Task<IEnumerable<Models.Classroom>> GetClassroomsByLecturerIdAsync(string lecturerId)
    {
        try
        {
            var request = new ScanRequest { TableName = _classroomTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            var allClassrooms = response.Items
                .Select(item => DynamoMapper.DynamoItemToClassroom(item));
            return allClassrooms.Where(c => c.LecturerId == lecturerId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving classrooms by lecturerId {LecturerId}", lecturerId);
            throw;
        }
    }



    public async Task<Models.Classroom?> FindByEnrollKeyAsync(string enrolKey)
    {
        try
        {
            var request = new QueryRequest
            {
                TableName = "acas-classrooms",
                IndexName = "EnrolKeyIndex",
                KeyConditionExpression = "enrolKey = :ek",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":ek", new AttributeValue { S = enrolKey } }
                },
                Limit = 1
            };

            var response = await _dynamoDBClient.QueryAsync(request);
            if (response.Items.Count == 0) return null;
            return DynamoMapper.DynamoItemToClassroom(response.Items[0]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding classroom by enroll key: {EnrolKey}", enrolKey);
            throw;
        }
    }
}