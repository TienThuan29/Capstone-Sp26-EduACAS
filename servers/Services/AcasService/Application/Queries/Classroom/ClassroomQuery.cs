using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Classroom;
using AcasService.Web.Requests;
using System.Collections;

namespace AcasService.Application.Queries.Classroom
{
    public interface IClassroomQuery
    {
        Task<ClassroomResponse> GetClassroomByIdAsync(string classroomId);
        Task<List<ClassroomResponse>> GetAllClassroomsAsync();
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request);

    }

    public class ClassroomQuery : IClassroomQuery
    {
        private readonly ILogger<ClassroomQuery> _logger;
        private readonly IClassroomRepository _classroomRepository;
        private readonly ClassroomMapper _classroomMapper;

        public ClassroomQuery(
            ILogger<ClassroomQuery> logger,
            IClassroomRepository classroomRepository,
            ClassroomMapper classroomMapper)
        {
            _logger = logger;
            _classroomRepository = classroomRepository;
            _classroomMapper = classroomMapper;
        }

        
        public async Task<ClassroomResponse> GetClassroomByIdAsync(string classroomId)
        {
            try
            {
                var classroom = await _classroomRepository.FindByIdAsync(classroomId);
                if (classroom == null)
                {
                    _logger.LogWarning("Classroom with ID {ClassroomId} not found.", classroomId);
                    throw new KeyNotFoundException($"Classroom with ID {classroomId} not found.");
                }
                return _classroomMapper.ToClassroomResponse(classroom);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classroom with ID {ClassroomId}.", classroomId);
                throw;
            }
        }

        public async Task<List<ClassroomResponse>> GetAllClassroomsAsync()
        {
            try
            {
                var classrooms = await _classroomRepository.FindAllAsync();
                return classrooms.Select(c => _classroomMapper.ToClassroomResponse(c)).ToList();

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all classrooms.");
                throw;
            }
        }
        
        public async Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request)
        {
            try
            {
                var classrooms = await _classroomRepository.GetClassroomsByKeywordAsync(request.ClassCode);
                return classrooms.Select(c => _classroomMapper.ToClassroomResponse(c)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms with keyword {Keyword}.", request.ClassCode);
                throw;
            }
        }
    }
}



