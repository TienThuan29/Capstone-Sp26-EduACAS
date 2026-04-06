using System.Globalization;

namespace AcasService.Repositories.DynamoDb;

/// <summary>
/// Centralises DynamoDB DateTime round-trip handling. All DateTime values are stored
/// as UTC ISO strings and must be read/written consistently so that the server's local
/// timezone does not corrupt the data.
///
/// RULES:
///   - WRITING: Always call ToUtcString() on a DateTime before storing in DynamoDB.
///   - READING: Always call FromUtcString() when retrieving from DynamoDB.
/// </summary>
public static class DynamoDbDateTime
{
    /// <summary>
    /// Converts a DateTime to a UTC ISO string suitable for DynamoDB storage.
    /// Handles Unspecified Kind (e.g. from JSON deserialization) by treating it as UTC.
    /// </summary>
    public static string ToUtcString(DateTime dt)
    {
        var utc = dt.Kind switch
        {
            DateTimeKind.Utc    => dt,
            DateTimeKind.Local  => dt.ToUniversalTime(),
            _                   => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };
        return utc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
    }

    /// <summary>
    /// Parses a UTC ISO datetime string from DynamoDB and returns it as UTC.
    /// Uses AssumeUniversal so that "2026-04-05T09:01:00.000Z" is correctly interpreted
    /// as UTC 09:01 (not as server-local time).
    /// </summary>
    public static DateTime FromUtcString(string s)
    {
        return DateTime.Parse(s, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    }
}
