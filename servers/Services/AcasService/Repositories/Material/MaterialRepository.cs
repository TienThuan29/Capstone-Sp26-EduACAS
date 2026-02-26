using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Material;

public class MaterialRepository : DynamoRepository, IMaterialRepository
{
    private readonly string _materialTableName;
    private readonly IConfiguration _configuration;

    public MaterialRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<MaterialRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _materialTableName = configuration["DynamoDB:MaterialTableName"] ??
                     throw new ArgumentNullException("DynamoDB:MaterialTableName is not configured");
        base.TableName = _materialTableName;
    }

    public async Task<Models.Material?> CreateAsync(Models.Material material)
    {
        try
        {
            var item = DynamoMapper.MaterialToDynamoItem(material);
            await PutItemAsync(item, _materialTableName);
            return material;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating material");
            throw;
        }
    }

    public async Task<Models.Material?> FindByIdAsync(string materialId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(materialId);
            var response = await GetItemAsync(key, _materialTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToMaterial(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding material {Id}", materialId);
            throw;
        }
    }

    public async Task<List<Models.Material>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _materialTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToMaterial(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all materials");
            throw;
        }
    }

    public async Task<List<Models.Material>> FindByClassroomIdAsync(string classroomId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _materialTableName,
                FilterExpression = "classroomId = :classroomId and isDeleted = :isDeleted",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":classroomId"] = new AttributeValue { S = classroomId },
                    [":isDeleted"] = new AttributeValue { BOOL = false }
                }
            };
            
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToMaterial(item))
                .OrderByDescending(m => m.CreatedDate)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding materials for classroom {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<Models.Material?> UpdateAsync(Models.Material material)
    {
        try
        {
            var item = DynamoMapper.MaterialToDynamoItem(material);
            await PutItemAsync(item, _materialTableName);
            return material;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating material {Id}", material.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string materialId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(materialId);
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                {
                    "isDeleted", new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { BOOL = true }
                    }
                }
            };
            await UpdateItemAsync(key, updates, _materialTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting material {Id}", materialId);
            throw;
        }
    }

    public async Task DeleteAsync(string materialId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(materialId);
            await DeleteItemAsync(key, _materialTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting material {Id}", materialId);
            throw;
        }
    }
}