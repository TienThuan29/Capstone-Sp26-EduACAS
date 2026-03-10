using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class SlotMapper
{
    public SlotResponse ToSlotResponse(Slot slot, List<ExaminationBasicResponse>? examinations = null)
    {
        var response = new SlotResponse
        {
            Id = slot.Id,
            ClassroomId = slot.ClassroomId,
            SlotNumber = slot.SlotNumber,
            Title = slot.Title,
            Description = slot.Description,
            CreatedDate = slot.CreatedDate,
            UpdatedDate = slot.UpdatedDate,
            ExaminationIds = slot.ExaminationIds ?? new List<string>()
        };
        if (examinations != null)
            response.Examinations = examinations;
        return response;
    }
}
