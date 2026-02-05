using AcasService.Application.Commands.SlotCommand;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests.SlotRequest;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;


namespace AcasService.Web.Controllers.Slot;

[ApiController]
[Route("api/v1/slots")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class SlotCommandController : ControllerBase
{
    private readonly ISlotCommand _slotCommand;
    private readonly ILogger<SlotCommandController> _logger;

    public SlotCommandController(
        ISlotCommand slotCommand,
        ILogger<SlotCommandController> logger)
    {
        _slotCommand = slotCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SlotResponse>>> CreateSlot(
        [FromBody] SlotRequest slotRequest)
    {
        try
        {
            var result = await _slotCommand.CreateAnsync(slotRequest);

            _logger.LogInformation("Slot created successfully for ClassroomId {ClassroomId}",slotRequest.ClassroomId);
            return ResponseUtil.Success(result,"Create slot successfully",201);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex.Message);
            return ResponseUtil.Error<SlotResponse>(ex.Message, 404);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex.Message);
            return ResponseUtil.Error<SlotResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,"Error occurred while creating slot for ClassroomId {ClassroomId}",slotRequest.ClassroomId);
            return ResponseUtil.Error<SlotResponse>("Create slot failed",500);
        }
    }


    [HttpPost("create-all-slots/{classroomId}")]
    public async Task<ActionResult<ApiResponse<List<SlotResponse>>>> InitSlots(
        [FromRoute] string classroomId)
    {
        try
        {
            var result = await _slotCommand.CreateMultiAnsync(classroomId);

            _logger.LogInformation("Slots initialized successfully for ClassroomId {ClassroomId}",classroomId);

            return ResponseUtil.Success(result,"Initialize slots successfully",201);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex.Message);
            return ResponseUtil.Error<List<SlotResponse>>(ex.Message, 404);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex.Message);
            return ResponseUtil.Error<List<SlotResponse>>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,"Error occurred while initializing slots for ClassroomId {ClassroomId}",classroomId);
            return ResponseUtil.Error<List<SlotResponse>>("Initialize slots failed",500);
        }
    }


    [HttpPut("{slotId}")]
    public async Task<ActionResult<ApiResponse<SlotResponse>>> UpdateSlot(string slotId, [FromBody] SlotRequest slotRequest)
    {
        try
        {
            var result = await _slotCommand.UpdateAnsync(slotRequest, slotId);
            if (result == null)
            {
                _logger.LogWarning("Update slot failed. Slot not found with id: {SlotId}", slotId);
                return ResponseUtil.Error<SlotResponse>("Slot not found", 404);
            }
            _logger.LogInformation("Slot updated successfully with id: {SlotId}", slotId);
            return ResponseUtil.Success(result, "Update slot successfully", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating slot {SlotId}", slotId);
            return ResponseUtil.Error<SlotResponse>("Update slot failed", 500);
        }
    }

    [HttpDelete("{slotId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSlot(string slotId)
    {
        try
        {
            await _slotCommand.DeleteAsync(slotId);
            _logger.LogInformation("Slot deleted successfully with id: {SlotId}", slotId);
            return ResponseUtil.Success<object>(null, "Delete slot successfully", 204);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting slot {SlotId}", slotId);
            return ResponseUtil.Error<object>("Delete slot failed", 500);
        }
    }

}