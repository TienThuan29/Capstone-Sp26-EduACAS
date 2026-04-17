using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.DynamoDb;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Net;

namespace AcasService.Repositories.RegradingRequest;

public class RegradingRequestRepository : DynamoRepository, IRegradingRequestRepository
{
    private readonly string _tableName;
    private readonly IConfiguration _configuration;

    public RegradingRequestRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<RegradingRequestRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _tableName = configuration["DynamoDB:RegradingRequestTableName"] ??
            throw new ArgumentNullException("DynamoDB:RegradingRequestTableName is not configured");
        base.TableName = _tableName;
    }

    public async Task<Models.RegradingRequest?> CreateAsync(Models.RegradingRequest request)
    {
        try
        {
            request.Id = Guid.NewGuid().ToString();
            request.CreatedDate = DateTime.UtcNow;

            var item = DynamoMapper.RegradingRequestToDynamoItem(request);
            var response = await PutItemAsync(item, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("RegradingRequest {Id} created successfully", request.Id);
                return await GetByIdAsync(request.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating RegradingRequest");
            throw;
        }
    }

    public async Task<Models.RegradingRequest?> GetByIdAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            var response = await GetItemAsync(key, _tableName);

            if (response.Item == null || response.Item.Count == 0)
                return null;

            return DynamoMapper.DynamoItemToRegradingRequest(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<Models.RegradingRequest?> UpdateAsync(Models.RegradingRequest request)
    {
        try
        {
            var item = DynamoMapper.RegradingRequestToDynamoItem(request);
            var response = await PutItemAsync(item, _tableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                _logger.LogInformation("RegradingRequest {Id} updated successfully", request.Id);
                return await GetByIdAsync(request.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating RegradingRequest {Id}", request.Id);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            var key = DynamoMapper.CreateKey(id);
            await DeleteItemAsync(key, _tableName);
            _logger.LogInformation("RegradingRequest {Id} deleted successfully", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<List<Models.RegradingRequest>> GetByStudentIdAsync(string studentId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "studentId = :studentId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":studentId"] = new AttributeValue { S = studentId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToRegradingRequest).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegradingRequests for student {StudentId}", studentId);
            throw;
        }
    }

    public async Task<List<Models.RegradingRequest>> GetByExamIdAsync(string examId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "examinationId = :examinationId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":examinationId"] = new AttributeValue { S = examId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToRegradingRequest).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegradingRequests for exam {ExamId}", examId);
            throw;
        }
    }

    public async Task<List<Models.RegradingRequest>> GetBySubmissionIdAsync(string submissionId)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "submissionId = :submissionId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":submissionId"] = new AttributeValue { S = submissionId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToRegradingRequest).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegradingRequests for submission {SubmissionId}", submissionId);
            throw;
        }
    }

    public async Task<List<Models.RegradingRequest>> GetByStatusAsync(Models.RegradingRequestStatus status)
    {
        try
        {
            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = "#status = :status",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#status"] = "status"
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":status"] = new AttributeValue { S = status.ToString() }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(request);
            return response.Items.Select(DynamoMapper.DynamoItemToRegradingRequest).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegradingRequests with status {Status}", status);
            throw;
        }
    }

    public async Task<PagedResult<Models.RegradingRequest>> GetAllPagedAsync(
        int pageIndex,
        int pageSize,
        string? studentId = null,
        string? examId = null,
        RegradingRequestStatus? status = null)
    {
        try
        {
            var filterExpressions = new List<string>();
            var expressionAttributeValues = new Dictionary<string, AttributeValue>();
            var expressionAttributeNames = new Dictionary<string, string>();

            if (!string.IsNullOrWhiteSpace(studentId))
            {
                filterExpressions.Add("studentId = :studentId");
                expressionAttributeValues[":studentId"] = new AttributeValue { S = studentId };
            }

            if (!string.IsNullOrWhiteSpace(examId))
            {
                filterExpressions.Add("examinationId = :examinationId");
                expressionAttributeValues[":examinationId"] = new AttributeValue { S = examId };
            }

            if (status.HasValue)
            {
                filterExpressions.Add("#status = :status");
                expressionAttributeNames["#status"] = "status";
                expressionAttributeValues[":status"] = new AttributeValue { S = status.Value.ToString() };
            }

            var request = new ScanRequest
            {
                TableName = _tableName,
                FilterExpression = filterExpressions.Count > 0
                    ? string.Join(" AND ", filterExpressions)
                    : null,
                ExpressionAttributeNames = expressionAttributeNames.Count > 0 ? expressionAttributeNames : null,
                ExpressionAttributeValues = expressionAttributeValues.Count > 0 ? expressionAttributeValues : null
            };

            var allItems = new List<Dictionary<string, AttributeValue>>();
            do
            {
                var response = await _dynamoDBClient.ScanAsync(request);
                allItems.AddRange(response.Items);
                request.ExclusiveStartKey = response.LastEvaluatedKey;
            }
            while (request.ExclusiveStartKey != null && request.ExclusiveStartKey.Count > 0);

            var allRequests = allItems.Select(DynamoMapper.DynamoItemToRegradingRequest).ToList();
            var totalCount = allRequests.Count;

            var pagedItems = allRequests
                .OrderByDescending(r => r.CreatedDate)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<Models.RegradingRequest>(pagedItems, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving paged RegradingRequests");
            throw;
        }
    }

    public async Task<Models.RegradingRequest?> ApproveAsync(string id, string lecturerNote)
    {
        try
        {
            var request = await GetByIdAsync(id);
            if (request == null)
                return null;

            request.Status = RegradingRequestStatus.APPROVED;
            request.LecturerNote = lecturerNote;
            request.HandledDate = DateTime.UtcNow;

            return await UpdateAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<Models.RegradingRequest?> RejectAsync(string id, string lecturerNote)
    {
        try
        {
            var request = await GetByIdAsync(id);
            if (request == null)
                return null;

            request.Status = RegradingRequestStatus.REJECTED;
            request.LecturerNote = lecturerNote;
            request.HandledDate = DateTime.UtcNow;

            return await UpdateAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting RegradingRequest {Id}", id);
            throw;
        }
    }

    public async Task<Models.RegradingRequest?> CancelAsync(string id)
    {
        try
        {
            var request = await GetByIdAsync(id);
            if (request == null)
                return null;

            request.Status = RegradingRequestStatus.CANCELED;
            request.HandledDate = DateTime.UtcNow;

            return await UpdateAsync(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling RegradingRequest {Id}", id);
            throw;
        }
    }
}
