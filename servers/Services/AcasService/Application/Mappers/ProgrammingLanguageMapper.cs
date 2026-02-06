using AcasService.Application.Requests.ProgrammingLanguage;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class ProgrammingLanguageMapper
{
    public ProgrammingLanguageResponse ToProgrammingLanguageResponse(Models.ProgrammingLanguage language)
    {
        return new ProgrammingLanguageResponse
        {
            Id = language.Id,
            Name = language.Name,
            Monaco = language.Monaco,
            Extensions = language.Extensions,
            LogoFileUrl = language.LogoFileUrl,
            Formatter = language.Formatter,
            DigitSeparator = language.DigitSeparator,
            Compilers = language.Compilers.Select(c => new CompilerResponse
            {
                Id = c.Id,
                Name = c.Name,
                Group = c.Group,
                StdVersions = c.StdVersions
            }).ToList(),
            Status = language.Status.ToString(),
            CreatedDate = language.CreatedDate,
            UpdatedDate = language.UpdatedDate
        };
    }

    // public Models.ProgrammingLanguage ToProgrammingLanguageModel(
    //     ProgrammingLanguageRequest request)
    // {
    //     return new Models.ProgrammingLanguage
    //     {
    //         Name = request.Name,
    //         Monaco = request.Monaco,
    //         Extensions = request.Extensions,
    //         LogoFileUrl = request.LogoFileUrl,
    //         Formatter = request.Formatter,
    //         DigitSeparator = request.DigitSeparator,
    //         Compilers = request.Compilers.Select(c => new Compiler
    //         {
    //             Id = c.Id,
    //             Name = c.Name,
    //             Group = c.Group,
    //             StdVersions = c.StdVersions
    //         }).ToList()
    //     };
    // }
}
