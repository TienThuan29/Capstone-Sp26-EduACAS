using System.ComponentModel.DataAnnotations;


namespace AcasService.Web.Requests.SlotRequest;

public class SlotRequest
{
    [Required]
    public string ClassroomId { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Optional. When provided, replaces the slot's examination IDs.
    /// </summary>
    public List<string>? ExaminationIds { get; set; }
}
