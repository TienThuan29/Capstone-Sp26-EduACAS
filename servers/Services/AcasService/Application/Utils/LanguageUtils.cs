namespace AcasService.Application.Utils;

public static class LanguageUtils
{
    public static string GetExtensionForLanguage(string lang) => lang.ToLower() switch {
        "csharp" or "c#" => "cs",
        "java" => "java",
        "python" or "python3" => "py",
        "cpp" or "c++" or "c" => "cpp",
        "go" or "golang" => "go",
        "javascript" => "js",
        "typescript" => "ts",
        "kotlin" => "kt",
        "rust" => "rs",
        "swift" => "swift",
        _ => "txt"
    };
}
