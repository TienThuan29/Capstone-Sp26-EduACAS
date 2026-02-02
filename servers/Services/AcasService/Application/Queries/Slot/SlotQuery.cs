using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Slot;

namespace AcasService.Application.Queries.Slot;

public interface ISlotQuery
{
    Task<SlotResponse> GetSlotByIdAsync(string slotId);
    Task<List<SlotResponse>> GetAllSlotsAsync();
    Task<List<SlotResponse>> GetSlotsByClassroomIdAsync(string classroomId);
    Task<List<SlotResponse>> SearchSlotsByKeywordAsync(string keyword);
}

public class SlotQuery : ISlotQuery
{
    private readonly ISlotRepository _slotRepository;
    private readonly SlotMapper _slotMapper;
    private readonly ILogger<SlotQuery> _logger;

    public SlotQuery(
        ISlotRepository slotRepository,
        SlotMapper slotMapper,
        ILogger<SlotQuery> logger
    )
    {
        _slotRepository = slotRepository;
        _slotMapper = slotMapper;
        _logger = logger;
    }

    public async Task<SlotResponse> GetSlotByIdAsync(string slotId)
    {
        try
        {
            var slot = await _slotRepository.FindByIdAsync(slotId);
            
            if (slot == null)
            {
                _logger.LogWarning("Slot not found with id: {Id}", slotId);
                throw new KeyNotFoundException($"Slot with id {slotId} not found.");
            }

            return _slotMapper.ToSlotResponse(slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slot by id: {Id}", slotId);
            throw;
        }
    }

    public async Task<List<SlotResponse>> GetAllSlotsAsync()
    {
        try
        {
            var slots = await _slotRepository.FindAllAsync();
            return slots.Select(s => _slotMapper.ToSlotResponse(s)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all slots");
            throw;
        }
    }

    public async Task<List<SlotResponse>> GetSlotsByClassroomIdAsync(string classroomId)
    {
        try
        {
            var slots = await _slotRepository.GetSlotsByClassroomIdAsync(classroomId);
            return slots.Select(s => _slotMapper.ToSlotResponse(s)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slots by classroom id: {ClassroomId}", classroomId);
            throw;
        }
    }

    public async Task<List<SlotResponse>> SearchSlotsByKeywordAsync(string keyword)
    {
        try
        {
            var slots = await _slotRepository.GetSlotsByKeywordAsync(keyword);
            return slots.Select(s => _slotMapper.ToSlotResponse(s)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching slots by keyword: {Keyword}", keyword);
            throw;
        }
    }
}
