using Amazon.DynamoDBv2.Model;
using AcasService.Models;

namespace AcasService.Repositories.ClassroomEnrollment;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> ToDynamoItem(ClassEnrollment enrollment)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = enrollment.Id }, 
            ["classId"] = new AttributeValue { S = enrollment.ClassId },
            ["studentId"] = new AttributeValue { S = enrollment.StudentId },
            ["joinedDate"] = new AttributeValue
            {
                S = enrollment.JoinedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            },
            ["isJoining"] = new AttributeValue
            {
                BOOL = enrollment.IsJoining
            },            ["movedOutDate"] = enrollment.MovedOutDate == null
                ? new AttributeValue { NULL = true }          
                : new AttributeValue
                {
                    S = enrollment.MovedOutDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                }
        };
    }

    public static Models.ClassEnrollment DynamoItemToClassEnrollment(
        Dictionary<string, AttributeValue> item)
    {
        var enrollment = new Models.ClassEnrollment
        {
            Id = item["id"].S,
            ClassId = item["classId"].S,
            StudentId = item["studentId"].S,
            JoinedDate = DateTime.Parse(item["joinedDate"].S),
            IsJoining = item["isJoining"].BOOL,            MovedOutDate = item.ContainsKey("movedOutDate")
                && !item["movedOutDate"].NULL
                && !string.IsNullOrEmpty(item["movedOutDate"].S)
                    ? DateTime.Parse(item["movedOutDate"].S)
                    : null
        };

        return enrollment;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}

