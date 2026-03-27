using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.UserDevice;
using AcasService.Web.Requests;

namespace AcasService.Application.Queries.UserDevice;

public interface IUserDeviceQuery
{
    Task<UserDeviceTokenCheckResponse> CheckAsync(string userId, CheckUserDeviceTokenRequest request);
}

public class UserDeviceQuery : IUserDeviceQuery
{
    private readonly IUserDeviceRepository _userDeviceRepository;

    public UserDeviceQuery(IUserDeviceRepository userDeviceRepository)
    {
        _userDeviceRepository = userDeviceRepository;
    }

    public async Task<UserDeviceTokenCheckResponse> CheckAsync(string userId, CheckUserDeviceTokenRequest request)
    {
        var normalizedToken = request.DeviceToken.Trim();
        var normalizedDeviceId = request.DeviceId?.Trim() ?? string.Empty;

        var sameTokenRecords = await _userDeviceRepository.FindByTokenAsync(normalizedToken);

        var isRegisteredForCurrentUser = sameTokenRecords.Any(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal));

        var otherUserIdsUsingSameToken = sameTokenRecords
            .Where(x => !string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Select(x => x.UserId)
            .Distinct()
            .ToList();

        var otherUserIdsUsingSameDevice = new List<string>();
        if (!string.IsNullOrWhiteSpace(normalizedDeviceId))
        {
            var sameDeviceRecords = await _userDeviceRepository.FindByDeviceIdAsync(normalizedDeviceId);
            otherUserIdsUsingSameDevice = sameDeviceRecords
                .Where(x => !string.Equals(x.UserId, userId, StringComparison.Ordinal))
                .Select(x => x.UserId)
                .Distinct()
                .ToList();
        }

        return new UserDeviceTokenCheckResponse
        {
            UserId = userId,
            DeviceToken = normalizedToken,
            DeviceId = normalizedDeviceId,
            IsRegisteredForCurrentUser = isRegisteredForCurrentUser,
            IsTokenUsedByAnotherUser = otherUserIdsUsingSameToken.Count > 0,
            IsDeviceUsedByAnotherUser = otherUserIdsUsingSameDevice.Count > 0,
            OtherUserIdsUsingSameToken = otherUserIdsUsingSameToken,
            OtherUserIdsUsingSameDevice = otherUserIdsUsingSameDevice
        };
    }
}
