using AuthService.Repositories.Redis;
using StackExchange.Redis;

namespace AuthService.Repositories.User;

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

public class UserWithOpt : Models.User
{
    public string Opt { get; set; } = string.Empty;
}