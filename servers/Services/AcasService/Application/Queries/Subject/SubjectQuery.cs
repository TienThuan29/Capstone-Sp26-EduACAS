using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Subject;

namespace AcasService.Application.Queries.Subject
{
   public interface ISubjectQuery
   {

        Task<SubjectResponse> GetSubjectByIdAsync(string subjectId);
        Task<List<SubjectResponse>> GetAllSubjectsAsync();
        Task<List<SubjectResponse>> SearchSubjectsAsync(
            string? searchTerm = null,
            bool? isDeleted = null,
            string? createdBy = null);
        Task<PagedSubjectResponse> GetPagedSubjectsAsync(
            int page = 1,
            int pageSize = 10,
            string? sortBy = null,
            bool ascending = true,
            bool? includeDeleted = false);
    }

    public class SubjectQuery : ISubjectQuery 
    {
     
        private readonly ISubjectRepository _subjectRepository;
        private readonly SubjectMapper _subjectMapper;
        private readonly ILogger<SubjectQuery> _logger; 

        
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

        
        public async Task<SubjectResponse> GetSubjectByIdAsync(string subjectId)
        {
            try
            {
                var subject = await _subjectRepository.FindByIdAsync(subjectId);
                
                if (subject == null) {
                    _logger.LogWarning("Subject not found with id: {Id}", subjectId);
                    throw new KeyNotFoundException($"Subject with id {subjectId} not found.");
                }

                
                return _subjectMapper.ToSubjectResponse(subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subject by id: {Id}", subjectId);
                throw; 
            }
        }

        
        public async Task<List<SubjectResponse>> GetAllSubjectsAsync()
        {
            try
            {
                var subjects = await _subjectRepository.FindAllAsync();

                
                return subjects.Select(s => _subjectMapper.ToSubjectResponse(s)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all subjects");
                throw;
            }
        }

        public async Task<List<SubjectResponse>> SearchSubjectsAsync(
            string? searchTerm = null,
            bool? isDeleted = null,
            string? createdBy = null)
        {
            try
            {
                var subjects = await _subjectRepository.SearchAsync(searchTerm, isDeleted, createdBy);
                return subjects.Select(s => _subjectMapper.ToSubjectResponse(s)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching subjects");
                throw;
            }
        }

        public async Task<PagedSubjectResponse> GetPagedSubjectsAsync(
            int page = 1,
            int pageSize = 10,
            string? sortBy = null,
            bool ascending = true,
            bool? includeDeleted = false)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                var (items, totalCount) = await _subjectRepository.GetPagedAsync(
                    page, pageSize, sortBy, ascending, includeDeleted);

                var responseList = items.Select(s => _subjectMapper.ToSubjectResponse(s)).ToList();

                return new PagedSubjectResponse
                {
                    Items = responseList,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paged subjects");
                throw;
            }
        }
    }
}
