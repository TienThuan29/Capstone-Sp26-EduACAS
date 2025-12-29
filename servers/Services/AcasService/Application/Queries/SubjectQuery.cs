using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Subject;

namespace AcasService.Application.Queries
{
   public interface ISubjectQuery
   {

        Task<SubjectResponse> GetSubjectByIdAsync(string subjectId);
        Task<List<SubjectResponse>> GetAllSubjectsAsync();
    }

    public class SubjectQuery : ISubjectQuery
    {
        // 1. Khai báo công cụ cần thiết
        private readonly ISubjectRepository _subjectRepository;
        private readonly SubjectMapper _subjectMapper;
        private readonly ILogger<SubjectQuery> _logger; // Log lỗi cho dễ sửa

        // 2. Nhận công cụ qua Constructor (Dependency Injection)
        public SubjectQuery(
            ISubjectRepository subjectRepository,
            SubjectMapper subjectMapper,
            ILogger<SubjectQuery> logger
        )
        {
            _subjectRepository = subjectRepository;
            _subjectMapper = subjectMapper;
            _logger = logger;
        }

        // Hàm 1: Lấy môn học theo ID
        public async Task<SubjectResponse> GetSubjectByIdAsync(string subjectId)
        {
            try
            {
                var subject = await _subjectRepository.FindByIdAsync(subjectId);
                
                if (subject == null) {
                    _logger.LogWarning("Subject not found with id: {Id}", subjectId);
                    throw new KeyNotFoundException($"Subject with id {subjectId} not found.");
                }

                // Mapper đã handle vụ null rồi, cứ truyền vào
                return _subjectMapper.ToSubjectResponse(subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subject by id: {Id}", subjectId);
                throw; // Ném lỗi ra để Controller biết đường trả về 500
            }
        }

        // Hàm 2: Lấy tất cả môn học
        public async Task<List<SubjectResponse>> GetAllSubjectsAsync()
        {
            try
            {
                var subjects = await _subjectRepository.FindAllAsync();

                // Dùng LINQ để map từng cái một
                return subjects.Select(s => _subjectMapper.ToSubjectResponse(s)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all subjects");
                throw;
            }
        }
    }
}
