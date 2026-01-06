using AcasService.Application.Requests.ProgrammingLanguage;
using AcasService.Application.ResponseDTOs;

namespace AcasService.Application.Mappers;

public class ProgrammingLanguageMapper
{
    public ProgrammingLanguageResponse ToProgrammingLanguageResponse(
        Models.ProgrammingLanguage language)
    {
        return new ProgrammingLanguageResponse
        {
            Id = language.Id,
            LanguageName = language.LanguageName,
            Key = language.Key,
            LanguageVersion = language.LanguageVersion,
            IsEnable = language.IsEnable,
            CreatedDate = language.CreatedDate,
            UpdatedDate = language.UpdatedDate
        };
    }

    public Models.ProgrammingLanguage ToProgrammingLanguageModel(
        ProgrammingLanguageRequest request)
    {
        return new Models.ProgrammingLanguage
        {
            LanguageName = request.LanguageName,
            Key = request.Key,
            LanguageVersion = request.LanguageVersion
        };
    }
}
