using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using AcasService.Dev;

namespace AcasService.Models;

public class KeystrokeRecord
{
    public string TimeStartSet { get; set; } = string.Empty;

    public string TimeOffSet { get; set; } = string.Empty;

    public double Duration { get; set; }

    public double Cps { get; set; }

    public int CharCount { get; set; }

    public string Content { get; set; } = string.Empty;
}

[DynamoDBEntity("KeystrokeLogsTableName")]
public class KeystrokeLog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string SubmissionId { get; set; } = string.Empty;

    [JsonPropertyName("keystroke_data")]
    public List<KeystrokeRecord> KeystrokeData { get; set; } = new List<KeystrokeRecord>();

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}
