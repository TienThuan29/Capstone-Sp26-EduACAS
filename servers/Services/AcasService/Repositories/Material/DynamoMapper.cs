using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Material;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> MaterialToDynamoItem(Models.Material material)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = material.Id },
            ["lecturerId"] = new AttributeValue { S = material.LecturerId },
            ["classroomId"] = new AttributeValue { S = material.ClassroomId },
            ["filename"] = new AttributeValue { S = material.Filename },
            ["fileUrl"] = new AttributeValue { S = material.FileUrl },
            ["description"] = new AttributeValue { S = material.Description ?? string.Empty },
            ["isDeleted"] = new AttributeValue { BOOL = material.IsDeleted },
            ["createdDate"] = new AttributeValue { S = material.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
        
        return item;
    }

    public static Models.Material DynamoItemToMaterial(Dictionary<string, AttributeValue> item)
    {
        var material = new Models.Material
        {
            Id = item["id"].S,
            LecturerId = item["lecturerId"].S,
            ClassroomId = item["classroomId"].S,
            Filename = item["filename"].S,
            FileUrl = item["fileUrl"].S,
            Description = item.ContainsKey("description") ? item["description"].S : string.Empty,
            IsDeleted = item["isDeleted"].BOOL,
            CreatedDate = DateTime.Parse(item["createdDate"].S)
        };
        
        return material;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}