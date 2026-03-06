namespace AcasService.Dev;

/// <summary>
/// Marks a model class as a root DynamoDB entity with its own table.
/// Used by the DbReset/seed service to discover tables via reflection (config key for table name).
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class DynamoDBEntityAttribute : Attribute
{
    /// <summary>
    /// Configuration key under "DynamoDB" section (e.g. "SubmissionTableName").
    /// Actual table name is read from IConfiguration["DynamoDB:" + ConfigKey].
    /// </summary>
    public string ConfigKey { get; }

    public DynamoDBEntityAttribute(string configKey)
    {
        ConfigKey = configKey ?? throw new ArgumentNullException(nameof(configKey));
    }
}
