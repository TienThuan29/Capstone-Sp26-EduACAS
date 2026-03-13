namespace AcasService.Dev;

public interface IDynamoDbResetService
{
    /// <summary>
    /// Wipes all discovered DynamoDB tables and re-seeds them with realistic mock data.
    /// Only safe to call in Development environment.
    /// </summary>
    Task<ResetResult> ResetAndSeedAsync(CancellationToken cancellationToken = default);
}

public record ResetResult(bool Success, int TablesWiped, int ItemsSeeded, string? ErrorMessage = null);
