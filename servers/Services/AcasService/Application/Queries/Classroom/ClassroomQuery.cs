using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Classroom;
using AcasService.Web.Requests;
using System.Collections;
using AcasService.Repositories.ClassroomEnrollment;

namespace AcasService.Application.Queries.Classroom
{
    public interface IClassroomQuery
    {
        Task<ClassroomResponse> GetClassroomByIdAsync(string classroomId);
        Task<List<ClassroomResponse>> GetAllClassroomsAsync();
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request);


        Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId);


        Task<ClassroomResponse>FindByStudentIdAndClassIdAsync(string studentId, string classId);
    }

    public class ClassroomQuery : IClassroomQuery
    {
        private readonly ILogger<ClassroomQuery> _logger;
        private readonly IClassroomRepository _classroomRepository;

        private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
        private readonly ClassroomMapper _classroomMapper;

        public ClassroomQuery(
            ILogger<ClassroomQuery> logger,
            IClassroomRepository classroomRepository,
            IClassroomEnrollmentRepository classroomEnrollmentRepository,
            ClassroomMapper classroomMapper)
        {
            _logger = logger;
            _classroomEnrollmentRepository = classroomEnrollmentRepository;
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

        public async Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId)
        {
            var enrollments = await _classroomEnrollmentRepository.FindByStudentIdAsync(studentId);
            if (!enrollments.Any())
            {
                throw new KeyNotFoundException($"Student {studentId} has no enrollments");
            }

            var classroomResponses = new List<ClassroomResponse>();
            foreach (var enrollment in enrollments)
            {
                var classroom = await _classroomRepository.FindByIdAsync(enrollment.ClassId);
                if (classroom != null)
                {
                    var classroomResponse = _classroomMapper.ToClassroomResponse(classroom);
                    classroomResponses.Add(classroomResponse);
                }
            }

            return classroomResponses;
        }

        public async Task<ClassroomResponse> FindByStudentIdAndClassIdAsync(string studentId, string classId)
        {
            var enrollments = await _classroomEnrollmentRepository.FindByStudentIdAsync(studentId);
            if (!enrollments.Any())
            {
                throw new KeyNotFoundException($"Student {studentId} has no enrollments");
            }

            var classroomResponses = new List<ClassroomResponse>();
            foreach (var enrollment in enrollments)
            {
                if (enrollment.ClassId == classId)
                {
                    var classroom = await _classroomRepository.FindByIdAsync(enrollment.ClassId);
                    if (classroom != null)
                    {
                        var classroomResponse = _classroomMapper.ToClassroomResponse(classroom);
                        return classroomResponse;
                    }
                }
            }

            throw new KeyNotFoundException($"Classroom with ID {classId} not found for student {studentId}.");
        }
    }
}



