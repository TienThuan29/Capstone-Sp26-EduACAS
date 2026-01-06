using AcasService.Application.Commands.Classroom;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Classroom
{
    [ApiController]
    [Route("api/v1/classrooms")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public class ClassroomCommandController : ControllerBase
    {
        private readonly ILogger<ClassroomCommandController> _logger;
        private readonly IClassroomCommand _classroomCommand;

        public ClassroomCommandController(ILogger<ClassroomCommandController> logger, IClassroomCommand classroomCommand)
        {
            _logger = logger;
            _classroomCommand = classroomCommand;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> CreateClassroom([FromBody] Web.Requests.CreateClassroomRequest request)
        {
            try
            {
                var result = await _classroomCommand.CreateClassroomAsync(request);
                return ResponseUtil.Success(result, "Create new classroom successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating classroom");
                return ResponseUtil.Error<ClassroomResponse>("Failed to create new classroom", 500);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> UpdateClassroom(string id, [FromBody] Web.Requests.UpdateClassroomRequest request)
        {
            try
            {
                var result = await _classroomCommand.UpdateClassroomAsync(id, request);
                return ResponseUtil.Success(result, "Classroom updated successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Classroom not found for update");
                return ResponseUtil.Error<ClassroomResponse>("Classroom not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating classroom");
                return ResponseUtil.Error<ClassroomResponse>("Failed to update classroom", 500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteClassroom(string id)
        {
            try
            {
                var result = await _classroomCommand.DeleteClassroomAsync(id);
                return ResponseUtil.Success(result != null, "Classroom deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Classroom not found for deletion");
                return ResponseUtil.Error<bool>("Classroom not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting classroom");
                return ResponseUtil.Error<bool>("Failed to delete classroom", 500);
            }
        }
    }
}
