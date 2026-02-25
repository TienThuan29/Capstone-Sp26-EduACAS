using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.DiscussionIssue;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> IssueToDynamoItem(Models.DiscussionIssue issue)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = issue.Id },
            ["classroomId"] = new AttributeValue { S = issue.ClassroomId },
            ["title"] = new AttributeValue { S = issue.Title },
            ["authorId"] = new AttributeValue { S = issue.AuthorId },
            ["authorName"] = new AttributeValue { S = issue.AuthorName ?? string.Empty },
            ["content"] = new AttributeValue { S = issue.Content },
            ["isDeleted"] = new AttributeValue { BOOL = issue.IsDeleted },
            ["createdDate"] = new AttributeValue { S = issue.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = issue.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (issue.ImagesName != null && issue.ImagesName.Length > 0)
            item["imagesName"] = new AttributeValue { L = issue.ImagesName.Select(s => new AttributeValue { S = s }).ToList() };

        if (issue.FilesName != null && issue.FilesName.Length > 0)
            item["filesName"] = new AttributeValue { L = issue.FilesName.Select(s => new AttributeValue { S = s }).ToList() };

        return item;
    }

    public static Models.DiscussionIssue DynamoItemToIssue(Dictionary<string, AttributeValue> item)
    {
        return new Models.DiscussionIssue
        {
            Id = item["id"].S,
            ClassroomId = item["classroomId"].S,
            Title = item["title"].S,
            AuthorId = item["authorId"].S,
            AuthorName = item.ContainsKey("authorName") ? item["authorName"].S : string.Empty,
            Content = item.ContainsKey("content") ? item["content"].S : string.Empty,
            ImagesName = item.ContainsKey("imagesName") ? item["imagesName"].L.Select(a => a.S).ToArray() : Array.Empty<string>(),
            FilesName = item.ContainsKey("filesName") ? item["filesName"].L.Select(a => a.S).ToArray() : Array.Empty<string>(),
            IsDeleted = item.ContainsKey("isDeleted") && item["isDeleted"].BOOL,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = DateTime.Parse(item["updatedDate"].S)
        };
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}