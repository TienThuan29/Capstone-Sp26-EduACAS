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

    public async Task<Models.User?> FindByGoogleIdAsync(string googleId)
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userTableName,
                FilterExpression = "googleId = :googleId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":googleId"] = new AttributeValue { S = googleId }
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
            _logger.LogError(ex, "Error finding user by Google ID: {GoogleId}", googleId);
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

    public async Task<Models.User?> UpdatePasswordAsync(Models.User user)
    {
        try
        {
            var hashedPassword = HashingUtil.HashString(user.Password, _configuration);
            var updatedDate = DateTime.UtcNow;
            
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                ["password"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = hashedPassword }
                },
                ["updatedDate"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = updatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                }
            };
            
            var response = await UpdateItemAsync(
                DynamoMapper.CreateKey(user.Id), updates, _userTableName);
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await FindByIdAsync(user.Id);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user password");
            throw;
        }
    }

    public async Task<Models.User?> UpdateGoogleIdAsync(string userId, string googleId)
    {
        try
        {
            var updatedDate = DateTime.UtcNow;
            
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                ["googleId"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = googleId }
                },
                ["updatedDate"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = updatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                }
            };
            
            var response = await UpdateItemAsync(
                DynamoMapper.CreateKey(userId), updates, _userTableName);
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await FindByIdAsync(userId);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user Google ID");
            throw;
        }
    }

    public async Task<Models.User?> UpdatePasswordAndFirstLoginAsync(string userId, string newPassword, bool firstLogin)
    {
        try
        {
            var hashedPassword = HashingUtil.HashString(newPassword, _configuration);
            var updatedDate = DateTime.UtcNow;
            
            var updates = new Dictionary<string, AttributeValueUpdate>
            {
                ["password"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = hashedPassword }
                },
                ["firstLogin"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { BOOL = firstLogin }
                },
                ["updatedDate"] = new AttributeValueUpdate
                {
                    Action = AttributeAction.PUT,
                    Value = new AttributeValue { S = updatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                }
            };
            
            var response = await UpdateItemAsync(
                DynamoMapper.CreateKey(userId), updates, _userTableName);
            if (response.HttpStatusCode == HttpStatusCode.OK)
            {
                return await FindByIdAsync(userId);
            }
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user password and FirstLogin flag");
            throw;
        }
    }
}