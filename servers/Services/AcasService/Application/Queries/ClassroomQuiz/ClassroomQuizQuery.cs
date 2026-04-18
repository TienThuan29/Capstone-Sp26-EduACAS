using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.ClassroomQuiz;

namespace AcasService.Application.Queries.ClassroomQuiz
{
    public interface IClassroomQuizQuery
    {
        Task<ClassroomQuizResponse?> GetClassroomQuizByIdAsync(string id);
        Task<List<ClassroomQuizResponse>> GetClassroomQuizzesByClassroomIdAsync(string classroomId);
        Task<PagedResult<ClassroomQuizResponse>> GetClassroomQuizzesByClassroomIdPagedAsync(string classroomId, int pageIndex, int pageSize, bool includeDrafts = false);
    }

    public class ClassroomQuizQuery : IClassroomQuizQuery
    {
        private readonly IClassroomQuizRepository _repository;
        private readonly ClassroomQuizMapper _mapper;
        private readonly ILogger<ClassroomQuizQuery> _logger;

        public ClassroomQuizQuery(
            IClassroomQuizRepository repository,
            ClassroomQuizMapper mapper,
            ILogger<ClassroomQuizQuery> logger)
        {
            _repository = repository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<ClassroomQuizResponse?> GetClassroomQuizByIdAsync(string id)
        {
            try
            {
                var cq = await _repository.FindByIdAsync(id);
                if (cq == null)
                {
                    _logger.LogWarning($"ClassroomQuiz with ID {id} not found.");
                    return null;
                }
                return _mapper.ToClassroomQuizResponse(cq);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching classroom quiz with ID {id}.");
                throw;
            }
        }

        public async Task<List<ClassroomQuizResponse>> GetClassroomQuizzesByClassroomIdAsync(string classroomId)
        {
            try
            {
                var list = await _repository.FindByClassroomIdAsync(classroomId);
                return list.Select(_mapper.ToClassroomQuizResponse).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching classroom quizzes for classroom ID {classroomId}.");
                throw;
            }
        }

        public async Task<PagedResult<ClassroomQuizResponse>> GetClassroomQuizzesByClassroomIdPagedAsync(string classroomId, int pageIndex, int pageSize, bool includeDrafts = false)
        {
            try
            {
                var (items, totalCount) = await _repository.FindByClassroomIdPagedAsync(classroomId, pageIndex, pageSize, includeDrafts);
                var mappedItems = items.Select(_mapper.ToClassroomQuizResponse).ToList();
                return new PagedResult<ClassroomQuizResponse>(mappedItems, totalCount, pageIndex, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching paged classroom quizzes for classroom ID {classroomId}.");
                throw;
            }
        }
    }
}
