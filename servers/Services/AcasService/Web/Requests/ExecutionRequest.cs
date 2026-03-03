using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AcasService.Web.Requests;

public class ExecuteParameters
{
    [JsonPropertyName("args")]
    public List<string>? Args { get; set; }

    [JsonPropertyName("stdin")]
    public string? Stdin { get; set; }

    [JsonPropertyName("runtimeTools")]
    public List<string>? RuntimeTools { get; set; }
}

public class CompileFilters
{
    [JsonPropertyName("commentOnly")]
    public bool? CommentOnly { get; set; }

    [JsonPropertyName("directives")]
    public bool? Directives { get; set; }

    [JsonPropertyName("libraryCode")]
    public bool? LibraryCode { get; set; }

    [JsonPropertyName("labels")]
    public bool? Labels { get; set; }

    [JsonPropertyName("demangle")]
    public bool? Demangle { get; set; }

    [JsonPropertyName("intel")]
    public bool? Intel { get; set; }

    [JsonPropertyName("execute")]
    public bool? Execute { get; set; }

    [JsonPropertyName("debugCalls")]
    public bool? DebugCalls { get; set; }

    [JsonPropertyName("binary")]
    public bool? Binary { get; set; }

    [JsonPropertyName("binaryObject")]
    public bool? BinaryObject { get; set; }

    [JsonPropertyName("trim")]
    public bool? Trim { get; set; }
}

public class CompileOptions
{
    [JsonPropertyName("userArguments")]
    public string? UserArguments { get; set; }

    [JsonPropertyName("filters")]
    public CompileFilters? Filters { get; set; }

    [JsonPropertyName("compilerOptions")]
    public Dictionary<string, object> CompilerOptions { get; set; } = new Dictionary<string, object>();

    [JsonPropertyName("executeParameters")]
    public ExecuteParameters? ExecuteParameters { get; set; }

    [JsonPropertyName("tools")]
    public List<object>? Tools { get; set; }

    [JsonPropertyName("libraries")]
    public List<object>? Libraries { get; set; }
}

public class FiledataPair
{
    [Required(ErrorMessage = "Filename is required")]
    [JsonPropertyName("filename")]
    public string Filename { get; set; } = string.Empty;

    [Required(ErrorMessage = "Contents is required")]
    [JsonPropertyName("contents")]
    public string Contents { get; set; } = string.Empty;
}

public class CompileRequest
{
    [Required(ErrorMessage = "Source is required")]
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [Required(ErrorMessage = "Options is required")]
    [JsonPropertyName("options")]
    public CompileOptions Options { get; set; } = new CompileOptions();

    [JsonPropertyName("lang")]
    public string? Lang { get; set; }

    [JsonPropertyName("files")]
    public List<FiledataPair>? Files { get; set; }

    [JsonPropertyName("bypassCache")]
    public bool? BypassCache { get; set; }
}

public class RumBatchRequest : CompileRequest
{
    [Required(ErrorMessage = "stdinList must contain at least one input")]
    [MinLength(1, ErrorMessage = "stdinList must contain at least one input")]
    [JsonPropertyName("stdinList")]
    public List<string> StdinList { get; set; } = new();

    [Required(ErrorMessage = "Test cases are required")]
    [JsonPropertyName("testCases")]
    public List<TestCase> TestCases { get; set; } = new List<TestCase>();
}

// custom testcase request
public class CustomTestcaseRequest
{
    [Required(ErrorMessage = "Compiler ID is required")]
    [JsonPropertyName("compilerId")]
    public string CompilerId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Compile request is required")]
    [JsonPropertyName("compileRequest")]
    public CompileRequest CompileRequest { get; set; } = new CompileRequest();

    [Required(ErrorMessage = "Language is required")]
    [JsonPropertyName("lang")]
    public string Lang { get; set; } = string.Empty;
}

// run all public testcases request
public class PublicTestcasesRequest
{
    [Required(ErrorMessage = "Compiler ID is required")]
    [JsonPropertyName("compilerId")]
    public string CompilerId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language is required")]
    [JsonPropertyName("lang")]
    public string Lang { get; set; } = string.Empty;

    [Required(ErrorMessage = "Run batch request is required")]
    [JsonPropertyName("runBatchRequest")]
    public RumBatchRequest RunBatchRequest { get; set; } = new RumBatchRequest();
}


public class TestCase
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("problemId")]
    public string ProblemId { get; set; } = string.Empty;

    [JsonPropertyName("inputData")]
    public string InputData { get; set; } = string.Empty;

    [JsonPropertyName("expectedOutput")]
    public string ExpectedOutput { get; set; } = string.Empty;

    [JsonPropertyName("isPublic")]
    public bool IsPublic { get; set; }

    [JsonPropertyName("isCaseInsensitive")]
    public bool IsCaseInsensitive { get; set; }

    [JsonPropertyName("isFloatingPoint")]
    public bool IsFloatingPoint { get; set; }

    [JsonPropertyName("floatingPointTolerance")]
    public double? FloatingPointTolerance { get; set; } = null;

    [JsonPropertyName("decimalPlaces")]
    public int? DecimalPlaces { get; set; }
    
    [JsonPropertyName("isTokenComparision")]
    public bool IsTokenComparision { get; set; }
    
    [JsonPropertyName("isNotOrderedComparision")]
    public bool? IsNotOrderedComparision { get; set; }
}