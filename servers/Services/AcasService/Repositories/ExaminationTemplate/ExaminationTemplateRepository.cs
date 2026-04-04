using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.ExaminationTemplate;

public class ExaminationTemplateRepository : DynamoRepository, IExaminationTemplateRepository
{
    private readonly string _tableName;
    private readonly IConfiguration _configuration;

    public ExaminationTemplateRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ExaminationTemplateRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _tableName = configuration["DynamoDB:ExaminationTemplateTableName"] ??
            throw new ArgumentNullException("DynamoDB:ExaminationTemplateTableName is not configured");
        base.TableName = _tableName;
    }

    public async Task<Models.ExaminationTemplate?> CreateAsync(Models.ExaminationTemplate template)
    {
        try
        {
            template.Id = Guid.NewGuid().ToString();
            template.CreatedDate = DateTime.UtcNow;
            template.IsDeleted = false;

            var item = DynamoMapper.ExaminationTemplateToDynamoItem(template);
            await PutItemAsync(item, _tableName);

            return await FindByIdAsync(template.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating examination template");
            throw;
        }
    }

    public async Task<Models.ExaminationTemplate?> FindByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _tableName);
            if (response.Item.Count == 0) return null;
            return DynamoMapper.DynamoItemToExaminationTemplate(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding examination template {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.ExaminationTemplate>> FindByIdsAsync(IEnumerable<string> ids)
    {
        var idList = ids.Distinct().Where(id => !string.IsNullOrWhiteSpace(id)).ToList();
        if (idList.Count == 0)
            return new List<Models.ExaminationTemplate>();

        const int batchSize = 100;
        var batches = idList
            .Chunk(batchSize)
            .Select(batchIds =>
            {
                var keys = batchIds.Select(id => DynamoMapper.CreateKey(id)).ToList();
                var request = new BatchGetItemRequest
                {
                    RequestItems = new Dictionary<string, KeysAndAttributes>
                    {
                        [_tableName] = new KeysAndAttributes { Keys = keys }
                    }
                };
                return _dynamoDBClient.BatchGetItemAsync(request);
            })
            .ToList();

        var responses = await Task.WhenAll(batches);
        return responses
            .SelectMany(r => r.Responses.TryGetValue(_tableName, out var items) ? items : [])
            .Select(DynamoMapper.DynamoItemToExaminationTemplate)
            .ToList();
    }

    public async Task<List<Models.ExaminationTemplate>> FindAllAsync()
    {
        try
        {
            var response = await ScanAsync(_tableName);
            return response.Items
                .Select(item => DynamoMapper.DynamoItemToExaminationTemplate(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all examination templates");
            throw;
        }
    }

    public async Task<Models.ExaminationTemplate?> UpdateAsync(Models.ExaminationTemplate template)
    {
        try
        {
            var existing = await FindByIdAsync(template.Id);
            if (existing == null)
            {
                _logger.LogError("Examination template not found for update");
                throw new KeyNotFoundException("Examination template not found");
            }

            template.UpdatedDate = DateTime.UtcNow;
            var item = DynamoMapper.ExaminationTemplateToDynamoItem(template);
            await PutItemAsync(item, _tableName);

            return await FindByIdAsync(template.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating examination template {Id}", template.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var existing = await FindByIdAsync(id);
            if (existing == null)
            {
                _logger.LogError("Examination template not found for deletion");
                throw new KeyNotFoundException("Examination template not found");
            }

            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _tableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting examination template {Id}", id);
            throw;
        }
    }

    public async Task<Models.ExaminationTemplate?> SoftDeleteAsync(string id)
    {
        try
        {
            var existing = await FindByIdAsync(id);
            if (existing == null)
            {
                _logger.LogError("Examination template not found for soft delete");
                throw new KeyNotFoundException("Examination template not found");
            }

            existing.IsDeleted = true;
            existing.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.ExaminationTemplateToDynamoItem(existing);
            await PutItemAsync(item, _tableName);

            return await FindByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting examination template {Id}", id);
            throw;
        }
    }

    public async Task<Models.ExaminationTemplate?> RestoreAsync(string id)
    {
        try
        {
            var existing = await FindByIdAsync(id);
            if (existing == null)
            {
                _logger.LogError("Examination template not found for restore");
                throw new KeyNotFoundException("Examination template not found");
            }

            existing.IsDeleted = false;
            existing.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.ExaminationTemplateToDynamoItem(existing);
            await PutItemAsync(item, _tableName);

            return await FindByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring examination template {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.ExaminationTemplate>> GetByLecturerIdAsync(string lecturerId)
    {
        try
        {
            var allTemplates = await FindAllAsync();
            return allTemplates.Where(t => t.LecturerId == lecturerId).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting examination templates by lecturer {LecturerId}", lecturerId);
            throw;
        }
    }
}
