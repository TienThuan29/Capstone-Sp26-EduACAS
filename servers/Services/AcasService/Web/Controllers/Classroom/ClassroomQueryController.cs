using AcasService.Application.Queries.Classroom;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Classroom
{
    [ApiController]
    [Route("api/v1/classrooms")]
    public class ClassroomQueryController : ControllerBase
    {
        private readonly ILogger<ClassroomQueryController> _logger;
        private readonly IClassroomQuery _classroomQuery;
        public ClassroomQueryController(ILogger<ClassroomQueryController> logger, IClassroomQuery classroomQuery)
        {
            _logger = logger;
            _classroomQuery = classroomQuery;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> GetAllClassrooms()
        {
            try
            {
                var classrooms = await _classroomQuery.GetAllClassroomsAsync();
                return ResponseUtil.Success(classrooms, "Get all classrooms successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all classrooms.");
                return ResponseUtil.Error<ClassroomResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> GetClassroomById(string id)
        {
            try
            {
                var classroom = await _classroomQuery.GetClassroomByIdAsync(id);
                return ResponseUtil.Success(classroom, "Get classroom successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Classroom not found with id: {Id}", id);
                return ResponseUtil.Error<ClassroomResponse>("Classroom not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classroom by id.");
                return ResponseUtil.Error<ClassroomResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet]
        [Route("search")]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> SearchClassrooms([FromBody] SearchClassroomRequest request)
        {
            try
            {
                var classrooms = await _classroomQuery.GetClassroomsByKeywordAsync(request);
                return ResponseUtil.Success(classrooms, "Search classrooms successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching classrooms.");
                return ResponseUtil.Error<ClassroomResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("lecturer/{lecturerId}")]
        public async Task<ActionResult<ApiResponse<ClassroomResponse>>> GetClassroomsByLecturerId(string lecturerId)
        {
            try
            {
                var classrooms = await _classroomQuery.GetClassroomsByLecturerIdAsync(lecturerId);
                return ResponseUtil.Success(classrooms, "Get classrooms by lecturerId successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms by lecturerId.");
                return ResponseUtil.Error<ClassroomResponse>("Internal Server Error", 500);
            }
        }
    }

}
