using AcasService.Application.Commands.Subject;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Subject;

[ApiController]
[Route("api/v1/subjects")]
[Authorize(Roles =  "ADMIN")]
public class SubjectCommandController : ControllerBase
{
    private readonly ISubjectCommand _subjectCommand;
    private readonly ILogger<SubjectCommandController> _logger;

    public SubjectCommandController(ISubjectCommand subjectCommand, ILogger<SubjectCommandController> logger)
    {
        _subjectCommand = subjectCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SubjectResponse>>> CreateSubject([FromBody] CreateSubjectRequest request)
    {
        try
        {
            var result = await _subjectCommand.CreateSubjectAsync(request);
            return ResponseUtil.Success(result, "Subject created successfully", 201); 
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Subject code already exists");
            return ResponseUtil.Error<SubjectResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subject");
            return ResponseUtil.Error<SubjectResponse>("Failed to create new subject",500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<SubjectResponse>>> UpdateSubject(string id, [FromBody] UpdateSubjectRequest request)
    {
        try
        {
            var result = await _subjectCommand.UpdateSubjectAsync(id, request);
            return ResponseUtil.Success(result, "Subject updated successfully",200);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Subject code already exists");
            return ResponseUtil.Error<SubjectResponse>(ex.Message, 400);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Subject not found for update");
            return ResponseUtil.Error<SubjectResponse>("Subject not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subject");
            return ResponseUtil.Error<SubjectResponse>("Failed to update subject", 500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSubject(string id)
    {
        try
        {
            var result = await _subjectCommand.DeleteSubjectAsync(id);
            return ResponseUtil.Success(result!=null, "Subject deleted successfully",200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Subject not found for delete");
            return ResponseUtil.Error<bool>("Subject not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subject");
            return ResponseUtil.Error<bool>("Failed to delete subject", 500);
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<SubjectResponse>>> SoftDeleteSubject(string id)
    {
        try
        {
            var result = await _subjectCommand.SoftDeleteSubjectAsync(id);
            return ResponseUtil.Success(result, "Subject soft deleted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Subject not found for soft delete");
            return ResponseUtil.Error<SubjectResponse>("Subject not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error soft deleting subject");
            return ResponseUtil.Error<SubjectResponse>("Failed to soft delete subject", 500);
        }
    }

    [HttpPatch("{id}/restore")]
    public async Task<ActionResult<ApiResponse<SubjectResponse>>> RestoreSubject(string id)
    {
        try
        {
            var result = await _subjectCommand.RestoreSubjectAsync(id);
            return ResponseUtil.Success(result, "Subject restored successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Subject not found for restore");
            return ResponseUtil.Error<SubjectResponse>("Subject not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring subject");
            return ResponseUtil.Error<SubjectResponse>("Failed to restore subject", 500);
        }
    }

    [HttpPost("bulk/soft-delete")]
    public async Task<ActionResult<ApiResponse<BulkOperationResult>>> BulkSoftDelete([FromBody] BulkSubjectOperationRequest request)
    {
        try
        {
            var result = await _subjectCommand.BulkSoftDeleteAsync(request.SubjectIds);
            return ResponseUtil.Success(result, "Bulk soft delete completed", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk soft delete");
            return ResponseUtil.Error<BulkOperationResult>("Failed to bulk soft delete subjects", 500);
        }
    }

    [HttpPost("bulk/restore")]
    public async Task<ActionResult<ApiResponse<BulkOperationResult>>> BulkRestore([FromBody] BulkSubjectOperationRequest request)
    {
        try
        {
            var result = await _subjectCommand.BulkRestoreAsync(request.SubjectIds);
            return ResponseUtil.Success(result, "Bulk restore completed", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in bulk restore");
            return ResponseUtil.Error<BulkOperationResult>("Failed to bulk restore subjects", 500);
        }
    }
}
