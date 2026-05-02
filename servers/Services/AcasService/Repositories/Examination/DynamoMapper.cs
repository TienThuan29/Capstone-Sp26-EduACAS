using System.Linq;
using Amazon.DynamoDBv2.Model;
using AcasService.Models;
using AcasService.Repositories.DynamoDb;

namespace AcasService.Repositories.Examination;


    public static class DynamoMapper
    {
        public static Dictionary<string, AttributeValue> ExaminationToDynamoItem(Models.Examination exam)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = exam.Id },
                ["examName"] = new AttributeValue { S = exam.ExamName },
                ["programmingLanguageId"] = new AttributeValue { S = exam.ProgrammingLanguageId },
                ["classroomId"] = new AttributeValue { S = exam.ClassroomId },
                ["startDatetime"] = new AttributeValue { S = DynamoDbDateTime.ToUtcString(exam.StartDatetime) },
                ["endDatetime"] = new AttributeValue { S = DynamoDbDateTime.ToUtcString(exam.EndDatetime) },
                ["isPublicResult"] = new AttributeValue { BOOL = exam.IsPublicResult },
                ["totalMark"] = new AttributeValue { N = exam.TotalMark.ToString() },
                ["status"] = new AttributeValue { S = exam.Status.ToString() },
                ["mode"] = new AttributeValue { S = exam.Mode.ToString() },
                ["useStrict"] = new AttributeValue { BOOL = exam.UseStrict },
                ["minScoreThreshold"] = new AttributeValue { N = exam.MinScoreThreshold.ToString() },
                ["isDeleted"] = new AttributeValue { BOOL = exam.IsDeleted },
            };

            if (exam.MaxAttempts.HasValue)
            {
                item["maxAttempts"] = new AttributeValue { N = exam.MaxAttempts.Value.ToString() };
            }

            item["createdDate"] = new AttributeValue { S = DynamoDbDateTime.ToUtcString(exam.CreatedDate) };
            item["updatedDate"] = new AttributeValue { S = DynamoDbDateTime.ToUtcString(exam.UpdatedDate) };
            item["description"] = new AttributeValue { S = exam.Description ?? string.Empty };

            if (exam.Problems != null && exam.Problems.Count > 0)
            {
                item["problems"] = new AttributeValue
                {
                    L = exam.Problems.Select(p => new AttributeValue
                    {
                        M = new Dictionary<string, AttributeValue>
                        {
                            ["problemId"] = new AttributeValue { S = p.ProblemId },
                            ["mark"] = new AttributeValue { N = p.Mark.ToString() }
                        }
                    }).ToList()
                };
            }

            return item;
        }

        public static Models.Examination DynamoItemToExamination(Dictionary<string, AttributeValue> item)
        {
            var exam = new Models.Examination
            {
                Id = item["id"].S,
                ExamName = item["examName"].S,
                ProgrammingLanguageId = item["programmingLanguageId"].S,
                ClassroomId = item["classroomId"].S,
                StartDatetime = DynamoDbDateTime.FromUtcString(item["startDatetime"].S),
                EndDatetime = DynamoDbDateTime.FromUtcString(item["endDatetime"].S),
                IsPublicResult = item["isPublicResult"].BOOL,
                TotalMark = float.Parse(item["totalMark"].N),
                Status = Enum.Parse<Status>(item["status"].S),
                Mode = Enum.Parse<Mode>(item["mode"].S),
                UseStrict = item.ContainsKey("useStrict") ? item["useStrict"].BOOL : false,
                MinScoreThreshold = item.ContainsKey("minScoreThreshold") ? float.Parse(item["minScoreThreshold"].N) : 0f,
                IsDeleted = item["isDeleted"].BOOL,
                CreatedDate = DynamoDbDateTime.FromUtcString(item["createdDate"].S),
                UpdatedDate = DynamoDbDateTime.FromUtcString(item["updatedDate"].S),
                Description = item.ContainsKey("description") ? item["description"].S : string.Empty,
                MaxAttempts = item.ContainsKey("maxAttempts") ? int.Parse(item["maxAttempts"].N) : null
            };

            if (item.ContainsKey("problems") && item["problems"].L.Count > 0)
            {
                exam.Problems = item["problems"].L.Select(av =>
                {
                    var m = av.M;
                    return new ExaminationProblem
                    {
                        ProblemId = m["problemId"].S,
                        Mark = float.Parse(m["mark"].N)
                    };
                }).ToList();
            }
            else
            {
                exam.Problems = new List<ExaminationProblem>();
            }

            return exam;
        }

        public static Dictionary<string, AttributeValue> CreateKey(string id)
        {
            return new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = id }
            };
        }
    }

