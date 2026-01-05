namespace AuthService.Repositories.User;

public interface IUserRepository
{
    Task<Models.User?> CreateAsync(Models.User user);
    Task<Models.User?> FindByIdAsync(string userId);
    Task<Models.User?> FindByEmailAsync(string email);

    Task<Models.User?> UpdatePasswordAsync(Models.User user);
    
}