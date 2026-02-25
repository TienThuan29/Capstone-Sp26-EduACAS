using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Comment;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> CommentToDynamoItem(Models.Comment comment)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = comment.Id },
            ["discussionIssueId"] = new AttributeValue { S = comment.DiscussionIssueId },
            ["authorId"] = new AttributeValue { S = comment.AuthorId },
            ["authorName"] = new AttributeValue { S = comment.AuthorName ?? string.Empty },
            ["content"] = new AttributeValue { S = comment.Content },
            ["isDeleted"] = new AttributeValue { BOOL = comment.IsDeleted },
            ["createdDate"] = new AttributeValue { S = comment.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = comment.UpdatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (comment.ImagesName != null && comment.ImagesName.Length > 0)
            item["imagesName"] = new AttributeValue { L = comment.ImagesName.Select(s => new AttributeValue { S = s }).ToList() };

        if (comment.FilesName != null && comment.FilesName.Length > 0)
            item["filesName"] = new AttributeValue { L = comment.FilesName.Select(s => new AttributeValue { S = s }).ToList() };

        return item;
    }

    public static Models.Comment DynamoItemToComment(Dictionary<string, AttributeValue> item)
    {
        return new Models.Comment
        {
            Id = item["id"].S,
            DiscussionIssueId = item["discussionIssueId"].S,
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