namespace AcasService.Repositories.ProgrammingLanguage;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Amazon.DynamoDBv2;
using AcasService.Models;
using AcasService.Repositories.DynamoDb;
using System.Net;


public class ProgrammingLanguageRepository : DynamoRepository, IProgrammingLanguageRepository
{

    private readonly string _tableName;
    private readonly IConfiguration _configuration;

    public ProgrammingLanguageRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ProgrammingLanguageRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;

        _tableName = configuration["DynamoDB:ProgrammingLanguageTableName"] ??
        throw new ArgumentNullException("DynamoDB:ProgrammingLanguageTable is not configured");
        base.TableName = _tableName;
        var awsRegion = configuration["AWS:Region"] ?? "Not configured";
        logger.LogInformation(
            "ProgrammingLanguageRepository initialized - Region: {Region}, Table: {Table}", awsRegion, _tableName);
    }

    public async Task<ProgrammingLanguage?> CreateAsync(ProgrammingLanguage language)
    {
        try
        {
            language.Id = Guid.NewGuid().ToString();
            language.IsEnable = true;
            language.CreatedDate = DateTime.UtcNow;
            language.UpdatedDate = DateTime.UtcNow;

            var dynamoItem = DynamoMapper.ProgrammingLanguageToDynamoItem(language);

            var response = await PutItemAsync(dynamoItem, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await GetByIdAsync(language.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating programming language");
            throw;
        }
    }

    public async Task<ProgrammingLanguage?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _tableName);
            if (response.Item == null || response.Item.Count == 0)
            {
                return null;
            }
            return DynamoMapper.DynamoItemToProgrammingLanguage(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error getting programming language by ID: {Id}", id);
            throw;
        }
    }


    public async Task<IEnumerable<Models.ProgrammingLanguage>> GetAllAsync()
    {
        try
        {
            var response = await ScanAsync(_tableName);
            var languages = response.Items.Select(DynamoMapper.DynamoItemToProgrammingLanguage);
            return languages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all programming languages");
            throw;
        }
    }

    public async Task<Models.ProgrammingLanguage?> UpdateAsync(string id, Models.ProgrammingLanguage language)
    {
        try
        {
            var existingLanguage = await GetByIdAsync(id);
            if (existingLanguage == null)
            {
                throw new Exception("Programming language not found");
            }

            language.UpdatedDate = DateTime.UtcNow;
            var dynamoItem = DynamoMapper.ProgrammingLanguageToDynamoItem(language);
            var response = await PutItemAsync(dynamoItem, _tableName);
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await GetByIdAsync(language.Id);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating programming language");
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var existingLanguage = await GetByIdAsync(id);
            if (existingLanguage == null)
            {
                throw new Exception("Programming language not found");
            }
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _tableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting programming language");
            throw;
        }
    }


}