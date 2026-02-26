using Amazon.DynamoDBv2.Model;

namespace AcasService.Repositories.Slot;

public static class DynamoMapper
{
    public static Dictionary<string, AttributeValue> SlotToDynamoItem(Models.Slot slot)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = slot.Id },
            ["classroomId"] = new AttributeValue { S = slot.ClassroomId },
            ["slotNumber"] = new AttributeValue { S = slot.SlotNumber },
            ["title"] = new AttributeValue { S = slot.Title },
            ["description"] = new AttributeValue { S = slot.Description },
            ["createdDate"] = new AttributeValue { S = slot.CreatedDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };

        if (slot.UpdatedDate.HasValue)
        {
            item["updatedDate"] = new AttributeValue { S = slot.UpdatedDate.Value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") };
        }
        else
        {
            item["updatedDate"] = new AttributeValue { NULL = true };
        }

        return item;
    }

    public static Models.Slot DynamoItemToSlot(Dictionary<string, AttributeValue> item)
    {
        var slot = new Models.Slot
        {
            Id = item["id"].S,
            ClassroomId = item["classroomId"].S,
            SlotNumber = item["slotNumber"].S,
            Title = item["title"].S,
            Description = item.ContainsKey("description") ? item["description"].S : string.Empty,
            CreatedDate = DateTime.Parse(item["createdDate"].S),
            UpdatedDate = item.ContainsKey("updatedDate") && !item["updatedDate"].NULL && !string.IsNullOrEmpty(item["updatedDate"].S)
                ? DateTime.Parse(item["updatedDate"].S)
                : null
        };

        return slot;
    }

    public static Dictionary<string, AttributeValue> CreateKey(string id)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = id }
        };
    }
}
