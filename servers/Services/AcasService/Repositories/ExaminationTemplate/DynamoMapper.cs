using System.Linq;
using System.Globalization;
using Amazon.DynamoDBv2.Model;
using AcasService.Models;

namespace AcasService.Repositories.ExaminationTemplate;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ExaminationTemplateToDynamoItem(Models.ExaminationTemplate template)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = template.Id },
            ["examName"] = new AttributeValue { S = template.ExamName },
            ["lecturerId"] = new AttributeValue { S = template.LecturerId },
            ["description"] = new AttributeValue { S = template.Description ?? string.Empty },
            ["totalMark"] = new AttributeValue { N = template.TotalMark.ToString(CultureInfo.InvariantCulture) },
            ["isDeleted"] = new AttributeValue { BOOL = template.IsDeleted },
            ["createdDate"] = new AttributeValue { S = template.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (template.UpdatedDate.HasValue)
        {
            item["updatedDate"] = new AttributeValue { S = template.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        }
        else
        {
            item["updatedDate"] = new AttributeValue { NULL = true };
        }

        if (template.Problems != null && template.Problems.Count > 0)
        {
            item["problems"] = new AttributeValue
            {
                L = template.Problems.Select(p => new AttributeValue
                {
                    M = new Dictionary<string, AttributeValue>
                    {
                        ["problemId"] = new AttributeValue { S = p.ProblemId },
                        ["mark"] = new AttributeValue { N = p.Mark.ToString(CultureInfo.InvariantCulture) }
                    }
                }).ToList()
            };
        }

        return item;
    }

    public static Models.ExaminationTemplate DynamoItemToExaminationTemplate(Dictionary<string, AttributeValue> item)
    {
        var template = new Models.ExaminationTemplate
        {
            Id = item["id"].S,
            ExamName = item["examName"].S,
            LecturerId = item["lecturerId"].S,
            Description = item.ContainsKey("description") ? item["description"].S : string.Empty,
            TotalMark = float.Parse(item["totalMark"].N, CultureInfo.InvariantCulture),
            IsDeleted = item["isDeleted"].BOOL,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = item.ContainsKey("updatedDate") && !item["updatedDate"].NULL && !string.IsNullOrEmpty(item["updatedDate"].S)
                ? DateTime.Parse(item["updatedDate"].S, CultureInfo.InvariantCulture)
                : null
        };

        if (item.ContainsKey("problems") && item["problems"].L.Count > 0)
        {
            template.Problems = item["problems"].L.Select(av =>
            {
                var m = av.M;
                return new ExamTempProblem
                {
                    ProblemId = m["problemId"].S,
                    Mark = float.Parse(m["mark"].N)
                };
            }).ToList();
        }
        else
        {
            template.Problems = new List<ExamTempProblem>();
        }

        return template;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
