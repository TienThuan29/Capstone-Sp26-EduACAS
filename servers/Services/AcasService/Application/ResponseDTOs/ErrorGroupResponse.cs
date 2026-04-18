using System.Text.Json.Serialization;

namespace AcasService.Application.ResponseDTOs;

/// <summary>
/// Trả về thông tin tổng quan của nhóm lỗi (không bao gồm chi tiết từng dòng code trùng lặp để giảm băng thông)
/// </summary>
public class ErrorGroupSummaryResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("examId")]
    public string ExamId { get; set; } = string.Empty;

    [JsonPropertyName("errorSignature")]
    public string ErrorSignature { get; set; } = string.Empty;

    [JsonPropertyName("jPlagStatus")]
    public string JPlagStatus { get; set; } = string.Empty;

    [JsonPropertyName("submissionIds")]
    public List<string> SubmissionIds { get; set; } = new();

    [JsonPropertyName("jPlagResults")]
    public List<JPlagMatchSummaryResponse> JPlagResults { get; set; } = new();

    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
}

public class JPlagMatchSummaryResponse
{
    [JsonPropertyName("submission1Id")]
    public string Submission1Id { get; set; } = string.Empty;

    [JsonPropertyName("submission2Id")]
    public string Submission2Id { get; set; } = string.Empty;

    [JsonPropertyName("similarityScore")]
    public float SimilarityScore { get; set; }
}

/// <summary>
/// Trả về chi tiết các đoạn code trùng lặp của một nhóm lỗi cụ thể
/// </summary>
public class ErrorGroupDetailResponse : ErrorGroupSummaryResponse
{
    [JsonPropertyName("jPlagResultsDetailed")]
    public new List<JPlagMatchDetailGroupResponse> JPlagResults { get; set; } = new();
}

public class JPlagMatchDetailGroupResponse : JPlagMatchSummaryResponse
{
    [JsonPropertyName("details")]
    public List<MatchLineDetailResponse> Details { get; set; } = new();
}

public class MatchLineDetailResponse
{
    [JsonPropertyName("startLine1")]
    public int StartLine1 { get; set; }

    [JsonPropertyName("endLine1")]
    public int EndLine1 { get; set; }

    [JsonPropertyName("startLine2")]
    public int StartLine2 { get; set; }

    [JsonPropertyName("endLine2")]
    public int EndLine2 { get; set; }

    [JsonPropertyName("tokens")]
    public int Tokens { get; set; }
}
