namespace AuthService.Repositories.User;

public interface IUserRepository
{
    Task<Models.User?> CreateAsync(Models.User user);
    Task<Models.User?> FindByIdAsync(string userId);
    Task<List<Models.User>> FindByIdsAsync(IEnumerable<string> userIds);
    Task<Models.User?> FindByEmailAsync(string email);
    Task<Models.User?> FindByGoogleIdAsync(string googleId);
    Task<List<Models.User>> FindAllAsync();
    Task<(List<Models.User> items, int totalCount)> FindPagedAsync(int pageIndex, int pageSize, string? searchTerm = null, string? role = null, bool? isEnable = null);

    Task<Models.User?> UpdatePasswordAsync(Models.User user);
    Task<Models.User?> UpdatePasswordByIdAsync(string userId, string newPassword);
    Task<Models.User?> UpdateGoogleIdAsync(string userId, string googleId);
    Task<Models.User?> UpdatePasswordAndFirstLoginAsync(string userId, string newPassword, bool firstLogin);
    Task<Models.User?> UpdateUserAsync(string userId, string? fullname, string? roleNumber, Models.Role? role, bool? isEnable);

    Task<Models.User?> UpdateProfileAsync(string userId, string? fullname, DateTime? birthday, string? avatarUrl);
}