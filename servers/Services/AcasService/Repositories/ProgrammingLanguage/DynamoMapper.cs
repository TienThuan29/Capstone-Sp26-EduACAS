using Amazon.DynamoDBv2.Model;
using System.Globalization;
using System.Text.Json;
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
            ["name"] = new AttributeValue { S = language.Name },
            ["monaco"] = new AttributeValue { S = language.Monaco },
            ["extensions"] = new AttributeValue { L = language.Extensions.Select(e => new AttributeValue { S = e }).ToList() },
            ["logoFileUrl"] = new AttributeValue { S = language.LogoFileUrl },
            ["formatter"] = new AttributeValue { S = language.Formatter },
            ["digitSeparator"] = new AttributeValue { S = language.DigitSeparator },
            ["status"] = new AttributeValue { S = language.Status.ToString() }
        };

        // Serialize Compilers as JSON string
        if (language.Compilers != null && language.Compilers.Count > 0)
        {
            item["compilers"] = new AttributeValue { S = JsonSerializer.Serialize(language.Compilers) };
        }

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
            Name = item.ContainsKey("name") ? item["name"].S : string.Empty,
            Monaco = item.ContainsKey("monaco") ? item["monaco"].S : string.Empty,
            Extensions = item.ContainsKey("extensions") 
                ? item["extensions"].L.Select(e => e.S).ToList() 
                : new List<string>(),
            LogoFileUrl = item.ContainsKey("logoFileUrl") ? item["logoFileUrl"].S : string.Empty,
            Formatter = item.ContainsKey("formatter") ? item["formatter"].S : string.Empty,
            DigitSeparator = item.ContainsKey("digitSeparator") ? item["digitSeparator"].S : string.Empty,
            Status = item.ContainsKey("status") ? Enum.Parse<PLStatus>(item["status"].S) : PLStatus.DISABLE
        };
        
        if (item.ContainsKey("compilers") && !string.IsNullOrEmpty(item["compilers"].S))
        {
            language.Compilers = JsonSerializer.Deserialize<List<Compiler>>(item["compilers"].S) ?? new List<Compiler>();
        }

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
