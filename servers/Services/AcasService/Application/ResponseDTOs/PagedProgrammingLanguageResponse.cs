using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class PagedProgrammingLanguageResponse
{
    [JsonPropertyName("items")]
    public List<ProgrammingLanguageResponse> Items { get; set; } = new();

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages { get; set; }
}
