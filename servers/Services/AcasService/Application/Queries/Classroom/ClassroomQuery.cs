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
        Task<PagedResult<ClassroomResponse>> GetAllClassroomsAsync(string? userId, string? search, string? status, int pageIndex, int pageSize);
        Task<IEnumerable<ClassroomResponse>> GetClassroomsByKeywordAsync(SearchClassroomRequest request);


        Task<List<ClassroomResponse>> FindByStudentIdAsync(string studentId);

        // Task<ClassroomResponse>FindByStudentIdAndClassIdAsync(string studentId, string classId);
        Task<PagedResult<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId, int pageIndex, int pageSize);
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

        public async Task<PagedResult<ClassroomResponse>> GetAllClassroomsAsync(string? userId, string? search, string? status, int pageIndex, int pageSize)
        {
            try
            {
                var allClassrooms = (await _classroomRepository.FindAllAsync()).ToList();

                allClassrooms.Sort((a, b) => b.CreatedDate.CompareTo(a.CreatedDate));

                var now = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLowerInvariant();
                    allClassrooms = allClassrooms.Where(c =>
                        c.ClassName.ToLowerInvariant().Contains(lowerSearch) ||
                        c.ClassCode.ToLowerInvariant().Contains(lowerSearch)
                    ).ToList();
                }

                if (!string.IsNullOrWhiteSpace(status))
                {
                    allClassrooms = status.ToLowerInvariant() switch
                    {
                        "active" => allClassrooms.Where(c => !c.IsDeleted && c.EndDate >= now).ToList(),
                        "completed" => allClassrooms.Where(c => !c.IsDeleted && c.EndDate < now).ToList(),
                        "deleted" => allClassrooms.Where(c => c.IsDeleted).ToList(),
                        _ => allClassrooms
                    };
                }

                var totalCount = allClassrooms.Count;
                var itemsOnPage = allClassrooms
                    .Skip((pageIndex - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                // DynamoDB has no JOIN; load related data via batch reads (BatchGetItem) and parallel calls.
                var subjectIds = itemsOnPage.Select(c => c.SubjectId).Distinct().ToList();
                var lecturerIds = itemsOnPage.Select(c => c.LecturerId).Distinct().ToList();

                var subjects = await _subjectRepository.FindByIdsAsync(subjectIds);
                var subjectById = subjects.ToDictionary(s => s.Id);

                var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(lecturerIds);
                var userById = userProfiles.ToDictionary(u => u.Id, u => (UserProfileResponse?)u);

                Dictionary<string, ClassEnrollment?> enrollmentByClassId = new();
                if (!string.IsNullOrEmpty(userId))
                {
                    var classIds = itemsOnPage.Select(c => c.Id).ToList();
                    enrollmentByClassId = await _classroomEnrollmentRepository.FindByClassIdsAndStudentIdAsync(classIds, userId);
                }

                var classIdList = itemsOnPage.Select(c => c.Id).ToList();
                var studentCountByClassId = await _classroomEnrollmentRepository.GetStudentCountByClassIdsAsync(classIdList);

                var responses = itemsOnPage
                    .Select(classroom => _classroomMapper.ToClassroomResponse(
                        classroom,
                        subjectById.GetValueOrDefault(classroom.SubjectId),
                        userById.GetValueOrDefault(classroom.LecturerId),
                        enrollmentByClassId.GetValueOrDefault(classroom.Id),
                        studentCountByClassId.GetValueOrDefault(classroom.Id, 0)))
                    .ToList();

                return new PagedResult<ClassroomResponse>(responses, totalCount, pageIndex, pageSize);

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
                var classrooms = (await _classroomRepository.GetClassroomsByKeywordAsync(request.ClassCode)).ToList();
                if (classrooms.Count == 0)
                    return Array.Empty<ClassroomResponse>();

                var subjectIds = classrooms.Select(c => c.SubjectId).Distinct().ToList();
                var lecturerIds = classrooms.Select(c => c.LecturerId).Distinct().ToList();

                var subjects = await _subjectRepository.FindByIdsAsync(subjectIds);
                var subjectById = subjects.ToDictionary(s => s.Id);

                var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(lecturerIds);
                var userById = userProfiles.ToDictionary(u => u.Id, u => (UserProfileResponse?)u);

                return classrooms
                    .Select(classroom => _classroomMapper.ToClassroomResponse(
                        classroom,
                        subjectById.GetValueOrDefault(classroom.SubjectId),
                        userById.GetValueOrDefault(classroom.LecturerId)));
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
            if (enrollments.Count == 0)
                return new List<ClassroomResponse>();

            var classIds = enrollments.Select(e => e.ClassId).Distinct().ToList();
            var classrooms = await _classroomRepository.FindByIdsAsync(classIds);
            var classroomById = classrooms.ToDictionary(c => c.Id);

            var subjectIds = classrooms.Select(c => c.SubjectId).Distinct().ToList();
            var lecturerIds = classrooms.Select(c => c.LecturerId).Distinct().ToList();

            var subjects = await _subjectRepository.FindByIdsAsync(subjectIds);
            var subjectById = subjects.ToDictionary(s => s.Id);

            var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(lecturerIds);
            var userById = userProfiles.ToDictionary(u => u.Id, u => (UserProfileResponse?)u);

            return enrollments
                .Select(e => (Enrollment: e, Classroom: classroomById.GetValueOrDefault(e.ClassId)))
                .Where(x => x.Classroom != null)
                .Select(x => _classroomMapper.ToClassroomResponse(
                    x.Classroom!,
                    subjectById.GetValueOrDefault(x.Classroom!.SubjectId),
                    userById.GetValueOrDefault(x.Classroom!.LecturerId),
                    x.Enrollment))
                .ToList();
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

        public async Task<PagedResult<ClassroomResponse>> GetClassroomsByLecturerIdAsync(string lecturerId, int pageIndex, int pageSize)
        {
            try
            {
                var classroomsEnumerable = await _classroomRepository.GetClassroomsByLecturerIdAsync(lecturerId);
                var classrooms = classroomsEnumerable.ToList();
                
                classrooms.Sort((a, b) => b.CreatedDate.CompareTo(a.CreatedDate));

                var totalCount = classrooms.Count;
                var itemsOnPage = classrooms
                    .Skip((pageIndex - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var subjectIds = itemsOnPage.Select(c => c.SubjectId).Distinct().ToList();
                var lecturerIds = itemsOnPage.Select(c => c.LecturerId).Distinct().ToList();

                var subjects = await _subjectRepository.FindByIdsAsync(subjectIds);
                var subjectById = subjects.ToDictionary(s => s.Id);

                var userProfiles = await _userRequestProducer.GetUsersByIdsAsync(lecturerIds);
                var userById = userProfiles.ToDictionary(u => u.Id, u => (UserProfileResponse?)u);

                var responses = itemsOnPage
                    .Select(classroom => _classroomMapper.ToClassroomResponse(
                        classroom,
                        subjectById.GetValueOrDefault(classroom.SubjectId),
                        userById.GetValueOrDefault(classroom.LecturerId)))
                    .ToList();

                return new PagedResult<ClassroomResponse>(responses, totalCount, pageIndex, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching classrooms for lecturer ID {LecturerId}.", lecturerId);
                throw;
            }
        }
    }
}



