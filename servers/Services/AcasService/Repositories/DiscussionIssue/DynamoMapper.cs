using System.Text.Json;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.DiscussionIssue;

public static class DynamoMapper
{
    private static readonly JsonSerializerOptions CommentJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static Dictionary<string, AttributeValue> DiscussionIssueToDynamoItem(Models.DiscussionIssue issue)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = issue.Id },
            ["classroomId"] = new AttributeValue { S = issue.ClassroomId },
            ["title"] = new AttributeValue { S = issue.Title },
            ["authorId"] = new AttributeValue { S = issue.AuthorId },
            ["content"] = new AttributeValue { S = issue.Content },
            ["attachments"] = new AttributeValue
            {
                L = issue.Attachments.Select(a => new AttributeValue { S = a }).ToList()
            },
            ["refProblemId"] = new AttributeValue { S = issue.RefProblemId },
            ["status"] = new AttributeValue { S = issue.Status.ToString() },
            ["viewCount"] = new AttributeValue { N = issue.ViewCount.ToString() },
            ["isDeleted"] = new AttributeValue { BOOL = issue.IsDeleted },
            ["createdDate"] = new AttributeValue { S = issue.CreatedDate.ToString("o") },
            ["updatedDate"] = new AttributeValue { S = issue.UpdatedDate.ToString("o") }
        };
        if (issue.Comments != null && issue.Comments.Count > 0)
        {
            item["comments"] = new AttributeValue
            {
                S = JsonSerializer.Serialize(issue.Comments, CommentJsonOptions)
            };
        }
        return item;
    }

    public static Models.DiscussionIssue DynamoItemToDiscussionIssue(Dictionary<string, AttributeValue> item)
    {
        var comments = new List<Models.Comment>();
        if (item.TryGetValue("comments", out var commentsAv) && commentsAv.S != null)
        {
            try
            {
                var deserialized = JsonSerializer.Deserialize<List<Models.Comment>>(commentsAv.S, CommentJsonOptions);
                if (deserialized != null)
                    comments = deserialized;
            }
            catch
            {
                // leave comments empty on parse error
            }
        }

        var issue = new Models.DiscussionIssue
        {
            Id = item["id"].S,
            ClassroomId = item["classroomId"].S,
            Title = item["title"].S,
            AuthorId = item["authorId"].S,
            Content = item["content"].S,
            Attachments = item.ContainsKey("attachments") && item["attachments"].L != null
                ? item["attachments"].L.Select(av => av.S ?? string.Empty).ToArray()
                : Array.Empty<string>(),
            RefProblemId = item.ContainsKey("refProblemId") ? item["refProblemId"].S ?? string.Empty : string.Empty,
            Status = Enum.TryParse<Models.DiscussionIssueStatus>(item["status"].S, out var status)
                ? status
                : Models.DiscussionIssueStatus.OPEN,
            ViewCount = item.ContainsKey("viewCount") && item["viewCount"].N != null
                ? int.Parse(item["viewCount"].N)
                : 0,
            IsDeleted = item["isDeleted"].BOOL,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = DateTime.Parse(item["updatedDate"].S),
            Comments = comments
        };
        return issue;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
