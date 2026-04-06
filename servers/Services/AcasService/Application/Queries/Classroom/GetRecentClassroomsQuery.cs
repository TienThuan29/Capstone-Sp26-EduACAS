using StackExchange.Redis;

namespace AcasService.Application.Queries.Classroom;

/// <summary>
/// Reads recently viewed classroom identifiers from Redis (sorted set, highest score first).
/// </summary>
public interface IGetRecentClassroomsQuery
{
    /// <summary>
    /// Returns up to <paramref name="limit"/> classroom IDs, most recently viewed first.
    /// </summary>
    Task<IReadOnlyList<string>> GetRecentClassroomIdsAsync(string userId, int limit = 5, CancellationToken cancellationToken = default);
}

/// <summary>
/// Redis-backed query: ZREVRANGE for the highest-scored (most recent) members.
/// </summary>
public class GetRecentClassroomsQuery : IGetRecentClassroomsQuery
{
    private const string KeyPrefix = "recently_viewed:classrooms:";

    private readonly IDatabase _db;

    public GetRecentClassroomsQuery(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetRecentClassroomIdsAsync(
        string userId,
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId) || limit <= 0)
            return Array.Empty<string>();

        var key = KeyPrefix + userId;
        var values = await _db.SortedSetRangeByRankAsync(key, 0, limit - 1, Order.Descending);
        return values.Select(v => v.ToString()).Where(s => !string.IsNullOrEmpty(s)).ToList();
    }
}
