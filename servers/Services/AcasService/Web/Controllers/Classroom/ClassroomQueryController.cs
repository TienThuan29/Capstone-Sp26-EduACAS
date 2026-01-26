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
        public async Task<ActionResult<ApiResponse<PagedResult<ClassroomResponse>>>> GetAllClassrooms(
            [FromQuery] string userId, 
            [FromQuery] int pageIndex = 1, 
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var pagedResult = await _classroomQuery.GetAllClassroomsAsync(userId, pageIndex, pageSize);
                return ResponseUtil.Success(pagedResult, "Get all classrooms successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all classrooms.");
                return ResponseUtil.Error<PagedResult<ClassroomResponse>>("Internal Server Error", 500);
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
    

        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<ApiResponse<List<ClassroomResponse>>>> GetClassroomsByStudentId(string studentId)
        {
            try
            {
                _logger.LogInformation("Fetching classrooms for student id: {StudentId}", studentId);
                var classrooms = await _classroomQuery.FindByStudentIdAsync(studentId);
                return ResponseUtil.Success(classrooms, "Get classrooms for student successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "No classrooms found for student id: {StudentId}", studentId);
                return ResponseUtil.Error<List<ClassroomResponse>>("No classrooms found for the student", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms for student.");
                return ResponseUtil.Error<List<ClassroomResponse>>("Internal Server Error", 500);
            }
        }


        // [HttpGet("student/{studentId}/class/{classId}")]
        // public async Task<ActionResult<ApiResponse<ClassroomResponse>>> GetClassroomByStudentIdAndClassId(string studentId, string classId)
        // {
        //     try
        //     {
        //         _logger.LogInformation("Fetching classroom for student id: {StudentId} and class id: {ClassId}", studentId, classId);
        //         var classroom = await _classroomQuery.FindByStudentIdAndClassIdAsync(studentId, classId);
        //         return ResponseUtil.Success(classroom, "Get classroom for student successfully", 200);
        //     }
        //     catch (KeyNotFoundException ex)
        //     {
        //         _logger.LogWarning(ex, "Classroom not found for student id: {StudentId} and class id: {ClassId}", studentId, classId);
        //         return ResponseUtil.Error<ClassroomResponse>("Classroom not found for the student", 404);
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Error occurred while fetching classroom for student.");
        //         return ResponseUtil.Error<ClassroomResponse>("Internal Server Error", 500);
        //     }
        // }

        [HttpGet("lecturer/{lecturerId}")]
        public async Task<ActionResult<ApiResponse<PagedResult<ClassroomResponse>>>> GetClassroomsByLecturerId(
            string lecturerId,
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var classrooms = await _classroomQuery.GetClassroomsByLecturerIdAsync(lecturerId, pageIndex, pageSize);
                return ResponseUtil.Success(classrooms, "Get classrooms by lecturerId successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms by lecturerId.");
                return ResponseUtil.Error<PagedResult<ClassroomResponse>>("Internal Server Error", 500);
            }
        }
    }

}
