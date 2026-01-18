using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
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
        private readonly ISubjectRepository _subjectRepository;
        private readonly ClassroomMapper _classroomMapper;

        public ClassroomQuery(
            ILogger<ClassroomQuery> logger,
            IClassroomRepository classroomRepository,
            ISubjectRepository subjectRepository,
            ClassroomMapper classroomMapper)
        {
            _logger = logger;
            _classroomRepository = classroomRepository;
            _subjectRepository = subjectRepository;
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
                var subject = await _subjectRepository.FindByIdAsync(classroom.SubjectId);
                if (subject == null)
                    {
                    _logger.LogWarning("Subject with ID {SubjectId} not found.", classroom.SubjectId);
                    throw new KeyNotFoundException($"Subject with ID {classroom.SubjectId} not found.");
                }
                ClassroomResponse response = new ClassroomResponse();
                response.Id = classroom.Id;
                response.ClassCode = classroom.ClassCode;
                response.ClassName = classroom.ClassName;
                response.LecturerId = classroom.LecturerId;
                response.SubjectId = classroom.SubjectId;
                response.SubjectName = subject.SubjectName;
                _logger.LogWarning("{SubjectName} ", subject.SubjectName);
                response.SemesterName = classroom.SemesterName;
                response.EnrolKey = classroom.EnrolKey;
                response.CreatedDate = classroom.CreatedDate;
                response.UpdatedDate = classroom.UpdatedDate;
                response.EndDate = classroom.EndDate;
                response.IsDeleted = classroom.IsDeleted;
                return response;

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

                    ClassroomResponse response = new ClassroomResponse
                    {
                        Id = classroom.Id,
                        ClassCode = classroom.ClassCode,
                        ClassName = classroom.ClassName,
                        LecturerId = classroom.LecturerId,
                        SubjectId = classroom.SubjectId,
                        SubjectName = subject.SubjectName, 
                        SemesterName = classroom.SemesterName,
                        EnrolKey = classroom.EnrolKey,
                        CreatedDate = classroom.CreatedDate,
                        UpdatedDate = classroom.UpdatedDate,
                        EndDate = classroom.EndDate,
                        IsDeleted = classroom.IsDeleted
                    };

                    _logger.LogWarning("SubjectName: {SubjectName}", response.SubjectName);

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

                    ClassroomResponse response = new ClassroomResponse
                    {
                        Id = classroom.Id,
                        ClassCode = classroom.ClassCode,
                        ClassName = classroom.ClassName,
                        LecturerId = classroom.LecturerId,
                        SubjectId = classroom.SubjectId,
                        SubjectName = subject.SubjectName,
                        SemesterName = classroom.SemesterName,
                        EnrolKey = classroom.EnrolKey,
                        CreatedDate = classroom.CreatedDate,
                        UpdatedDate = classroom.UpdatedDate,
                        EndDate = classroom.EndDate,
                        IsDeleted = classroom.IsDeleted
                    };

                    _logger.LogWarning("SubjectName: {SubjectName}", response.SubjectName);

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
    }
}



