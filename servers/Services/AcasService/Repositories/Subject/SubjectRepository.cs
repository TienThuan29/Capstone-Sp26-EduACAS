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
}