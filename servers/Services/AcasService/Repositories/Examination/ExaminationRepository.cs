using AcasService.Repositories.DynamoDb;
using AcasService.Web.Requests;
using AcasService.Application.ResponseDTOs;
using Amazon.DynamoDBv2;
using System.Net;
using AcasService.Models;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Examination;


public class ExaminationRepository : DynamoRepository, IExaminationRepository
{
    private readonly string _examinationTableName;
    private readonly IConfiguration _configuration;

    public ExaminationRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ExaminationRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _examinationTableName = configuration["DynamoDB:ExaminationTableName"] ??
        throw new ArgumentNullException("DynamoDB:ExaminationTable is not configured");
        base.TableName = _examinationTableName;
        var awsRegion = configuration["AWS:Region"] ?? "Not configured";
        logger.LogInformation("ExaminationRepository initialized - Region: {Region}, Table: {Table}", awsRegion, _examinationTableName);
    }

    public async Task<Models.Examination?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _examinationTableName);

            if (response.Item == null || response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToExamination(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examination by id: {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.Examination>> GetByIdsAsync(IEnumerable<string> ids)
    {
        var idList = ids.Distinct().Where(id => !string.IsNullOrEmpty(id)).ToList();
        if (idList.Count == 0)
            return new List<Models.Examination>();

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
                        [_examinationTableName] = new KeysAndAttributes { Keys = keys }
                    }
                };
                return _dynamoDBClient.BatchGetItemAsync(request);
            })
            .ToList();

        var responses = await Task.WhenAll(batches);
        return responses
            .SelectMany(r => r.Responses.TryGetValue(_examinationTableName, out var items) ? items : [])
            .Select(DynamoMapper.DynamoItemToExamination)
            .ToList();
    }

    public async Task<List<Models.Examination?>> GetAllAsync()
    {
        try
        {
            var response = await ScanAsync(_examinationTableName);
            return response.Items
                .Select(item => (Models.Examination?)DynamoMapper.DynamoItemToExamination(item))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting all examinations");
            throw;
        }
    }

    public async Task<Models.Examination?> CreateAsync(Models.Examination examination)
    {
        try
        {
            examination.Id = Guid.NewGuid().ToString();
            examination.CreatedDate = DateTime.UtcNow;
            examination.UpdatedDate = DateTime.UtcNow;

            var dynamoItem = DynamoMapper.ExaminationToDynamoItem(examination);
            var response = await PutItemAsync(dynamoItem, _examinationTableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await GetByIdAsync(examination.Id);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating examination");
            throw;
        }
    }

    public async Task<Models.Examination?> UpdateAsync(string id, Models.Examination examination)
    {
        try
        {
            Models.Examination? existingExam = await GetByIdAsync(id);
            if (existingExam == null)
            {
                throw new Exception("Examination with given Id does not exist.");
            }
            examination.UpdatedDate = DateTime.UtcNow;
            var dynamoItem = DynamoMapper.ExaminationToDynamoItem(examination);
            var response = await PutItemAsync(dynamoItem, _examinationTableName);
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await GetByIdAsync(id);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating examination with Id: {Id}", id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            Models.Examination? existingExam = await GetByIdAsync(id);
            if (existingExam == null)
            {
                throw new Exception("Examination with given Id does not exist.");
            }
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _examinationTableName);
            if (await GetByIdAsync(id) != null)
            {
                throw new Exception("Failed to delete the examination.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting examination with Id: {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.Examination>> GetByClassIdAsync(string classId)
    {
        try
        {
            var request = new ScanRequest { TableName = _examinationTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            var result = response.Items
                .Where(item =>
                    item.ContainsKey("classroomId") &&
                    item["classroomId"].S == classId
                )
                .Select(DynamoMapper.DynamoItemToExamination)
                .ToList();

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error occurred while getting examinations by class Id: {ClassId}",classId);
            throw;
        }
    }

    public async Task<List<Models.Examination>> GetByClassIdsAsync(IEnumerable<string> classIds)
    {
        try
        {
            var classIdSet = classIds.Where(id => !string.IsNullOrEmpty(id)).ToHashSet();
            if (classIdSet.Count == 0)
                return new List<Models.Examination>();

            var request = new ScanRequest { TableName = _examinationTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            var result = response.Items
                .Where(item =>
                    item.ContainsKey("classroomId") &&
                    classIdSet.Contains(item["classroomId"].S)
                )
                .Select(DynamoMapper.DynamoItemToExamination)
                .ToList();

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examinations by class Ids");
            throw;
        }
    }

    public async Task<List<Models.Examination>> GetByClassIdAndModeAsync(string classId, string mode)
    {
        try
        {
            var request = new ScanRequest { TableName = _examinationTableName };
            var response = await _dynamoDBClient.ScanAsync(request);
            var result = response.Items
                .Where(item =>
                    item.ContainsKey("classroomId") &&
                    item["classroomId"].S == classId &&
                    item.ContainsKey("mode") &&
                    item["mode"].S == mode
                )
                .Select(DynamoMapper.DynamoItemToExamination)
                .ToList();

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting examinations by class Id: {ClassId} and mode: {Mode}", classId, mode);
            throw;
        }
    }


}