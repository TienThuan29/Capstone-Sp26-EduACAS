using AcasService.Models;

namespace AcasService.Application.ResponseDTOs;

public class ProblemResponseDTO
{
    public string Id { get; set; } = string.Empty;
    public string ExamId { get; set; } = string.Empty;
    public string LecturerId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public float Mark { get; set; }
    public Difficulty Difficulty { get; set; }
    public string CodeTemplate { get; set; } = string.Empty;
    public List<TestCaseResponseDTO> TestCases { get; set; } = new List<TestCaseResponseDTO>();
    public DateTime CreatedDate { get; set; }
    public DateTime UpdatedDate { get; set; }
}

public class TestCaseResponseDTO
{
    public string Id { get; set; } = string.Empty;
    public string InputData { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public bool IsCaseInsensitive { get; set; }
    public bool IsRemovedSpace { get; set; }
}

public class ProblemBasicDTO
{
    public string Id { get; set; } = string.Empty;
    public string ExamId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public float Mark { get; set; }
    public Difficulty Difficulty { get; set; }
    public DateTime CreatedDate { get; set; }
}
