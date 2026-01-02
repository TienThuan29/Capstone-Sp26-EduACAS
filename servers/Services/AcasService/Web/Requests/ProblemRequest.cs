using AcasService.Models;

namespace AcasService.Web.Requests;

public class CreateProblemRequest
{
    public string ExamId { get; set; } = string.Empty;
    public string LecturerId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public float Mark { get; set; }
    public Difficulty Difficulty { get; set; }
    public string CodeTemplate { get; set; } = string.Empty;
}

public class UpdateProblemRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public float Mark { get; set; }
    public Difficulty Difficulty { get; set; }
    public string CodeTemplate { get; set; } = string.Empty;
}

public class CreateTestCaseRequest
{
    public string InputData { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public bool IsCaseInsensitive { get; set; } = false;
    public bool IsRemovedSpace { get; set; } = false;
}

public class UpdateTestCaseRequest
{
    public string InputData { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public bool IsCaseInsensitive { get; set; } = false;
    public bool IsRemovedSpace { get; set; } = false;
}
