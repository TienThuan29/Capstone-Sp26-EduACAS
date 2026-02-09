using System.Linq;
using Amazon.DynamoDBv2.Model;
using AcasService.Models;

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
                ["startDatetime"] = new AttributeValue { S = exam.StartDatetime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
                ["endDatetime"] = new AttributeValue { S = exam.EndDatetime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
                ["isPublicResult"] = new AttributeValue { BOOL = exam.IsPublicResult },
                ["totalMark"] = new AttributeValue { N = exam.TotalMark.ToString() },
                ["status"] = new AttributeValue { S = exam.Status.ToString() },
                ["mode"] = new AttributeValue { S = exam.Mode.ToString() },
                ["isDeleted"] = new AttributeValue { BOOL = exam.IsDeleted },
                ["createdDate"] = new AttributeValue { S = exam.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
                ["updatedDate"] = new AttributeValue { S = exam.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
                ["description"] = new AttributeValue { S = exam.Description ?? string.Empty }
            };

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
                StartDatetime = DateTime.Parse(item["startDatetime"].S),
                EndDatetime = DateTime.Parse(item["endDatetime"].S),
                IsPublicResult = item["isPublicResult"].BOOL,
                TotalMark = float.Parse(item["totalMark"].N),
                Status = Enum.Parse<Status>(item["status"].S),
                Mode = Enum.Parse<Mode>(item["mode"].S),
                IsDeleted = item["isDeleted"].BOOL,
                CreatedDate = DateTime.Parse(item["createdDate"].S),
                UpdatedDate = DateTime.Parse(item["updatedDate"].S),
                Description = item.ContainsKey("description") ? item["description"].S : string.Empty
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

