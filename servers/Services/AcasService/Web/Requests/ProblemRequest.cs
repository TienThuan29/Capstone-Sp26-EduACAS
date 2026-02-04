using System.ComponentModel.DataAnnotations;
using AcasService.Models;

namespace AcasService.Web.Requests;

public class CreateProblemRequest
{
    [Required(ErrorMessage = "LecturerId is required")]
    [StringLength(100, ErrorMessage = "LecturerId cannot exceed 100 characters")]
    public string LecturerId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Title is required")]
    [StringLength(500, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 500 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Content is required")]
    [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
    public string Content { get; set; } = string.Empty;

    [StringLength(255, MinimumLength = 1, ErrorMessage = "FileName must be between 1 and 255 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_\-\.]+$", ErrorMessage = "FileName can only contain letters, numbers, underscores, hyphens, and dots")]
    public string FileName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Difficulty is required")]
    [RegularExpression("^(EASY|MEDIUM|HARD)$", ErrorMessage = "Difficulty must be EASY, MEDIUM, or HARD")]
    public string Difficulty { get; set; } = string.Empty;

    [StringLength(10000, ErrorMessage = "CodeTemplate cannot exceed 10000 characters")]
    public string CodeTemplate { get; set; } = string.Empty;

    public List<CreateTestCaseRequest>? TestCases { get; set; }
}

public class UpdateProblemRequest
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(500, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 500 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Content is required")]
    [StringLength(50000, MinimumLength = 10, ErrorMessage = "Content must be between 10 and 50000 characters")]
    public string Content { get; set; } = string.Empty;

    [StringLength(255, MinimumLength = 1, ErrorMessage = "FileName must be between 1 and 255 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_\-\.]+$", ErrorMessage = "FileName can only contain letters, numbers, underscores, hyphens, and dots")]
    public string FileName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Difficulty is required")]
    [RegularExpression("^(EASY|MEDIUM|HARD)$", ErrorMessage = "Difficulty must be EASY, MEDIUM, or HARD")]
    public string Difficulty { get; set; } = string.Empty;

    public string CodeTemplate { get; set; } = string.Empty;

    public List<CreateTestCaseRequest>? TestCases { get; set; }
}

public class CreateTestCaseRequest
{
    public string InputData { get; set; } = string.Empty;

    [Required(ErrorMessage = "ExpectedOutput is required")]
    [StringLength(10000, ErrorMessage = "ExpectedOutput cannot exceed 10000 characters")]
    public string ExpectedOutput { get; set; } = string.Empty;

    [Required(ErrorMessage = "IsPublic is required")]
    public bool IsPublic { get; set; } = true;

    [Required(ErrorMessage = "IsCaseInsensitive is required")]
    public bool IsCaseInsensitive { get; set; } = false;

    [Required(ErrorMessage = "IsRemovedSpace is required")]
    public bool IsRemovedSpace { get; set; } = false;
}

public class UpdateTestCaseRequest
{
    public string InputData { get; set; } = string.Empty;

    [Required(ErrorMessage = "ExpectedOutput is required")]
    [StringLength(10000, ErrorMessage = "ExpectedOutput cannot exceed 10000 characters")]
    public string ExpectedOutput { get; set; } = string.Empty;

    [Required(ErrorMessage = "IsPublic is required")]
    public bool IsPublic { get; set; } = true;

    [Required(ErrorMessage = "IsCaseInsensitive is required")]
    public bool IsCaseInsensitive { get; set; } = false;

    [Required(ErrorMessage = "IsRemovedSpace is required")]
    public bool IsRemovedSpace { get; set; } = false;
}
