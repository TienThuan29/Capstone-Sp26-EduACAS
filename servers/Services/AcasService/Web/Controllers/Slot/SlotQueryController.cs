using AcasService.Application.Queries.Slot;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Slot;

[ApiController]
[Route("api/v1/slots")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class SlotQueryController : ControllerBase
{
    private readonly ISlotQuery _slotQuery;
    private readonly ILogger<SlotQueryController> _logger;

    public SlotQueryController(ISlotQuery slotQuery, ILogger<SlotQueryController> logger)
    {
        _slotQuery = slotQuery;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SlotResponse>>>> GetAllSlots()
    {
        try
        {
            var result = await _slotQuery.GetAllSlotsAsync();
            return ResponseUtil.Success(result, "Get all slots successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all slots");
            return ResponseUtil.Error<List<SlotResponse>>("Get all slots failed", 500);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SlotResponse>>> GetSlotById(string id)
    {
        try
        {
            var result = await _slotQuery.GetSlotByIdAsync(id);
            return ResponseUtil.Success(result, "Get slot successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Slot not found with id: {Id}", id);
            return ResponseUtil.Error<SlotResponse>("Slot not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slot by id");
            return ResponseUtil.Error<SlotResponse>("Get slot failed", 500);
        }
    }

    [HttpGet("classroom/{classroomId}")]
    public async Task<ActionResult<ApiResponse<List<SlotResponse>>>> GetSlotsByClassroomId(string classroomId)
    {
        try
        {
            var result = await _slotQuery.GetSlotsByClassroomIdAsync(classroomId);
            return ResponseUtil.Success(result, "Get slots by classroom successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slots by classroom id: {ClassroomId}", classroomId);
            return ResponseUtil.Error<List<SlotResponse>>("Get slots by classroom failed", 500);
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<SlotResponse>>>> SearchSlots([FromQuery] string keyword)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return ResponseUtil.Error<List<SlotResponse>>("Keyword is required", 400);
            }

            var result = await _slotQuery.SearchSlotsByKeywordAsync(keyword);
            return ResponseUtil.Success(result, "Search slots completed successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching slots");
            return ResponseUtil.Error<List<SlotResponse>>("Search slots failed", 500);
        }
    }
}
