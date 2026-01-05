using AuthService.Repositories.Redis;
using StackExchange.Redis;

namespace AuthService.Repositories.User;

/// <summary>
/// Caching user model with opt for register function
/// </summary>
public interface IUserOptCacheRepository
{
    Task<bool> SaveAsync(string id, UserWithOpt value, TimeSpan? ttl = null);
    Task<UserWithOpt?> GetAsync(string id);
    Task<bool> DeleteAsync(string id);
    Task<bool> UpdateAsync(string id, Func<UserWithOpt, UserWithOpt> update, TimeSpan? ttl = null);
}

public class UserOptCacheRepository : RedisRepository<UserWithOpt>, IUserOptCacheRepository
{
    public UserOptCacheRepository(
        IConnectionMultiplexer mux,
        ILogger<UserOptCacheRepository> logger
    ) : base(mux, logger) { }

    protected override string GetKey(string id) => $"user-opt:{id}";

}


/// <summary>
/// Caching user model
/// </summary>
public interface IUserCacheRepository
{
    Task<bool> SaveAsync(string id, Models.User value, TimeSpan? ttl = null);
    Task<Models.User?> GetAsync(string id);
    Task<bool> DeleteAsync(string id);
    Task<bool> UpdateAsync(string id, Func<Models.User, Models.User> update, TimeSpan? ttl = null);
}


public class UserCacheRepository : RedisRepository<Models.User>, IUserCacheRepository
{
    public UserCacheRepository(
        IConnectionMultiplexer mux,
        ILogger<UserCacheRepository> logger
    ) : base(mux, logger) { }

    protected override string GetKey(string id) => $"user:{id}";
}

public class UserWithOpt : Models.User
{
    public string Opt { get; set; } = string.Empty;
}