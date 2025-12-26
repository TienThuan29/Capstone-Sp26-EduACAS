using System.Text.Json;
using StackExchange.Redis;

namespace AuthService.Repositories.Redis;

public abstract class RedisRepository<T> where T : class
{
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    protected readonly IDatabase Db;

    protected readonly ILogger _logger;

    protected RedisRepository(IConnectionMultiplexer multiplexer, ILogger logger)
    {
        Db = multiplexer.GetDatabase();
        _logger = logger;
    }

    protected abstract string GetKey(string id);

    public async Task<bool> SaveAsync(string id, T value, TimeSpan? ttl = null) =>
        await Db.StringSetAsync(GetKey(id), JsonSerializer.Serialize(value, _jsonOptions), ttl);

    public async Task<T?> GetAsync(string id)
    {
        var data = await Db.StringGetAsync(GetKey(id));
        return data.IsNullOrEmpty ? null : JsonSerializer.Deserialize<T>(data!, _jsonOptions);
    }

    public async Task<bool> DeleteAsync(string id) => await Db.KeyDeleteAsync(GetKey(id));

    public async Task<bool> UpdateAsync(string id, Func<T, T> update, TimeSpan? ttl = null)
    {
        var existing = await GetAsync(id);
        if (existing is null) return false;
        var updated = update(existing);
        return await SaveAsync(id, updated, ttl);   
    }
}