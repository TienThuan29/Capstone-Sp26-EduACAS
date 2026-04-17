using AcasService.Application.Queries.Material;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Material
{
    [ApiController]
    [Route("api/v1/materials")]
    [Authorize]
    public class MaterialQueryController : ControllerBase
    {
        private readonly ILogger<MaterialQueryController> _logger;
        private readonly IMaterialQuery _materialQuery;

        public MaterialQueryController(
            ILogger<MaterialQueryController> logger,
            IMaterialQuery materialQuery)
        {
            _logger = logger;
            _materialQuery = materialQuery;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<MaterialResponse>>>> GetAllMaterials()
        {
            try
            {
                var materials = await _materialQuery.GetAllMaterialsAsync();
                return ResponseUtil.Success(materials, "Get all materials successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all materials");
                return ResponseUtil.Error<List<MaterialResponse>>("Internal Server Error", 500);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<MaterialResponse>>> GetMaterialById(string id)
        {
            try
            {
                var material = await _materialQuery.GetMaterialByIdAsync(id);
                return ResponseUtil.Success(material, "Get material successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Material not found with id: {Id}", id);
                return ResponseUtil.Error<MaterialResponse>("Material not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching material by id");
                return ResponseUtil.Error<MaterialResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("classroom/{classroomId}")]
        public async Task<ActionResult<ApiResponse<List<MaterialResponse>>>> GetMaterialsByClassroomId(string classroomId)
        {
            try
            {
                var materials = await _materialQuery.GetMaterialsByClassroomIdAsync(classroomId);
                return ResponseUtil.Success(materials, "Get materials successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching materials for classroom");
                return ResponseUtil.Error<List<MaterialResponse>>("Internal Server Error", 500);
            }
        }

        [HttpGet("admin")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<ApiResponse<PagedResult<MaterialResponse>>>> GetAdminMaterials(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _materialQuery.GetAdminMaterialsAsync(searchTerm, pageIndex, pageSize);
                return ResponseUtil.Success(result, "Get admin materials successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching materials for admin");
                return ResponseUtil.Error<PagedResult<MaterialResponse>>("Internal Server Error", 500);
            }
        }
    }
}
