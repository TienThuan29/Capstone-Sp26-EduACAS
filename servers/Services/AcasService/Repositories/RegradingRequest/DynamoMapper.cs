using AcasService.Models;
using Amazon.DynamoDBv2.Model;
using System.Text.Json;

namespace AcasService.Repositories.RegradingRequest;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> RegradingRequestToDynamoItem(Models.RegradingRequest request)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = request.Id },
            ["examinationId"] = new AttributeValue { S = request.ExaminationId },
            ["submissionId"] = new AttributeValue { S = request.SubmissionId },
            ["studentId"] = new AttributeValue { S = request.StudentId },
            ["reason"] = new AttributeValue { S = request.Reason },
            ["createdDate"] = new AttributeValue { S = request.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["status"] = new AttributeValue { S = request.Status.ToString() }
        };

        if (!string.IsNullOrWhiteSpace(request.LecturerNote))
        {
            item["lecturerNote"] = new AttributeValue { S = request.LecturerNote };
        }

        if (request.HandledDate != default)
        {
            item["handledDate"] = new AttributeValue { S = request.HandledDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        }

        if (request.ImageUrls != null && request.ImageUrls.Count > 0)
        {
            item["imageUrls"] = new AttributeValue { L = request.ImageUrls.Select(url => new AttributeValue { S = url }).ToList() };
        }

        return item;
    }

    public static Models.RegradingRequest DynamoItemToRegradingRequest(Dictionary<string, AttributeValue> item)
    {
        var request = new Models.RegradingRequest
        {
            Id = item["id"].S,
            ExaminationId = item["examinationId"].S,
            SubmissionId = item.ContainsKey("submissionId") ? item["submissionId"].S : string.Empty,
            StudentId = item["studentId"].S,
            Reason = item["reason"].S,
            CreatedDate = DateTime.Parse(item["createdDate"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal),
            Status = item.ContainsKey("status") && !string.IsNullOrEmpty(item["status"].S)
                ? Enum.TryParse<RegradingRequestStatus>(item["status"].S, out var status)
                    ? status
                    : RegradingRequestStatus.PENDING
                : RegradingRequestStatus.PENDING,
            LecturerNote = item.ContainsKey("lecturerNote") ? item["lecturerNote"].S : string.Empty,
            HandledDate = item.ContainsKey("handledDate") && !string.IsNullOrEmpty(item["handledDate"].S)
                ? DateTime.Parse(item["handledDate"].S, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal)
                : default
        };

        if (item.TryGetValue("imageUrls", out var imageUrlsAttribute) && imageUrlsAttribute.L != null)
        {
            request.ImageUrls = imageUrlsAttribute.L.Select(attr => attr.S).ToList();
        }

        return request;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
