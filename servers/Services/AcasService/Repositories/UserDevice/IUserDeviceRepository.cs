namespace AcasService.Repositories.UserDevice;

public interface IUserDeviceRepository
{
    Task<Models.UserDevice?> RegisterOrUpdateAsync(
        string userId,
        string deviceToken,
        string platform,
        string? deviceId,
        string? appVersion
    );

    Task<Models.UserDevice?> FindByUserAndTokenAsync(string userId, string deviceToken);

    Task<List<Models.UserDevice>> FindByTokenAsync(string deviceToken);

    Task<List<Models.UserDevice>> FindByDeviceIdAsync(string deviceId);

    Task<List<Models.UserDevice>> FindActiveByUserIdAsync(string userId);
}
