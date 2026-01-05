namespace AcasService.Application.Responses.ProgrammingLanguage;


public class ProgrammingLanguageResponse
{
    public string Id { get; set; } = string.Empty;

    public string LanguageName { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public string LanguageVersion { get; set; } = string.Empty;

    public bool IsEnable { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime UpdatedDate { get; set; }
}
