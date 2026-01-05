using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Subject;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> SubjectToDynamoItem(Models.Subject subject)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = subject.Id },
            ["subjectCode"] = new AttributeValue { S = subject.SubjectCode },
            ["subjectName"] = new AttributeValue { S = subject.SubjectName },
            ["description"] = new AttributeValue { S = subject.Description },
            ["createdBy"] = new AttributeValue { S = subject.CreatedBy },
            ["isDeleted"] = new AttributeValue { BOOL = subject.IsDeleted },
            ["createdDate"] = new AttributeValue { S = subject.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
            if (subject.UpdatedDate.HasValue)
        {
            item["updatedDate"] = new AttributeValue { S = subject.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        }
        else
        {
            item["updatedDate"] = new AttributeValue { NULL = true };
        }
    
        return item;
    }

    public static Models.Subject DynamoItemToSubject(Dictionary<string, AttributeValue> item)
    {
        var subject = new Models.Subject
        {
            Id = item["id"].S,
            SubjectCode = item["subjectCode"].S,
            SubjectName = item["subjectName"].S,
            Description = item["description"].S,
            CreatedBy = item["createdBy"].S,
            IsDeleted = item["isDeleted"].BOOL,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = item.ContainsKey("updatedDate") && !item["updatedDate"].NULL && !string.IsNullOrEmpty(item["updatedDate"].S)
                ? DateTime.Parse(item["updatedDate"].S)
                : null
        };
        return subject;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}