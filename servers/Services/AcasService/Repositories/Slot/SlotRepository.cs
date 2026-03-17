using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Slot;

public class SlotRepository : DynamoRepository, ISlotRepository
{
    private readonly string _slotTableName;
    private readonly IConfiguration _configuration;

    public SlotRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<SlotRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _slotTableName = configuration["DynamoDB:SlotTableName"] ??
                     throw new ArgumentNullException("DynamoDB:SlotTableName is not configured");
        base.TableName = _slotTableName;
    }

    public async Task<Models.Slot?> CreateAsync(Models.Slot slot)
    {
        try
        {
            var item = DynamoMapper.SlotToDynamoItem(slot);
            await PutItemAsync(item, _slotTableName);
            return slot;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating slot");
            throw;
        }
    }

    public async Task<Models.Slot?> FindByIdAsync(string slotId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(slotId);
            var response = await GetItemAsync(key, _slotTableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToSlot(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding slot {Id}", slotId);
            throw;
        }
    }

    public async Task<List<Models.Slot>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _slotTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToSlot(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all slots");
            throw;
        }
    }

    public async Task<Models.Slot?> UpdateAsync(Models.Slot slot)
    {
        try
        {
            var item = DynamoMapper.SlotToDynamoItem(slot);
            await PutItemAsync(item, _slotTableName);
            return slot;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slot {Id}", slot.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string slotId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(slotId);
            await DeleteItemAsync(key, _slotTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slot {Id}", slotId);
            throw;
        }
    }

    public async Task<IEnumerable<Models.Slot>> GetSlotsByClassroomIdAsync(string classroomId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _slotTableName,
                FilterExpression = "classroomId = :classroomId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":classroomId", new AttributeValue { S = classroomId } }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToSlot(item))
                .OrderBy(s => s.SlotNumber)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slots by classroom id: {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<IEnumerable<Models.Slot>> GetSlotsByKeywordAsync(string keyword)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _slotTableName,
                FilterExpression = "contains(#title, :keyword) OR contains(#description, :keyword)",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    { "#title", "title" },
                    { "#description", "description" }
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":keyword", new AttributeValue { S = keyword } }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToSlot(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching slots by keyword: {Keyword}", keyword);
            throw;
        }
    }


    public async Task AddRangeAsync(List<Models.Slot> slots)
    {
        if (slots == null || slots.Count == 0)
            return;

        try
        {
            const int batchSize = 25; 
            var batches = slots
                .Chunk(batchSize)
                .Select(chunk => new BatchWriteItemRequest
                {
                    RequestItems = new Dictionary<string, List<WriteRequest>>
                    {
                        [_slotTableName] = chunk
                            .Select(slot => new WriteRequest
                            {
                                PutRequest = new PutRequest { Item = DynamoMapper.SlotToDynamoItem(slot) }
                            })
                            .ToList()
                    }
                })
                .ToList();

            foreach (var batch in batches)
            {
                await _dynamoDBClient.BatchWriteItemAsync(batch);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating slot range");
            throw;
        }
    }

}
