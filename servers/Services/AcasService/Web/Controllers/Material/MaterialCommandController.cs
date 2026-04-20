using AcasService.Application.Commands.Material;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.Material
{
    [ApiController]
    [Route("api/v1/materials")]
    [Authorize(Roles = "LECTURER, ADMIN")]
    public class MaterialCommandController : ControllerBase
    {
        private readonly ILogger<MaterialCommandController> _logger;
        private readonly IMaterialCommand _materialCommand;

        public MaterialCommandController(
            ILogger<MaterialCommandController> logger,
            IMaterialCommand materialCommand)
        {
            _logger = logger;
            _materialCommand = materialCommand;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<MaterialResponse>>> CreateMaterial([FromForm] CreateMaterialRequest request)
        {
            try
            {
                var result = await _materialCommand.CreateMaterialAsync(request);
                return ResponseUtil.Success(result, "Material uploaded successfully", 201);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Classroom not found");
                return ResponseUtil.Error<MaterialResponse>("Classroom not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading material");
                return ResponseUtil.Error<MaterialResponse>("Failed to upload material", 500);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<MaterialResponse>>> UpdateMaterial(
            string id,
            [FromBody] UpdateMaterialRequest request)
        {
            try
            {
                var result = await _materialCommand.UpdateMaterialAsync(id, request);
                return ResponseUtil.Success(result, "Material updated successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Material not found for update");
                return ResponseUtil.Error<MaterialResponse>("Material not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating material");
                return ResponseUtil.Error<MaterialResponse>("Failed to update material", 500);
            }
        }

        [HttpPatch("{id}/soft-delete")]
        public async Task<ActionResult<ApiResponse<bool>>> SoftDeleteMaterial(string id)
        {
            try
            {
                var result = await _materialCommand.SoftDeleteMaterialAsync(id);
                return ResponseUtil.Success(result != null, "Material soft-deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Material not found for soft deletion");
                return ResponseUtil.Error<bool>("Material not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting material");
                return ResponseUtil.Error<bool>("Failed to soft delete material", 500);
            }
        }

        [HttpPatch("{id}/restore")]
        public async Task<ActionResult<ApiResponse<bool>>> RestoreMaterial(string id)
        {
            try
            {
                var result = await _materialCommand.RestoreMaterialAsync(id);
                return ResponseUtil.Success(result != null, "Material restored successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Material not found for restore");
                return ResponseUtil.Error<bool>("Material not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring material");
                return ResponseUtil.Error<bool>("Failed to restore material", 500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteMaterial(string id)
        {
            try
            {
                var result = await _materialCommand.DeleteMaterialAsync(id);
                return ResponseUtil.Success(result != null, "Material deleted successfully", 200);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Material not found for deletion");
                return ResponseUtil.Error<bool>("Material not found", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting material");
                return ResponseUtil.Error<bool>("Failed to delete material", 500);
            }
        }
    }
}
