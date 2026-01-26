namespace AcasService.Repositories.ProgrammingLanguage;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Amazon.DynamoDBv2;
using AcasService.Models;
using AcasService.Repositories.DynamoDb;
using System.Net;


public class ProgrammingLanguageRepository : DynamoRepository, IProgrammingLanguageRepository
{

    private readonly string _programmingLanguageTableName;
    private readonly IConfiguration _configuration;

    public ProgrammingLanguageRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<ProgrammingLanguageRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;

        _programmingLanguageTableName = configuration["DynamoDB:ProgrammingLanguageTableName"]?? 
        throw new ArgumentNullException("DynamoDB:ProgrammingLanguageTable is not configured");
        base.TableName = _programmingLanguageTableName;
        var awsRegion = configuration["AWS:Region"] ?? "Not configured";
        logger.LogInformation(
            "ProgrammingLanguageRepository initialized - Region: {Region}, Table: {Table}",awsRegion, _programmingLanguageTableName);
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

            var response = await PutItemAsync(dynamoItem, _programmingLanguageTableName);

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
            var response = await GetItemAsync(key, _programmingLanguageTableName);
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
            var response = await ScanAsync(_programmingLanguageTableName);
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
            var response = await PutItemAsync(dynamoItem, _programmingLanguageTableName);
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
            await DeleteItemAsync(key, _programmingLanguageTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting programming language");
            throw;
        }
    }

    public async Task<ProgrammingLanguage?> ToggleEnableAsync(string id)
    {
        try
        {
            var language = await GetByIdAsync(id);
            if (language == null)
            {
                throw new Exception("Programming language not found");
            }

            language.IsEnable = !language.IsEnable;
            language.UpdatedDate = DateTime.UtcNow;

            var dynamoItem = DynamoMapper.ProgrammingLanguageToDynamoItem(language);
            var response = await PutItemAsync(dynamoItem, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await GetByIdAsync(id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling enable status for programming language: {Id}", id);
            throw;
        }
    }

    public async Task<IEnumerable<ProgrammingLanguage>> SearchAsync(string? searchTerm = null, bool? isEnable = null)
    {
        try
        {
            var allLanguages = await GetAllAsync();
            
            var filtered = allLanguages.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filtered = filtered.Where(l => 
                    l.LanguageName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    l.Key.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    l.LanguageVersion.Contains(searchTerm, StringComparison.OrdinalIgnoreCase));
            }

            if (isEnable.HasValue)
            {
                filtered = filtered.Where(l => l.IsEnable == isEnable.Value);
            }

            return filtered;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching programming languages");
            throw;
        }
    }

    public async Task<ProgrammingLanguage?> GetByKeyAsync(string key)
    {
        try
        {
            var allLanguages = await GetAllAsync();
            return allLanguages.FirstOrDefault(l => 
                l.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting programming language by key: {Key}", key);
            throw;
        }
    }

    public async Task<(IEnumerable<ProgrammingLanguage> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, string? sortBy = null, bool ascending = true)
    {
        try
        {
            var allLanguages = (await GetAllAsync()).ToList();
            var totalCount = allLanguages.Count;

            // Sorting
            IEnumerable<ProgrammingLanguage> sorted = sortBy?.ToLower() switch
            {
                "name" => ascending 
                    ? allLanguages.OrderBy(l => l.LanguageName)
                    : allLanguages.OrderByDescending(l => l.LanguageName),
                "key" => ascending 
                    ? allLanguages.OrderBy(l => l.Key)
                    : allLanguages.OrderByDescending(l => l.Key),
                "version" => ascending 
                    ? allLanguages.OrderBy(l => l.LanguageVersion)
                    : allLanguages.OrderByDescending(l => l.LanguageVersion),
                "createdate" => ascending 
                    ? allLanguages.OrderBy(l => l.CreatedDate)
                    : allLanguages.OrderByDescending(l => l.CreatedDate),
                "updatedate" => ascending 
                    ? allLanguages.OrderBy(l => l.UpdatedDate)
                    : allLanguages.OrderByDescending(l => l.UpdatedDate),
                _ => allLanguages.OrderByDescending(l => l.CreatedDate)
            };

            // Pagination
            var paged = sorted
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (paged, totalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged programming languages");
            throw;
        }
    }

}