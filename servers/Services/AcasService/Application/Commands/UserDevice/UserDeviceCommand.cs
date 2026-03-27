using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.UserDevice;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.UserDevice;

public interface IUserDeviceCommand
{
    Task<UserDeviceTokenResponse> RegisterAsync(string userId, RegisterUserDeviceRequest request);
}

public class UserDeviceCommand : IUserDeviceCommand
{
    private readonly IUserDeviceRepository _userDeviceRepository;

    public UserDeviceCommand(IUserDeviceRepository userDeviceRepository)
    {
        _userDeviceRepository = userDeviceRepository;
    }

    public async Task<UserDeviceTokenResponse> RegisterAsync(string userId, RegisterUserDeviceRequest request)
    {
        var platform = request.Platform.Trim().ToUpperInvariant();
        if (platform != "ANDROID" && platform != "IOS" && platform != "WEB")
        {
            throw new InvalidOperationException("Invalid device platform");
        }

        var registered = await _userDeviceRepository.RegisterOrUpdateAsync(
            userId,
            request.DeviceToken.Trim(),
            platform,
            string.IsNullOrWhiteSpace(request.DeviceId) ? null : request.DeviceId.Trim(),
            string.IsNullOrWhiteSpace(request.AppVersion) ? null : request.AppVersion.Trim()
        );

        if (registered == null)
        {
            throw new InvalidOperationException("Failed to register user device token");
        }

        return new UserDeviceTokenResponse
        {
            Id = registered.Id,
            UserId = registered.UserId,
            DeviceToken = registered.DeviceToken,
            Platform = registered.Platform,
            DeviceId = registered.DeviceId,
            AppVersion = registered.AppVersion,
            IsActive = registered.IsActive,
            LastSeenAt = registered.LastSeenAt,
            CreatedDate = registered.CreatedDate,
            UpdatedDate = registered.UpdatedDate
        };
    }
}
