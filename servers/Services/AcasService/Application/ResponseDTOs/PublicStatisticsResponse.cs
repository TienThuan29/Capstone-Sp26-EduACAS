using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class PublicStatisticsResponse
{
    [JsonPropertyName("totalStudents")]
    public long TotalStudents { get; set; }

    [JsonPropertyName("totalLecturers")]
    public long TotalLecturers { get; set; }

    [JsonPropertyName("totalClassrooms")]
    public long TotalClassrooms { get; set; }

    [JsonPropertyName("totalProgrammingLanguages")]
    public long TotalProgrammingLanguages { get; set; }

    [JsonPropertyName("lastUpdatedAt")]
    public DateTime LastUpdatedAt { get; set; }
}
