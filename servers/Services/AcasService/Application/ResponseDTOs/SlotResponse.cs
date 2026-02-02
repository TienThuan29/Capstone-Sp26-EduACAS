namespace AcasService.Application.ResponseDTOs;

public class SlotResponse
{
    public string Id { get; set; } = string.Empty;
    public string ClassroomId { get; set; } = string.Empty;
    public string SlotNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}
