using Microsoft.AspNetCore.Mvc;
using AcasService.Application.Commands.Examination;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;

namespace AcasService.Web.Controllers.Examination;

[ApiController]
[Route("api/v1/examinations")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class ExaminationCommandController : ControllerBase
{
    private readonly ILogger<ExaminationCommandController> _logger;
    private readonly IExaminationCommand _examinationCommand;

    public ExaminationCommandController(
        ILogger<ExaminationCommandController> logger,
        IExaminationCommand examinationCommand)
    {
        _logger = logger;
        _examinationCommand = examinationCommand;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExaminationResponse>>> Create(
    [FromBody] ExaminationRequestDTO examDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdExam = await _examinationCommand.CreateAsync(examDto);
            return ResponseUtil.Success(createdExam,"Examination created successfully",201);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return ResponseUtil.Error<ExaminationResponse>("Examination already exists",409);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return ResponseUtil.Error<ExaminationResponse>("Related resource not found",400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating examination");
            return ResponseUtil.Error<ExaminationResponse>("Internal Server Error",500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExaminationResponse>>> Update(
        string id,
        [FromBody] ExaminationRequestDTO examDto)
    {
        try
        {
            var updatedExam = await _examinationCommand.UpdateAsync(id, examDto);

            if (updatedExam == null)
            {
                return ResponseUtil.Error<ExaminationResponse>("Examination not found",404);
            }

            return ResponseUtil.Success(updatedExam,"Examination updated successfully",200);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Update failed for examination {Id}", id);
            return ResponseUtil.Error<ExaminationResponse>(ex.Message, 500);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating examination {Id}", id);
            return ResponseUtil.Error<ExaminationResponse>("Internal Server Error",500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    {
        try
        {
            await _examinationCommand.DeleteAsync(id);

            return ResponseUtil.Success<object>(null,"Examination deleted successfully",204);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Delete failed for examination {Id}", id);
            return ResponseUtil.Error<object>(ex.Message,404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting examination {Id}", id);
            return ResponseUtil.Error<object>("Internal Server Error",500);
        }
    }
}
