using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Web.Requests;
using System.Collections;
using AcasService.Repositories.ClassroomEnrollment;

namespace AcasService.Application.Queries.Classroom
{
    public interface IClassroomQuery
    {
        Task<ClassroomResponse> GetClassroomByIdAsync(string id);
        Task<List<ClassroomResponse>> GetAllClassroomsAsync(string userId);
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request);


        Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId);

        // Task<ClassroomResponse>FindByStudentIdAndClassIdAsync(string studentId, string classId);
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId);
    }

    public class ClassroomQuery : IClassroomQuery
    {
        private readonly ILogger<ClassroomQuery> _logger;
        private readonly IClassroomRepository _classroomRepository;
        private readonly ISubjectRepository _subjectRepository;

        private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;

        private readonly ClassroomMapper _classroomMapper;
        private readonly UserRequestProducer _userRequestProducer;

        public ClassroomQuery(
            ILogger<ClassroomQuery> logger,
            IClassroomRepository classroomRepository,
            ISubjectRepository subjectRepository,
            ClassroomMapper classroomMapper,
            UserRequestProducer userRequestProducer,
            IClassroomEnrollmentRepository classroomEnrollmentRepository)
        {
            _logger = logger;
            _classroomEnrollmentRepository = classroomEnrollmentRepository;
            _classroomRepository = classroomRepository;
            _subjectRepository = subjectRepository;
            _classroomMapper = classroomMapper;
            _userRequestProducer = userRequestProducer;
        }


        public async Task<ClassroomResponse> GetClassroomByIdAsync(string id)
        {
            try
            {
                var classroom = await _classroomRepository.FindByIdAsync(id);
                if (classroom == null)
                {
                    _logger.LogWarning("Classroom with ID {ClassroomId} not found.", id);
                    throw new KeyNotFoundException($"Classroom with ID {id} not found.");
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
                _logger.LogError(ex, "Error occurred while fetching classroom with ID {ClassroomId}.", id);
                throw;
            }
        }

        public async Task<List<ClassroomResponse>> GetAllClassroomsAsync(string userId)
        {
            try
            {
                var classrooms = await _classroomRepository.FindAllAsync();
                var responses = new List<ClassroomResponse>();

                foreach (var classroom in classrooms)
                {
                    var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                    var userProfile = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                    var enrollclass = await _classroomEnrollmentRepository.FindByClassAndStudentIdAsync(classroom.Id,userId);
                    var response = _classroomMapper.ToClassroomResponse(classroom, subject, userProfile,enrollclass);
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

        public async Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId)
        {
            var enrollments = await _classroomEnrollmentRepository.FindByStudentIdAsync(studentId);
            if (!enrollments.Any())
            {
               return new List<ClassroomResponse>();
            }

            var classroomResponses = new List<ClassroomResponse>();
            foreach (var enrollment in enrollments)
            {
                var classroom = await _classroomRepository.FindByIdAsync(enrollment.ClassId);
                if (classroom != null)
                {
                    var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                    var lecturer = await _userRequestProducer.GetUserByIdAsync(classroom.LecturerId);
                    var enrollclass = await _classroomEnrollmentRepository.FindByClassAndStudentIdAsync(enrollment.ClassId,studentId);
                    var classroomResponse = _classroomMapper.ToClassroomResponse(classroom,subject,lecturer,enrollclass);
                    classroomResponses.Add(classroomResponse);
                }
            }

            return classroomResponses;
        }

        // public async Task<ClassroomResponse> FindByStudentIdAndClassIdAsync(string studentId, string classId)
        // {
        //     var enrollments = await _classroomEnrollmentRepository.FindByStudentIdAsync(studentId);
        //     if (!enrollments.Any())
        //     {
        //         throw new KeyNotFoundException($"Student {studentId} has no enrollments");
        //     }

        //     var classroomResponses = new List<ClassroomResponse>();
        //     foreach (var enrollment in enrollments)
        //     {
        //         if (enrollment.ClassId == classId)
        //         {
        //             var classroom = await _classroomRepository.FindByIdAsync(enrollment.ClassId);
        //             if (classroom != null)
        //             {
        //                 var classroomResponse = _classroomMapper.ToClassroomResponse(classroom);
        //                 return classroomResponse;
        //             }
        //         }
        //     }

        //     throw new KeyNotFoundException($"Classroom with ID {classId} not found for student {studentId}.");
        // }

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



