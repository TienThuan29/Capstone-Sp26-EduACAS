using Amazon.DynamoDBv2.Model;
using System.Globalization;
using AcasService.Models;

namespace AcasService.Repositories.ProgrammingLanguage;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ProgrammingLanguageToDynamoItem(
        Models.ProgrammingLanguage language)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = language.Id },
            ["languageName"] = new AttributeValue { S = language.LanguageName },
            ["key"] = new AttributeValue { S = language.Key },
            ["languageVersion"] = new AttributeValue { S = language.LanguageVersion },
            ["isEnable"] = new AttributeValue { BOOL = language.IsEnable }
        };

        if (language.CreatedDate != default)
        {
            item["createdDate"] = new AttributeValue
            {
                S = language.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture)
            };
        }

        if (language.UpdatedDate != default)
        {
            item["updatedDate"] = new AttributeValue
            {
                S = language.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture)
            };
        }

        return item;
    }

    public static Models.ProgrammingLanguage DynamoItemToProgrammingLanguage(
        Dictionary<string, AttributeValue> item)
    {
        var language = new Models.ProgrammingLanguage
        {
            Id = item["id"].S,
            LanguageName = item["languageName"].S,
            Key = item["key"].S,
            LanguageVersion = item.ContainsKey("languageVersion")
                ? item["languageVersion"].S
                : string.Empty,
            IsEnable = item.ContainsKey("isEnable") && item["isEnable"].BOOL
        };

        if (item.ContainsKey("createdDate") && !string.IsNullOrEmpty(item["createdDate"].S))
        {
            language.CreatedDate = DateTime.Parse(item["createdDate"].S, CultureInfo.InvariantCulture);
        }

        if (item.ContainsKey("updatedDate") && !string.IsNullOrEmpty(item["updatedDate"].S))
        {
            language.UpdatedDate = DateTime.Parse(item["updatedDate"].S, CultureInfo.InvariantCulture);
        }

        return language;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
