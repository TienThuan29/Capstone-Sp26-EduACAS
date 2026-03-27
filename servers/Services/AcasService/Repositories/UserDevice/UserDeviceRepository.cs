using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AcasService.Repositories.DynamoDb;
using System.Net;

namespace AcasService.Repositories.UserDevice;

public class UserDeviceRepository : DynamoRepository, IUserDeviceRepository
{
    private readonly string _userDeviceTableName;

    public UserDeviceRepository(
        IAmazonDynamoDB dynamoDbClient,
        IConfiguration configuration,
        ILogger<UserDeviceRepository> logger
    ) : base(dynamoDbClient, logger)
    {
        _userDeviceTableName = configuration["DynamoDB:UserDeviceTableName"] ??
                               throw new ArgumentNullException("DynamoDB:UserDeviceTableName is not configured");
        base.TableName = _userDeviceTableName;
    }

    public async Task<List<Models.UserDevice>> FindActiveByUserIdAsync(string userId)
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userDeviceTableName,
                FilterExpression = "userId = :userId AND isActive = :isActive",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":userId"] = new AttributeValue { S = userId },
                    [":isActive"] = new AttributeValue { BOOL = true }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);
            return response.Items.Select(DynamoMapper.DynamoItemToUserDevice).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding active devices for user {UserId}", userId);
            throw;
        }
    }

    public async Task<Models.UserDevice?> RegisterOrUpdateAsync(
        string userId,
        string deviceToken,
        string platform,
        string? deviceId,
        string? appVersion
    )
    {
        try
        {
            var now = DateTime.UtcNow;
            var sameTokenRecords = await FindByTokenAsync(deviceToken);

            var recordToRebind = sameTokenRecords.FirstOrDefault(x =>
                    string.Equals(x.UserId, userId, StringComparison.Ordinal) && x.IsActive)
                ?? sameTokenRecords.FirstOrDefault(x =>
                    string.Equals(x.UserId, userId, StringComparison.Ordinal))
                ?? sameTokenRecords.FirstOrDefault();

            if (recordToRebind != null)
            {
                var updates = new Dictionary<string, AttributeValueUpdate>
                {
                    ["userId"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = userId }
                    },
                    ["deviceToken"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = deviceToken }
                    },
                    ["platform"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = platform }
                    },
                    ["isActive"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { BOOL = true }
                    },
                    ["lastSeenAt"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                    },
                    ["updatedDate"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                    }
                };

                if (!string.IsNullOrWhiteSpace(deviceId))
                {
                    updates["deviceId"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = deviceId }
                    };
                }

                if (!string.IsNullOrWhiteSpace(appVersion))
                {
                    updates["appVersion"] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue { S = appVersion }
                    };
                }

                var updateResponse = await UpdateItemAsync(
                    DynamoMapper.CreateKey(recordToRebind.Id),
                    updates,
                    _userDeviceTableName
                );

                if (updateResponse.HttpStatusCode == HttpStatusCode.OK)
                {
                    recordToRebind.UserId = userId;
                    recordToRebind.DeviceToken = deviceToken;
                    recordToRebind.Platform = platform;
                    recordToRebind.IsActive = true;
                    recordToRebind.LastSeenAt = now;
                    recordToRebind.UpdatedDate = now;

                    if (!string.IsNullOrWhiteSpace(deviceId))
                    {
                        recordToRebind.DeviceId = deviceId;
                    }

                    if (!string.IsNullOrWhiteSpace(appVersion))
                    {
                        recordToRebind.AppVersion = appVersion;
                    }

                    var duplicateRecords = sameTokenRecords
                        .Where(x => !string.Equals(x.Id, recordToRebind.Id, StringComparison.Ordinal) && x.IsActive)
                        .ToList();

                    foreach (var duplicateRecord in duplicateRecords)
                    {
                        var deactivateUpdates = new Dictionary<string, AttributeValueUpdate>
                        {
                            ["isActive"] = new AttributeValueUpdate
                            {
                                Action = AttributeAction.PUT,
                                Value = new AttributeValue { BOOL = false }
                            },
                            ["updatedDate"] = new AttributeValueUpdate
                            {
                                Action = AttributeAction.PUT,
                                Value = new AttributeValue { S = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                            }
                        };

                        await UpdateItemAsync(
                            DynamoMapper.CreateKey(duplicateRecord.Id),
                            deactivateUpdates,
                            _userDeviceTableName
                        );
                    }

                    return recordToRebind;
                }

                return null;
            }

            var userDevice = new Models.UserDevice
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                DeviceToken = deviceToken,
                Platform = platform,
                DeviceId = deviceId?.Trim() ?? string.Empty,
                AppVersion = appVersion?.Trim() ?? string.Empty,
                IsActive = true,
                LastSeenAt = now,
                CreatedDate = now,
                UpdatedDate = now
            };

            var item = DynamoMapper.UserDeviceToDynamoItem(userDevice);
            var putResponse = await PutItemAsync(item, _userDeviceTableName);

            if (putResponse.HttpStatusCode == HttpStatusCode.OK)
            {
                return userDevice;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering/updating user device for {UserId}", userId);
            throw;
        }
    }

    public async Task<Models.UserDevice?> FindByUserAndTokenAsync(string userId, string deviceToken)
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userDeviceTableName,
                FilterExpression = "userId = :userId AND deviceToken = :deviceToken",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":userId"] = new AttributeValue { S = userId },
                    [":deviceToken"] = new AttributeValue { S = deviceToken }
                },
                Limit = 1
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);
            if (response.Items.Count == 0)
            {
                return null;
            }

            return DynamoMapper.DynamoItemToUserDevice(response.Items[0]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding device by user/token");
            throw;
        }
    }

    public async Task<List<Models.UserDevice>> FindByTokenAsync(string deviceToken)
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userDeviceTableName,
                FilterExpression = "deviceToken = :deviceToken",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":deviceToken"] = new AttributeValue { S = deviceToken }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);
            return response.Items.Select(DynamoMapper.DynamoItemToUserDevice).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding devices by token");
            throw;
        }
    }

    public async Task<List<Models.UserDevice>> FindByDeviceIdAsync(string deviceId)
    {
        try
        {
            var scanRequest = new ScanRequest
            {
                TableName = _userDeviceTableName,
                FilterExpression = "deviceId = :deviceId",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":deviceId"] = new AttributeValue { S = deviceId }
                }
            };

            var response = await _dynamoDBClient.ScanAsync(scanRequest);
            return response.Items.Select(DynamoMapper.DynamoItemToUserDevice).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding devices by deviceId");
            throw;
        }
    }
}
