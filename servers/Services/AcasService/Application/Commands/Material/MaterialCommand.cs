using AcasService.Application.Commands.S3;
using AcasService.Application.Commands.Notification;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.S3;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Material;
using AcasService.Repositories.Classroom;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Material
{
    public interface IMaterialCommand
    {
        Task<MaterialResponse> CreateMaterialAsync(CreateMaterialRequest request);
        Task<MaterialResponse> UpdateMaterialAsync(string materialId, UpdateMaterialRequest request);
        Task<MaterialResponse> DeleteMaterialAsync(string materialId);
        Task<MaterialResponse> SoftDeleteMaterialAsync(string materialId);
    }

    public class MaterialCommand : IMaterialCommand
    {
        private readonly IMaterialRepository _materialRepository;
        private readonly IClassroomRepository _classroomRepository;
        private readonly IPrivateS3Command _privateS3Command;
        private readonly IPrivateS3Query _privateS3Query;
        private readonly IBusinessNotificationService _businessNotificationService;
        private readonly MaterialMapper _materialMapper;
        private readonly ILogger<MaterialCommand> _logger;

        public MaterialCommand(
            IMaterialRepository materialRepository,
            IClassroomRepository classroomRepository,
            IPrivateS3Command privateS3Command,
            IPrivateS3Query privateS3Query,
            IBusinessNotificationService businessNotificationService,
            MaterialMapper materialMapper,
            ILogger<MaterialCommand> logger)
        {
            _materialRepository = materialRepository;
            _classroomRepository = classroomRepository;
            _privateS3Command = privateS3Command;
            _privateS3Query = privateS3Query;
            _businessNotificationService = businessNotificationService;
            _materialMapper = materialMapper;
            _logger = logger;
        }

        public async Task<MaterialResponse> CreateMaterialAsync(CreateMaterialRequest request)
        {
            // Verify classroom exists
            var classroom = await _classroomRepository.FindByIdAsync(request.ClassroomId);
            if (classroom == null)
            {
                _logger.LogError("Classroom not found with ID: {ClassroomId}", request.ClassroomId);
                throw new KeyNotFoundException("Classroom not found");
            }

            // Upload file to S3
            string uploadedFileName;
            try
            {
                using var memoryStream = new MemoryStream();
                await request.File.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                
                uploadedFileName = await _privateS3Command.UploadFilesAsync(
                    fileBytes, 
                    request.File.FileName, 
                    request.File.ContentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to S3");
                throw new Exception("Failed to upload file to S3", ex);
            }

            // Generate signed URL for the uploaded file
            var signedUrl = await _privateS3Query.GetFileUrlAsync(uploadedFileName);

            // Create material record
            var newMaterial = new Models.Material
            {
                Id = Guid.NewGuid().ToString(),
                LecturerId = request.LecturerId,
                ClassroomId = request.ClassroomId,
                Filename = uploadedFileName,
                FileUrl = signedUrl,
                Description = request.Description,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow
            };

            var createdMaterial = await _materialRepository.CreateAsync(newMaterial);
            if (createdMaterial == null)
            {
                _logger.LogError("Failed to create material");
                // Clean up uploaded file
                await _privateS3Command.DeleteFilesAsync(uploadedFileName);
                throw new Exception("Failed to create material");
            }

            await _businessNotificationService.NotifyClassroomAsync(
                createdMaterial.ClassroomId,
                NotificationType.NEW_MATERIAL,
                "New material uploaded",
                "A new study material has been uploaded to your classroom.",
                payload: new Dictionary<string, object?>
                {
                    ["materialId"] = createdMaterial.Id,
                    ["classroomId"] = createdMaterial.ClassroomId,
                    ["lecturerId"] = createdMaterial.LecturerId,
                    ["fileName"] = createdMaterial.Filename
                }
            );

            return _materialMapper.ToMaterialResponse(createdMaterial);
        }

        public async Task<MaterialResponse> UpdateMaterialAsync(string materialId, UpdateMaterialRequest request)
        {
            var existingMaterial = await _materialRepository.FindByIdAsync(materialId);
            if (existingMaterial == null)
            {
                _logger.LogError("Material not found with ID: {MaterialId}", materialId);
                throw new KeyNotFoundException("Material not found");
            }

            existingMaterial.Description = request.Description;

            var updatedMaterial = await _materialRepository.UpdateAsync(existingMaterial);
            if (updatedMaterial == null)
            {
                _logger.LogError("Failed to update material");
                throw new Exception("Failed to update material");
            }

            return _materialMapper.ToMaterialResponse(updatedMaterial);
        }

        public async Task<MaterialResponse> SoftDeleteMaterialAsync(string materialId)
        {
            var existingMaterial = await _materialRepository.FindByIdAsync(materialId);
            if (existingMaterial == null)
            {
                _logger.LogError("Material not found with ID: {MaterialId}", materialId);
                throw new KeyNotFoundException("Material not found");
            }

            await _materialRepository.SoftDeleteAsync(materialId);
            
            existingMaterial.IsDeleted = true;
            return _materialMapper.ToMaterialResponse(existingMaterial);
        }

        public async Task<MaterialResponse> DeleteMaterialAsync(string materialId)
        {
            var existingMaterial = await _materialRepository.FindByIdAsync(materialId);
            if (existingMaterial == null)
            {
                _logger.LogError("Material not found with ID: {MaterialId}", materialId);
                throw new KeyNotFoundException("Material not found");
            }

            // Delete file from S3
            try
            {
                await _privateS3Command.DeleteFilesAsync(existingMaterial.Filename);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete file from S3: {Filename}", existingMaterial.Filename);
                // Continue with material deletion even if S3 deletion fails
            }

            await _materialRepository.DeleteAsync(materialId);
            return _materialMapper.ToMaterialResponse(existingMaterial);
        }
    }
}
