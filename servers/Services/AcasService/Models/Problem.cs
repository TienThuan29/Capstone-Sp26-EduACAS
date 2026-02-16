using System.ComponentModel.DataAnnotations;

namespace AcasService.Models;

public class Problem
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string LecturerId { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }// markdown content

    public string? FileName { get; set; }
    
    public List<TestCase> TestCases { get; set; } = new List<TestCase>();
    
    public Difficulty Difficulty { get; set; }
    
    // key: language id, value: code template
    public Dictionary<string, string>? CodeTemplates { get; set; } = new Dictionary<string, string>();

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }

    public bool IsDeleted { get; set; }
}


public class TestCase
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string ProblemId { get; set; } = string.Empty;

    [Required]
    public string InputData { get; set; } = string.Empty;

    [Required]
    public string ExpectedOutput { get; set; } = string.Empty;

    [Required]
    public bool IsPublic { get; set; }

    [Required]
    public bool IsCaseInsensitive { get; set; }

    public bool IsFloatingPoint { get; set; } = false;

    public double? FloatingPointTolerance { get; set; } = null;

    public int? DecimalPlaces { get; set; } = null; // default -1, not used

    public bool IsTokenComparision { get; set; } = false;

    public bool IsDeleted { get; set; }
}

public enum Difficulty
{
    EASY,
    MEDIUM,
    HARD
}