using AcasService.Application.CodeRunner;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Formatters;

public interface ICodeFormatterCommand
{
    Task<FormatCodeResponse> FormatCodeAsync(string lang, FormatCodeRequest request);
}

public class CodeFormatterCommand : ICodeFormatterCommand
{
    private readonly ICodeFormatterApi _codeFormatterApi;
    private readonly ILogger<CodeFormatterCommand> _logger;

    public CodeFormatterCommand(
        ICodeFormatterApi codeFormatterApi,
        ILogger<CodeFormatterCommand> logger)
    {
        _codeFormatterApi = codeFormatterApi;
        _logger = logger;
    }

    public async Task<FormatCodeResponse> FormatCodeAsync(string lang, FormatCodeRequest request)
    {
        _logger.LogInformation("Formatting code for language: {Language}", lang);
        var result = await _codeFormatterApi.FormatCodeAsync(lang, request);
        return result;
    }
}
