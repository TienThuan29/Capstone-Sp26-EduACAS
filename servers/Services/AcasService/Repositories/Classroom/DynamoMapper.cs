using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Classroom;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ClassroomToDynamoItem(Models.Classroom classroom)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = classroom.Id },
            ["classCode"] = new AttributeValue { S = classroom.ClassCode },
            ["className"] = new AttributeValue { S = classroom.ClassName },
            ["lecturerId"] = new AttributeValue { S = classroom.LecturerId },
            ["subjectId"] = new AttributeValue { S = classroom.SubjectId },
            ["semesterName"] = new AttributeValue { S = classroom.SemesterName },
            ["enrolKey"] = new AttributeValue { S = classroom.EnrolKey },
            ["createdDate"] = new AttributeValue { S = classroom.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["endDate"] = new AttributeValue { S = classroom.EndDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["isDeleted"] = new AttributeValue { BOOL = classroom.IsDeleted }
        };
        if (classroom.UpdatedDate.HasValue)
        {
            item["updatedDate"] = new AttributeValue { S = classroom.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        }
        else
        {
            item["updatedDate"] = new AttributeValue { NULL = true };
        }
        return item;
    }

    public static Models.Classroom DynamoItemToClassroom(Dictionary<string, AttributeValue> item)
    {
        var classroom = new Models.Classroom
        {
            Id = item["id"].S,
            ClassCode = item["classCode"].S,
            ClassName = item["className"].S,
            LecturerId = item["lecturerId"].S,
            SubjectId = item["subjectId"].S,
            SemesterName = item["semesterName"].S,
            EnrolKey = item["enrolKey"].S,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            EndDate = DateTime.Parse(item["endDate"].S),
            IsDeleted = item["isDeleted"].BOOL,
            UpdatedDate = item.ContainsKey("updatedDate") && !item["updatedDate"].NULL && !string.IsNullOrEmpty(item["updatedDate"].S)
                ? DateTime.Parse(item["updatedDate"].S)
                : null
        };
        return classroom;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}