using System.Text.Json;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace AcasService.Application.Commands.Notification;

public interface IFirebaseCloudMessageService
{
    Task<FcmDispatchResult> SendAsync(Models.Notification notification, IReadOnlyCollection<string> deviceTokens);
}

public sealed class FcmDispatchResult
{
    public int TotalTokens { get; init; }
    public int SuccessCount { get; init; }
    public int FailureCount { get; init; }
}

public class FirebaseCloudMessageService : IFirebaseCloudMessageService
{
    private readonly ILogger<FirebaseCloudMessageService> _logger;

    public FirebaseCloudMessageService(IConfiguration configuration, IWebHostEnvironment environment, ILogger<FirebaseCloudMessageService> logger)
    {
        _logger = logger;

        if (FirebaseApp.DefaultInstance != null)
            return;

        var configuredPath = configuration["Firebase:ServiceAccountFile"];
        if (string.IsNullOrWhiteSpace(configuredPath))
            throw new InvalidOperationException("Firebase:ServiceAccountFile is not configured");

        var credentialPath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);

        if (!File.Exists(credentialPath))
            throw new FileNotFoundException($"Firebase service account file not found at {credentialPath}");

        FirebaseApp.Create(new AppOptions
        {
            Credential = GoogleCredential.FromFile(credentialPath)
        });

        _logger.LogInformation("Firebase Admin SDK initialized from {Path}", credentialPath);
    }

    public async Task<FcmDispatchResult> SendAsync(Models.Notification notification, IReadOnlyCollection<string> deviceTokens)
    {
        if (deviceTokens.Count == 0)
        {
            return new FcmDispatchResult
            {
                TotalTokens = 0,
                SuccessCount = 0,
                FailureCount = 0
            };
        }

        var data = new Dictionary<string, string>
        {
            ["notificationId"] = notification.Id,
            ["type"] = notification.Type.ToString(),
            ["targetUserId"] = notification.TargetUserId,
            ["sentDate"] = notification.SentDate.ToString("O")
        };

        if (notification.Payload != null)
        {
            foreach (var kv in notification.Payload)
            {
                if (string.IsNullOrWhiteSpace(kv.Key) || kv.Value == null)
                    continue;

                data[kv.Key] = JsonSerializer.Serialize(kv.Value);
            }
        }

        var tokenList = deviceTokens.ToList();
        var successCount = 0;
        var failureCount = 0;

        foreach (var chunk in tokenList.Chunk(500))
        {
            var message = new MulticastMessage
            {
                Tokens = chunk.ToList(),
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = notification.Title,
                    Body = notification.Body
                },
                Data = data,
                Android = new AndroidConfig
                {
                    Priority = Priority.High,
                    Notification = new AndroidNotification
                    {
                        ChannelId = "acas_default_channel"
                    }
                }
            };

            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
            successCount += response.SuccessCount;
            failureCount += response.FailureCount;
        }

        return new FcmDispatchResult
        {
            TotalTokens = deviceTokens.Count,
            SuccessCount = successCount,
            FailureCount = failureCount
        };
    }
}
