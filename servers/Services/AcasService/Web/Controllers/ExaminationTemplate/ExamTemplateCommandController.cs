using Microsoft.AspNetCore.Mvc;
using AcasService.Application.Commands.ExaminationTemplate;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;

namespace AcasService.Web.Controllers.ExaminationTemplate;

[ApiController]
[Route("api/v1/examination-templates")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class ExamTemplateCommandController : ControllerBase
{
    private readonly ILogger<ExamTemplateCommandController> _logger;
    private readonly IExaminationTemplateCommand _examinationTemplateCommand;

    public ExamTemplateCommandController(
        ILogger<ExamTemplateCommandController> logger,
        IExaminationTemplateCommand examinationTemplateCommand)
    {
        _logger = logger;
        _examinationTemplateCommand = examinationTemplateCommand;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExaminationTemplateResponse>>> Create(
        [FromBody] ExaminationTemplateRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _examinationTemplateCommand.CreateAsync(request);
            return ResponseUtil.Success(created, "Examination template created successfully", 201);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Related resource not found while creating examination template");
            return ResponseUtil.Error<ExaminationTemplateResponse>("Related resource not found", 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating examination template");
            return ResponseUtil.Error<ExaminationTemplateResponse>("Internal Server Error", 500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExaminationTemplateResponse>>> Update(
        string id,
        [FromBody] UpdateExaminationTemplateRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _examinationTemplateCommand.UpdateAsync(id, request);
            if (updated == null)
            {
                return ResponseUtil.Error<ExaminationTemplateResponse>("Examination template not found", 404);
            }
            return ResponseUtil.Success(updated, "Examination template updated successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Examination template not found: {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating examination template {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>("Internal Server Error", 500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    {
        try
        {
            await _examinationTemplateCommand.DeleteAsync(id);
            return ResponseUtil.Success<object>(null, "Examination template deleted successfully", 204);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Examination template not found: {Id}", id);
            return ResponseUtil.Error<object>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting examination template {Id}", id);
            return ResponseUtil.Error<object>("Internal Server Error", 500);
        }
    }

    [HttpPut("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<ExaminationTemplateResponse>>> SoftDelete(string id)
    {
        try
        {
            var result = await _examinationTemplateCommand.SoftDeleteAsync(id);
            if (result == null)
            {
                return ResponseUtil.Error<ExaminationTemplateResponse>("Examination template not found", 404);
            }
            return ResponseUtil.Success(result, "Examination template soft-deleted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Examination template not found: {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft-deleting examination template {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>("Internal Server Error", 500);
        }
    }

    [HttpPut("{id}/restore")]
    public async Task<ActionResult<ApiResponse<ExaminationTemplateResponse>>> Restore(string id)
    {
        try
        {
            var result = await _examinationTemplateCommand.RestoreAsync(id);
            if (result == null)
            {
                return ResponseUtil.Error<ExaminationTemplateResponse>("Examination template not found", 404);
            }
            return ResponseUtil.Success(result, "Examination template restored successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Examination template not found: {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>(ex.Message, 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring examination template {Id}", id);
            return ResponseUtil.Error<ExaminationTemplateResponse>("Internal Server Error", 500);
        }
    }
}
