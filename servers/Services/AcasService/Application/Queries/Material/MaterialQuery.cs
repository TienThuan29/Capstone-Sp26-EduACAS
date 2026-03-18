using AcasService.Application.Mappers;
using AcasService.Application.Queries.S3;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Material;

namespace AcasService.Application.Queries.Material
{
    public interface IMaterialQuery
    {
        Task<MaterialResponse> GetMaterialByIdAsync(string materialId);
        Task<List<MaterialResponse>> GetMaterialsByClassroomIdAsync(string classroomId);
        Task<List<MaterialResponse>> GetAllMaterialsAsync();
    }

    public class MaterialQuery : IMaterialQuery
    {
        private readonly IMaterialRepository _materialRepository;
        private readonly IPrivateS3Query _privateS3Query;
        private readonly MaterialMapper _materialMapper;
        private readonly ILogger<MaterialQuery> _logger;

        public MaterialQuery(
            IMaterialRepository materialRepository,
            IPrivateS3Query privateS3Query,
            MaterialMapper materialMapper,
            ILogger<MaterialQuery> logger)
        {
            _materialRepository = materialRepository;
            _privateS3Query = privateS3Query;
            _materialMapper = materialMapper;
            _logger = logger;
        }

        public async Task<MaterialResponse> GetMaterialByIdAsync(string materialId)
        {
            try
            {
                var material = await _materialRepository.FindByIdAsync(materialId);
                if (material == null)
                {
                    _logger.LogError("Material not found with ID: {MaterialId}", materialId);
                    throw new KeyNotFoundException("Material not found");
                }

                // Regenerate signed URL to ensure it's valid
                material.FileUrl = await _privateS3Query.GetFileUrlAsync(material.Filename);

                return _materialMapper.ToMaterialResponse(material);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting material by ID: {MaterialId}", materialId);
                throw;
            }
        }

        public async Task<List<MaterialResponse>> GetMaterialsByClassroomIdAsync(string classroomId)
        {
            try
            {
                var materials = await _materialRepository.FindByClassroomIdAsync(classroomId);
                var fileUrls = await _privateS3Query.GetFileUrlsAsync(materials.Select(m => m.Filename));
                foreach (var material in materials)
                {
                    material.FileUrl = fileUrls.GetValueOrDefault(material.Filename) ?? string.Empty;
                }
                return materials.Select(_materialMapper.ToMaterialResponse).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting materials for classroom: {ClassroomId}", classroomId);
                throw;
            }
        }

        public async Task<List<MaterialResponse>> GetAllMaterialsAsync()
        {
            try
            {
                var materials = await _materialRepository.FindAllAsync();
                var fileUrls = await _privateS3Query.GetFileUrlsAsync(materials.Select(m => m.Filename));
                foreach (var material in materials)
                {
                    material.FileUrl = fileUrls.GetValueOrDefault(material.Filename) ?? string.Empty;
                }
                return materials.Select(_materialMapper.ToMaterialResponse).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all materials");
                throw;
            }
        }
    }
}
