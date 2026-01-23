using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;
namespace AcasService.Application.Queries.Classroom
{
    public interface IClassroomQuery
    {
        Task<ClassroomResponse> GetClassroomByIdAsync(string classroomId);
        Task<List<ClassroomResponse>> GetAllClassroomsAsync();
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request);
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId);
    }

    public class ClassroomQuery : IClassroomQuery
    {
        private readonly ILogger<ClassroomQuery> _logger;
        private readonly IClassroomRepository _classroomRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ClassroomMapper _classroomMapper;
        private readonly UserRequestProducer _userRequestProducer;

        public ClassroomQuery(
            ILogger<ClassroomQuery> logger,
            IClassroomRepository classroomRepository,
            ISubjectRepository subjectRepository,
            ClassroomMapper classroomMapper,
            UserRequestProducer userRequestProducer)
        {
            _logger = logger;
            _classroomRepository = classroomRepository;
            _subjectRepository = subjectRepository;
            _classroomMapper = classroomMapper;
            _userRequestProducer = userRequestProducer;
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
                var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                if (subject == null)
                {
                    _logger.LogWarning("Subject with ID {SubjectId} not found.", classroom.SubjectId);
                    throw new KeyNotFoundException($"Subject with ID {classroom.SubjectId} not found.");
                }
                var lecturerProfile = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                return _classroomMapper.ToClassroomResponse(classroom, subject, lecturerProfile);

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
                var responses = new List<ClassroomResponse>();

                foreach (var classroom in classrooms)
                {
                    var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                    var userProfile = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                    var response = _classroomMapper.ToClassroomResponse(classroom, subject, userProfile);
                    responses.Add(response);
                }

                return responses;

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
                var responses = new List<ClassroomResponse>();

                foreach (var classroom in classrooms)
                {
                    var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                    var userProfile = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                    var response = _classroomMapper.ToClassroomResponse(classroom, subject, userProfile);
                    responses.Add(response);
                }

                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms with keyword {Keyword}.", request.ClassCode);
                throw;
            }
        }

        public async Task<IEnumerable<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId)
        {
            try
            {
                var classrooms = await _classroomRepository.GetClassroomsByLecturerIdAsync(lecturerId);
                var responses = new List<ClassroomResponse>();
                foreach (var classroom in classrooms)
                {
                    var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                    var userProfile = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                    var response = _classroomMapper.ToClassroomResponse(classroom, subject, userProfile);
                    responses.Add(response);
                }
                return responses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms for lecturer ID {LecturerId}.", lecturerId);
                throw;
            }
        }
    }
}



