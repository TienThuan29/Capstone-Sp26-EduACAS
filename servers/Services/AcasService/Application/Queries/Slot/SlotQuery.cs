using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Examination;
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
    private readonly IExaminationRepository _examinationRepository;
    private readonly SlotMapper _slotMapper;
    private readonly ExaminationMapper _examinationMapper;
    private readonly ILogger<SlotQuery> _logger;

    public SlotQuery(
        ISlotRepository slotRepository,
        IExaminationRepository examinationRepository,
        SlotMapper slotMapper,
        ExaminationMapper examinationMapper,
        ILogger<SlotQuery> logger
    )
    {
        _slotRepository = slotRepository;
        _examinationRepository = examinationRepository;
        _slotMapper = slotMapper;
        _examinationMapper = examinationMapper;
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

            var examinations = await _examinationRepository.GetByIdsAsync(slot.ExaminationIds);
            var examinationResponses = examinations.Select(_examinationMapper.ToExaminationBasicResponse).ToList();
            return _slotMapper.ToSlotResponse(slot, examinationResponses);
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
            return await MapSlotsWithExaminationsAsync(slots.ToList());
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
            return await MapSlotsWithExaminationsAsync(slots.ToList());
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
            return await MapSlotsWithExaminationsAsync(slots.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching slots by keyword: {Keyword}", keyword);
            throw;
        }
    }

    private async Task<List<SlotResponse>> MapSlotsWithExaminationsAsync(List<Models.Slot> slots)
    {
        var result = new List<SlotResponse>();
        foreach (var slot in slots)
        {
            var examinations = await _examinationRepository.GetByIdsAsync(slot.ExaminationIds ?? new List<string>());
            var examinationResponses = examinations.Select(_examinationMapper.ToExaminationBasicResponse).ToList();
            result.Add(_slotMapper.ToSlotResponse(slot, examinationResponses));
        }
        return result;
    }
}
