using AcasService.Application.Mappers;
using AcasService.Application.Queries.S3;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Material;
using AcasService.Messaging.User;
using AcasService.Application.Utils;
namespace AcasService.Application.Queries.Material;
public interface IMaterialQuery
{
    Task<MaterialResponse> GetMaterialByIdAsync(string materialId);
    Task<List<MaterialResponse>> GetMaterialsByClassroomIdAsync(string classroomId);
    Task<List<MaterialResponse>> GetAllMaterialsAsync();
    Task<PagedResult<MaterialResponse>> GetAdminMaterialsAsync(string? searchTerm, int pageIndex, int pageSize);
}

public class MaterialQuery : IMaterialQuery
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IPrivateS3Query _privateS3Query;
    private readonly MaterialMapper _materialMapper;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly ILogger<MaterialQuery> _logger;

    public MaterialQuery(
        IMaterialRepository materialRepository,
        IPrivateS3Query privateS3Query,
        MaterialMapper materialMapper,
        UserRequestProducer userRequestProducer,
        ILogger<MaterialQuery> logger)
    {
        _materialRepository = materialRepository;
        _privateS3Query = privateS3Query;
        _materialMapper = materialMapper;
        _userRequestProducer = userRequestProducer;
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

    public async Task<PagedResult<MaterialResponse>> GetAdminMaterialsAsync(string? searchTerm, int pageIndex, int pageSize)
    {
        try
        {
            var allMaterials = await _materialRepository.FindAllAsync();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                allMaterials = allMaterials
                    .Where(m => m.Filename.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                                m.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var totalCount = allMaterials.Count;

            var pagedMaterials = allMaterials
                .OrderByDescending(m => m.CreatedDate)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var lecturerIds = pagedMaterials.Select(m => m.LecturerId).Distinct().ToList();

            Task<List<UserProfileResponse>> userProfilesTask = _userRequestProducer.GetUsersByIdsAsync(lecturerIds);
            Task<Dictionary<string, string>> fileUrlsTask = _privateS3Query.GetFileUrlsAsync(pagedMaterials.Select(m => m.Filename));

            await Task.WhenAll(userProfilesTask, fileUrlsTask);

            var userById = userProfilesTask.Result.ToDictionary(u => u.Id);
            var fileUrls = fileUrlsTask.Result;

            var responses = pagedMaterials.Select(m =>
            {
                var user = userById.GetValueOrDefault(m.LecturerId);
                var resp = _materialMapper.ToMaterialResponse(m, user?.Fullname ?? "Unknown", user?.Email ?? "Unknown");
                resp.FileUrl = fileUrls.GetValueOrDefault(m.Filename) ?? string.Empty;
                return resp;
            }).ToList();

            return new PagedResult<MaterialResponse>(responses, totalCount, pageIndex, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin materials");
            throw;
        }
    }
}
