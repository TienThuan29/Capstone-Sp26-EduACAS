using AcasService.Application.Commands.ClassroomQuiz;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.ClassroomQuiz;

[ApiController]
[Route("api/v1/classroom-quizzes")]
[Authorize(Roles = "LECTURER, ADMIN")]
public class ClassroomQuizCommandController : ControllerBase
{
    private readonly IClassroomQuizCommand _classroomQuizCommand;
    private readonly ILogger<ClassroomQuizCommandController> _logger;

    public ClassroomQuizCommandController(IClassroomQuizCommand classroomQuizCommand, ILogger<ClassroomQuizCommandController> logger)
    {
        _classroomQuizCommand = classroomQuizCommand;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ClassroomQuizResponse>>> CreateClassroomQuiz([FromBody] CreateClassroomQuizRequest request)
    {
        try
        {
            var result = await _classroomQuizCommand.CreateClassroomQuizAsync(request);
            return ResponseUtil.Success(result, "Create classroom quiz assignment successfully", 201);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error creating classroom quiz assignment");
            return ResponseUtil.Error<ClassroomQuizResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation creating classroom quiz assignment");
            return ResponseUtil.Error<ClassroomQuizResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating classroom quiz assignment");
            return ResponseUtil.Error<ClassroomQuizResponse>("Failed to create classroom quiz assignment", 500);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ClassroomQuizResponse>>> UpdateClassroomQuiz(string id, [FromBody] UpdateClassroomQuizRequest request)
    {
        try
        {
            var result = await _classroomQuizCommand.UpdateClassroomQuizAsync(id, request);
            return ResponseUtil.Success(result, "Classroom quiz assignment updated successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Classroom quiz assignment {id} not found for update");
            return ResponseUtil.Error<ClassroomQuizResponse>("Classroom quiz assignment not found", 404);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, $"Validation error updating classroom quiz assignment {id}");
            return ResponseUtil.Error<ClassroomQuizResponse>(ex.Message, 400);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid update operation for classroom quiz assignment {id}");
            return ResponseUtil.Error<ClassroomQuizResponse>(ex.Message, 400);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating classroom quiz assignment {id}");
            return ResponseUtil.Error<ClassroomQuizResponse>("Failed to update classroom quiz assignment", 500);
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult<ApiResponse<bool>>> SoftDeleteClassroomQuiz(string id)
    {
        try
        {
            await _classroomQuizCommand.SoftDeleteClassroomQuizAsync(id);
            return ResponseUtil.Success(true, "Classroom quiz assignment soft-deleted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Classroom quiz assignment {id} not found for soft delete");
            return ResponseUtil.Error<bool>("Classroom quiz assignment not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error soft deleting classroom quiz assignment {id}");
            return ResponseUtil.Error<bool>("Failed to soft delete classroom quiz assignment", 500);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteClassroomQuiz(string id)
    {
        try
        {
            await _classroomQuizCommand.DeleteClassroomQuizAsync(id);
            return ResponseUtil.Success(true, "Classroom quiz assignment deleted successfully", 200);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, $"Classroom quiz assignment {id} not found for deletion");
            return ResponseUtil.Error<bool>("Classroom quiz assignment not found", 404);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting classroom quiz assignment {id}");
            return ResponseUtil.Error<bool>("Failed to delete classroom quiz assignment", 500);
        }
    }
}
