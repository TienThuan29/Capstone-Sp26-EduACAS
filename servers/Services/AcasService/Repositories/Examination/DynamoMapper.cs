namespace AcasService.Repositories.Examination;


using Amazon.DynamoDBv2.Model;
using AcasService.Models;


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

            if (exam.ProblemIds != null && exam.ProblemIds.Length > 0)
            {
               item["problemIds"] = new AttributeValue { SS = exam.ProblemIds.ToList() };
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

            if (item.ContainsKey("problemIds") && item["problemIds"].SS.Count > 0)
            {
                exam.ProblemIds = item["problemIds"].SS.ToArray();
            }
            else
            {
                exam.ProblemIds = Array.Empty<string>();
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

