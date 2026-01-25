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
    }
}
