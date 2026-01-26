using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Net;

namespace AcasService.Repositories.Subject;

public class SubjectRepository : DynamoRepository, ISubjectRepository
{
    private readonly string _subjectTableName;
    private readonly IConfiguration _configuration;

    public SubjectRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<SubjectRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _subjectTableName = configuration["DynamoDB:SubjectTableName"] ??
                     throw new ArgumentNullException("DynamoDB:SubjectTableName is not configured");
        base.TableName = _subjectTableName;
    }

    public async Task<Models.Subject?> CreateAsync(Models.Subject subject)
    {
        try
        {
            var item = DynamoMapper.SubjectToDynamoItem(subject);

            await PutItemAsync(item, _subjectTableName);

            return subject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subject");
            throw;
        }
    }


    public async Task<Models.Subject?> FindByIdAsync(string subjectId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(subjectId);
            var response = await GetItemAsync(key, _subjectTableName);

            if (response.Item.Count == 0) return null;

            return DynamoMapper.DynamoItemToSubject(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding subject {Id}", subjectId);
            throw;
        }
    }


    public async Task<List<Models.Subject>> FindAllAsync()
    {
        try
        {
            var request = new ScanRequest { TableName = _subjectTableName };
            var response = await _dynamoDBClient.ScanAsync(request);

            return response.Items.Select(item => DynamoMapper.DynamoItemToSubject(item)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all subjects");
            throw;
        }
    }

    public async Task<Models.Subject?> UpdateAsync(Models.Subject subject)
    {
        try
        {
            var item = DynamoMapper.SubjectToDynamoItem(subject);

            await PutItemAsync(item, _subjectTableName);

            return subject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subject {Id}", subject.Id);
            throw;
        }
    }

    public async Task SoftDeleteAsync(string subjectId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(subjectId);
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
            await UpdateItemAsync(key, updates, _subjectTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting subject {Id}", subjectId);
            throw;
        }
    }

    public async Task DeleteAsync(string subjectId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(subjectId);

            await DeleteItemAsync(key, _subjectTableName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subject {Id}", subjectId); 
            throw;
        }
    }

    public async Task<Models.Subject?> SoftDeleteAsync(string subjectId)
    {
        try
        {
            var subject = await FindByIdAsync(subjectId);
            if (subject == null)
            {
                throw new KeyNotFoundException($"Subject with id {subjectId} not found");
            }

            subject.IsDeleted = true;
            subject.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.SubjectToDynamoItem(subject);
            await PutItemAsync(item, _subjectTableName);

            return subject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting subject {Id}", subjectId);
            throw;
        }
    }

    public async Task<Models.Subject?> RestoreAsync(string subjectId)
    {
        try
        {
            var subject = await FindByIdAsync(subjectId);
            if (subject == null)
            {
                throw new KeyNotFoundException($"Subject with id {subjectId} not found");
            }

            subject.IsDeleted = false;
            subject.UpdatedDate = DateTime.UtcNow;

            var item = DynamoMapper.SubjectToDynamoItem(subject);
            await PutItemAsync(item, _subjectTableName);

            return subject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring subject {Id}", subjectId);
            throw;
        }
    }

    public async Task<List<Models.Subject>> SearchAsync(
        string? searchTerm = null,
        bool? isDeleted = null,
        string? createdBy = null)
    {
        try
        {
            var allSubjects = await FindAllAsync();
            var filtered = allSubjects.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filtered = filtered.Where(s =>
                    s.SubjectCode.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    s.SubjectName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    s.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase));
            }

            if (isDeleted.HasValue)
            {
                filtered = filtered.Where(s => s.IsDeleted == isDeleted.Value);
            }

            if (!string.IsNullOrWhiteSpace(createdBy))
            {
                filtered = filtered.Where(s =>
                    s.CreatedBy.Contains(createdBy, StringComparison.OrdinalIgnoreCase));
            }

            return filtered.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching subjects");
            throw;
        }
    }

    public async Task<Models.Subject?> GetBySubjectCodeAsync(string subjectCode)
    {
        try
        {
            var allSubjects = await FindAllAsync();
            return allSubjects.FirstOrDefault(s =>
                s.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subject by code: {Code}", subjectCode);
            throw;
        }
    }

    public async Task<bool> IsSubjectCodeExistsAsync(string subjectCode, string? excludeId = null)
    {
        try
        {
            var allSubjects = await FindAllAsync();
            return allSubjects.Any(s =>
                s.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase) &&
                (excludeId == null || s.Id != excludeId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subject code existence: {Code}", subjectCode);
            throw;
        }
    }

    public async Task<(List<Models.Subject> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        string? sortBy = null,
        bool ascending = true,
        bool? includeDeleted = false)
    {
        try
        {
            var allSubjects = await FindAllAsync();

            // Filter deleted subjects
            if (includeDeleted == false)
            {
                allSubjects = allSubjects.Where(s => !s.IsDeleted).ToList();
            }

            var totalCount = allSubjects.Count;

            // Sorting
            IEnumerable<Models.Subject> sorted = sortBy?.ToLower() switch
            {
                "code" => ascending
                    ? allSubjects.OrderBy(s => s.SubjectCode)
                    : allSubjects.OrderByDescending(s => s.SubjectCode),
                "name" => ascending
                    ? allSubjects.OrderBy(s => s.SubjectName)
                    : allSubjects.OrderByDescending(s => s.SubjectName),
                "createdby" => ascending
                    ? allSubjects.OrderBy(s => s.CreatedBy)
                    : allSubjects.OrderByDescending(s => s.CreatedBy),
                "createdate" => ascending
                    ? allSubjects.OrderBy(s => s.CreatedDate)
                    : allSubjects.OrderByDescending(s => s.CreatedDate),
                "updatedate" => ascending
                    ? allSubjects.OrderBy(s => s.UpdatedDate)
                    : allSubjects.OrderByDescending(s => s.UpdatedDate),
                _ => allSubjects.OrderByDescending(s => s.CreatedDate)
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
            _logger.LogError(ex, "Error getting paged subjects");
            throw;
        }
    }

    public async Task<int> BulkSoftDeleteAsync(List<string> subjectIds)
    {
        try
        {
            int count = 0;
            foreach (var id in subjectIds)
            {
                try
                {
                    await SoftDeleteAsync(id);
                    count++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to soft delete subject {Id}", id);
                }
            }
            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk soft delete");
            throw;
        }
    }

    public async Task<int> BulkRestoreAsync(List<string> subjectIds)
    {
        try
        {
            int count = 0;
            foreach (var id in subjectIds)
            {
                try
                {
                    await RestoreAsync(id);
                    count++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to restore subject {Id}", id);
                }
            }
            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk restore");
            throw;
        }
    }
}