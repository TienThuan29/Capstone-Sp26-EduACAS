using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

public class AdminDiscussionStatisticsResponse
{
    [JsonPropertyName("totalDiscussions")]
    public int TotalDiscussions { get; set; }

    [JsonPropertyName("activeDiscussions")]
    public int ActiveDiscussions { get; set; }

    [JsonPropertyName("closedDiscussions")]
    public int ClosedDiscussions { get; set; }

    [JsonPropertyName("totalComments")]
    public int TotalComments { get; set; }

    [JsonPropertyName("totalViews")]
    public int TotalViews { get; set; }

    [JsonPropertyName("discussionsByClassroom")]
    public List<ClassroomDiscussionItem> DiscussionsByClassroom { get; set; } = new();
}

public class ClassroomDiscussionItem
{
    [JsonPropertyName("classroomId")]
    public string ClassroomId { get; set; } = string.Empty;

    [JsonPropertyName("classroomName")]
    public string ClassroomName { get; set; } = string.Empty;

    [JsonPropertyName("totalDiscussions")]
    public int TotalDiscussions { get; set; }

    [JsonPropertyName("activeDiscussions")]
    public int ActiveDiscussions { get; set; }

    [JsonPropertyName("closedDiscussions")]
    public int ClosedDiscussions { get; set; }

    [JsonPropertyName("totalComments")]
    public int TotalComments { get; set; }
}
