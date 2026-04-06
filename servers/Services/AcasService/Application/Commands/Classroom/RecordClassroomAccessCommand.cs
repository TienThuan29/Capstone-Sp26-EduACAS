using StackExchange.Redis;

namespace AcasService.Application.Commands.Classroom;

/// <summary>
/// Persists a user's classroom view in Redis using a sorted set (score = UTC Unix seconds).
/// </summary>
public interface IRecordClassroomAccessCommand
{
    /// <summary>
    /// Records that <paramref name="userId"/> opened <paramref name="classroomId"/> and trims the set to the 10 most recent views.
    /// </summary>
    Task RecordAccessAsync(string userId, string classroomId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Redis-backed command: ZADD with UTC Unix timestamp score, then ZREMRANGEBYRANK to retain only the top 10 entries.
/// </summary>
public class RecordClassroomAccessCommand : IRecordClassroomAccessCommand
{
    private const string KeyPrefix = "recently_viewed:classrooms:";
    private const int MaxRecentEntries = 10;

    private readonly IDatabase _db;

    public RecordClassroomAccessCommand(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    /// <inheritdoc />
    public async Task RecordAccessAsync(string userId, string classroomId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(classroomId))
            return;

        var key = KeyPrefix + userId;
        var score = (double)DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        await _db.SortedSetAddAsync(key, classroomId, score);

        var count = await _db.SortedSetLengthAsync(key);
        if (count <= MaxRecentEntries)
            return;

        // Ascending rank: 0 = lowest score (oldest). Remove excess oldest so only MaxRecentEntries remain.
        var removeThrough = count - MaxRecentEntries - 1;
        await _db.SortedSetRemoveRangeByRankAsync(key, 0, removeThrough);
    }
}
