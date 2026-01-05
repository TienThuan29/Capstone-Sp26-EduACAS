using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AuthService.Models;
using AuthService.Application.Utils;
using System.Net;
using AuthService.Repositories.DynamoDB;

namespace AuthService.Repositories.User;

public class UserRepository : DynamoRepository, IUserRepository
{
    private readonly string _userTableName;
    private readonly IConfiguration _configuration;

    public UserRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<UserRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _configuration = configuration;
        _userTableName = configuration["DynamoDB:UserTable"] ??
                         throw new ArgumentNullException("DynamoDB:UserTable is not configured");
        base.TableName = _userTableName;
        var awsRegion = configuration["AWS:Region"] ?? "Not configured";
        logger.LogInformation("UserRepository initialized - Region: {Region}, Table: {Table}", awsRegion, _userTableName);
    }

    public async Task<Models.User?> CreateAsync(Models.User user)
    {
        try
        {
            user.Id = Guid.NewGuid().ToString();
            user.Password = HashingUtil.HashString(user.Password, _configuration);
            user.IsEnable = true;
            user.CreatedDate = DateTime.UtcNow;
            user.UpdatedDate = DateTime.UtcNow;
            // map and save user
            var dynamoItem = DynamoMapper.UserToDynamoItem(user);
            var response = await PutItemAsync(dynamoItem, _userTableName);

            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await FindByIdAsync(user.Id);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            throw;
        }
    }

    public async Task<Models.User?> FindByIdAsync(string userId)
    {
        try
        {
            var key = DynamoMapper.CreateKey(userId);
            var response = await GetItemAsync(key, _userTableName);

            if (response.Item.Count == 0)
            {
                return null;
            }

            return DynamoMapper.DynamoItemToUser(response.Item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding user by ID: {UserId}", userId);
            throw;
        }
    }

    public async Task<Models.User?> FindByEmailAsync(string email)
    {
        try
        {
            // Log DynamoDB operation details
            var region = _configuration["AWS:Region"] ?? "Unknown";
            var regionEndpoint = _dynamoDBClient.Config.RegionEndpoint?.SystemName ?? "Unknown";
            _logger.LogInformation("Finding user by email - Region: {Region} ({RegionEndpoint}), Table: {Table}, Email: {Email}",
                region, regionEndpoint, _userTableName, email);

            var scanRequest = new ScanRequest
            {
                TableName = _userTableName,
                FilterExpression = "email = :email",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":email"] = new AttributeValue { S = email }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);

            if (response.Items.Count == 0)
            {
                return null;
            }

            return DynamoMapper.DynamoItemToUser(response.Items[0]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding user by email: {Email}", email);
            throw;
        }
    }

    public async Task<List<Models.User>> FindAllAsync()
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userTableName
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);

            return response.Items.Select(item => DynamoMapper.DynamoItemToUser(item)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding all users");
            throw;
        }
    }
}
