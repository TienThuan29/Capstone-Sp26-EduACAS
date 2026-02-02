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

    [Required]
    public string Content { get; set; } = string.Empty; // markdown content

    [Required]
    public string FileName { get; set; } = string.Empty;

    [Required]
    public float Mark { get; set; }
    
    public List<TestCase> TestCases { get; set; } = new List<TestCase>();
    
    public Difficulty Difficulty { get; set; }
    
    public string CodeTemplate { get; set; } = string.Empty;

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }

    public bool IsDeleted { get; set; }
}


public class TestCase
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string InputData { get; set; } = string.Empty;
    
    [Required]
    public string ExpectedOutput { get; set; } = string.Empty;
    
    [Required]
    public bool IsPublic { get; set; }
    
    [Required]
    public bool IsCaseInsensitive { get; set; }
    
    [Required]
    public bool IsRemovedSpace { get; set; }
    
    public bool IsDeleted { get; set; }
}

public enum Difficulty
{
    EASY,
    MEDIUM,
    HARD
}