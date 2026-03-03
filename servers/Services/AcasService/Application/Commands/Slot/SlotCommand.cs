using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests.SlotRequest;
using AcasService.Repositories.Slot;
using AcasService.Repositories.Classroom;
using AcasService.Application.Mappers;
using AcasService.Models;


namespace AcasService.Application.Commands.SlotCommand;


public interface ISlotCommand
{
    Task<SlotResponse?> CreateAnsync(SlotRequest slotRequest);

    Task<SlotResponse?> UpdateAnsync(SlotRequest slotRequest, String slotId);

    Task<List<SlotResponse>?> CreateMultiAnsync(String classroomId);

    Task DeleteAsync(String slotId);
}

public class SlotCommand : ISlotCommand
{
    private readonly ISlotRepository _slotRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly SlotMapper _slotMapper;
    private readonly ILogger<SlotCommand> _logger;

    public SlotCommand(
        ISlotRepository slotRepository,
        IClassroomRepository classroomRepository,
        ILogger<SlotCommand> logger)
    {
        _slotRepository = slotRepository;
        _classroomRepository = classroomRepository;
        _slotMapper = new SlotMapper();
        _logger = logger;
    }

    public async Task<SlotResponse?> CreateAnsync(SlotRequest slotRequest)
    {
        try
        {
            var classroom = await _classroomRepository.FindByIdAsync(slotRequest.ClassroomId) ?? throw new KeyNotFoundException($"Classroom with id {slotRequest.ClassroomId} not found");
            var existingSlots = await _slotRepository.GetSlotsByClassroomIdAsync(slotRequest.ClassroomId);

            int currentSlotCount = existingSlots.Count();
            int maxSlot = classroom.MaxSlot;

            if (currentSlotCount >= maxSlot)
            {
                throw new InvalidOperationException($"Classroom already has maximum slots ({maxSlot})");
            }

            int nextSlotNumber = currentSlotCount + 1;
            var slot = new Slot
            {
                Id = Guid.NewGuid().ToString(),
                ClassroomId = classroom.Id,
                // SlotNumber = $"Slot {i}",
                SlotNumber = nextSlotNumber.ToString(),
                Title = slotRequest.Title,
                Description = slotRequest.Description,
                CreatedDate = DateTime.UtcNow
            };
            await _slotRepository.CreateAsync(slot);
            return _slotMapper.ToSlotResponse(slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating slots for ClassroomId {ClassroomId}", slotRequest.ClassroomId);
            throw new InvalidOperationException("Error occurred while creating slots for class");
        }
    }

    public async Task<List<SlotResponse>?> CreateMultiAnsync(string classroomId)
    {
        try
        {
            var classroom = await _classroomRepository.FindByIdAsync(classroomId) ?? throw new KeyNotFoundException($"Classroom with id {classroomId} not found");

            var existingSlots = await _slotRepository.GetSlotsByClassroomIdAsync(classroomId);

            int currentSlotCount = existingSlots.Count();
            int maxSlot = classroom.MaxSlot;

            if (currentSlotCount >= maxSlot)
            {
                throw new InvalidOperationException($"Classroom already has maximum slots ({maxSlot})");
            }

            int startSlotNumber = currentSlotCount + 1;
            int endSlotNumber = maxSlot;

            var newSlots = new List<Slot>();
            for (int i = startSlotNumber; i <= endSlotNumber; i++)
            {
                newSlots.Add(new Slot
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomId = classroom.Id,
                    SlotNumber = i.ToString(),
                    Title = $"Slot {i}",
                    Description = string.Empty,
                    CreatedDate = DateTime.UtcNow
                });
            }

            await _slotRepository.AddRangeAsync(newSlots);
            return newSlots
           .Select(s => _slotMapper.ToSlotResponse(s))
           .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating multiple slots for ClassroomId {ClassroomId}", classroomId);
            throw new InvalidOperationException("Error occurred while creating slots for class");
        }

    }


    public async Task<SlotResponse?> UpdateAnsync(SlotRequest slotRequest, string slotId)
    {
        try
        {
            var slot = await _slotRepository.FindByIdAsync(slotId);
            if (slot == null)
                return null;

            slot.Title = slotRequest.Title;
            slot.Description = slotRequest.Description;
            slot.UpdatedDate = DateTime.UtcNow;
            if (slotRequest.ExaminationIds != null)
                slot.ExaminationIds = slotRequest.ExaminationIds;

            await _slotRepository.UpdateAsync(slot);

            return _slotMapper.ToSlotResponse(slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error occurred while updating slot {SlotId}",
                slotId
            );
            throw;
        }
    }

    public async Task DeleteAsync(string slotId)
    {
        try
        {
            var slot = await _slotRepository.FindByIdAsync(slotId);
            if (slot == null)
                return;

            await _slotRepository.DeleteAsync(slotId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error occurred while deleting slot {SlotId}",
                slotId
            );
            throw;
        }
    }


}
