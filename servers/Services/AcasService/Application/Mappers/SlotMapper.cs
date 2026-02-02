using AcasService.Application.ResponseDTOs;
using AcasService.Models;

namespace AcasService.Application.Mappers;

public class SlotMapper
{
    public SlotResponse ToSlotResponse(Slot slot)
    {
        return new SlotResponse
        {
            Id = slot.Id,
            ClassroomId = slot.ClassroomId,
            SlotNumber = slot.SlotNumber,
            Title = slot.Title,
            Description = slot.Description,
            CreatedDate = slot.CreatedDate,
            UpdatedDate = slot.UpdatedDate
        };
    }
}
