using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Subject
{
    public interface ISubjectCommand
    {
        Task<SubjectResponse> CreateSubjectAsync(CreateSubjectRequest request);
        Task<SubjectResponse> UpdateSubjectAsync(string subjectId, UpdateSubjectRequest request);
        Task<SubjectResponse> SoftDeleteSubjectAsync(string subjectId);
        Task<SubjectResponse> DeleteSubjectAsync(string subjectId);
        Task<SubjectResponse> SoftDeleteSubjectAsync(string subjectId);
        Task<SubjectResponse> RestoreSubjectAsync(string subjectId);
        Task<BulkOperationResult> BulkSoftDeleteAsync(List<string> subjectIds);
        Task<BulkOperationResult> BulkRestoreAsync(List<string> subjectIds);
    }

    public class SubjectCommand : ISubjectCommand
    {
        private readonly ISubjectRepository _subjectRepository;
        private readonly SubjectMapper _subjectMapper;  
        private readonly ILogger<SubjectCommand> _logger;

        public SubjectCommand(
            ISubjectRepository subjectRepository,
            SubjectMapper subjectMapper,
            ILogger<SubjectCommand> logger
        )
        {
            _subjectRepository = subjectRepository;
            _subjectMapper = subjectMapper;
            _logger = logger;
        }

        public async Task<SubjectResponse> CreateSubjectAsync(CreateSubjectRequest request)
        {
            // Validate SubjectCode uniqueness
            var existingSubject = await _subjectRepository.GetBySubjectCodeAsync(request.SubjectCode);
            if (existingSubject != null)
            {
                throw new InvalidOperationException($"Subject with code '{request.SubjectCode}' already exists");
            }

            var newSubject = new Models.Subject
            {
                Id = Guid.NewGuid().ToString(),
                SubjectCode = request.SubjectCode,
                SubjectName = request.SubjectName,
                Description = request.Description,
                CreatedBy = request.CreatedBy,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = null
            };

            var createdSubject = await _subjectRepository.CreateAsync(newSubject);
            if (createdSubject == null)
            {
                throw new Exception("Failed to create subject");
            }

            return _subjectMapper.ToSubjectResponse(createdSubject);
        }

        public async Task<SubjectResponse> UpdateSubjectAsync(string subjectId, UpdateSubjectRequest request)
        {
            var existingSubject = await _subjectRepository.FindByIdAsync(subjectId);

            if (existingSubject == null)
            {
                throw new KeyNotFoundException($"Subject with id {subjectId} not found");
            }

            // Validate SubjectCode uniqueness (exclude current subject)
            var codeExists = await _subjectRepository.IsSubjectCodeExistsAsync(request.SubjectCode, subjectId);
            if (codeExists)
            {
                throw new InvalidOperationException($"Subject with code '{request.SubjectCode}' already exists");
            }

            // Cập nhật thủ công các trường
            existingSubject.SubjectCode = request.SubjectCode;
            existingSubject.SubjectName = request.SubjectName;
            existingSubject.Description = request.Description;
            existingSubject.UpdatedDate = DateTime.UtcNow;

            var result = await _subjectRepository.UpdateAsync(existingSubject);
            if (result == null)
                {
                throw new Exception("Failed to update subject");
            }

            return _subjectMapper.ToSubjectResponse(result);
        }

        public async Task<SubjectResponse> SoftDeleteSubjectAsync(string subjectId)
        {
            var existingSubject = await _subjectRepository.FindByIdAsync(subjectId);
            if (existingSubject == null)
            {
                _logger.LogError("Subject not found");
                throw new Exception("Subject not found");
            }
            await _subjectRepository.SoftDeleteAsync(subjectId);
            existingSubject.IsDeleted = true;
            existingSubject.UpdatedDate = DateTime.UtcNow;
            return _subjectMapper.ToSubjectResponse(existingSubject);
        }

        public async Task<SubjectResponse> DeleteSubjectAsync(string subjectId)
        {
            var existingSubject = await _subjectRepository.FindByIdAsync(subjectId);

            if (existingSubject == null)
            {
                throw new KeyNotFoundException($"Subject with id {subjectId} not found");
            }

            await _subjectRepository.DeleteAsync(subjectId);

            return _subjectMapper.ToSubjectResponse(existingSubject);
        }

        public async Task<SubjectResponse> SoftDeleteSubjectAsync(string subjectId)
        {
            try
            {
                var result = await _subjectRepository.SoftDeleteAsync(subjectId);
                if (result == null)
                {
                    throw new KeyNotFoundException($"Subject with id {subjectId} not found");
                }

                return _subjectMapper.ToSubjectResponse(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft deleting subject: {Id}", subjectId);
                throw;
            }
        }

        public async Task<SubjectResponse> RestoreSubjectAsync(string subjectId)
        {
            try
            {
                var result = await _subjectRepository.RestoreAsync(subjectId);
                if (result == null)
                {
                    throw new KeyNotFoundException($"Subject with id {subjectId} not found");
                }

                return _subjectMapper.ToSubjectResponse(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring subject: {Id}", subjectId);
                throw;
            }
        }

        public async Task<BulkOperationResult> BulkSoftDeleteAsync(List<string> subjectIds)
        {
            try
            {
                var successCount = await _subjectRepository.BulkSoftDeleteAsync(subjectIds);
                return new BulkOperationResult
                {
                    TotalRequested = subjectIds.Count,
                    SuccessCount = successCount,
                    FailedCount = subjectIds.Count - successCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk soft delete");
                throw;
            }
        }

        public async Task<BulkOperationResult> BulkRestoreAsync(List<string> subjectIds)
        {
            try
            {
                var successCount = await _subjectRepository.BulkRestoreAsync(subjectIds);
                return new BulkOperationResult
                {
                    TotalRequested = subjectIds.Count,
                    SuccessCount = successCount,
                    FailedCount = subjectIds.Count - successCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk restore");
                throw;
            }
        }
    }
}
