using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Subject;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Classroom
{
    public interface IClassroomCommand
    {
        Task<ClassroomResponse> CreateClassroomAsync(CreateClassroomRequest request);
        Task<ClassroomResponse> UpdateClassroomAsync(string classroomId, UpdateClassroomRequest request);
        Task<ClassroomResponse> DeleteClassroomAsync(string classroomId);
        Task<ClassroomResponse> SoftDeleteClassroomAsync(string classroomId);
    }

    public class ClassroomCommand : IClassroomCommand
    {

        private readonly IClassroomRepository _classroomRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ClassroomMapper _classroomMapper;
        private readonly ILogger<ClassroomCommand> _logger;
        private readonly UserRequestProducer _userRequestProducer;

        public ClassroomCommand(IClassroomRepository classroomRepository, ClassroomMapper classroomMapper, ILogger<ClassroomCommand> logger, UserRequestProducer userRequestProducer, ISubjectRepository subjectRepository)
        {
            _classroomRepository = classroomRepository;    
            _classroomMapper = classroomMapper;
            _logger = logger;
            _userRequestProducer = userRequestProducer;
            _subjectRepository = subjectRepository;
        }

        public async Task<ClassroomResponse> CreateClassroomAsync(CreateClassroomRequest request)
        {
            var subject = await _subjectRepository.FindByIdAsync(request.SubjectId);
            if (subject == null)
            {
                _logger.LogError("Subject not found");
                throw new Exception("Subject not found");
            }
            string finalEnrolKey = !string.IsNullOrEmpty(request.EnrolKey) 
                ? request.EnrolKey 
                : "@" + (Guid.NewGuid().ToString("N")[..6]);
            
            var newClassroom = new Models.Classroom
            {
                Id = Guid.NewGuid().ToString(),
                ClassCode = request.ClassCode,
                ClassName = request.ClassName,
                LecturerId = request.LecturerId,
                SubjectId = request.SubjectId,
                SemesterName = request.SemesterName,
                MaxSlot = request.MaxSlot,
                EnrolKey = finalEnrolKey,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = null,
                EndDate = request.EndDate,
                IsDeleted = false
            };
            var createdClassroom = await _classroomRepository.CreateAsync(newClassroom);
            if (createdClassroom == null)
            {
                _logger.LogError("Failed to create classroom");
                throw new Exception("Failed to create classroom");
            }
            var lecturerProfile = await _userRequestProducer.GetUserByIdAsync(createdClassroom.LecturerId);
            return _classroomMapper.ToClassroomResponse(createdClassroom, subject, lecturerProfile);
        }


        public async Task<ClassroomResponse> UpdateClassroomAsync(string classroomId, UpdateClassroomRequest request)
        {
            var existingClassroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (existingClassroom == null)
            {
                _logger.LogError("Classroom not found");
                throw new Exception("Classroom not found");
            }

            if (request.EndDate <= existingClassroom.CreatedDate)
            {
                 _logger.LogError("End date must be after created date");
                 throw new Exception("End date must be after created date");
            }

            existingClassroom.ClassCode = request.ClassCode;
            existingClassroom.ClassName = request.ClassName;
            existingClassroom.SemesterName = request.SemesterName;
            existingClassroom.SubjectId = request.SubjectId;
            existingClassroom.EndDate = request.EndDate;
            existingClassroom.MaxSlot = request.MaxSlot;
            existingClassroom.EnrolKey = request.EnrolKey;
            existingClassroom.UpdatedDate = DateTime.UtcNow;

            var updatedClassroom = await _classroomRepository.UpdateAsync(existingClassroom);
            if (updatedClassroom == null)
            {
                _logger.LogError("Failed to update classroom");
                throw new Exception("Failed to update classroom");
            }
            var subject = await _subjectRepository.FindByIdAsync(updatedClassroom.SubjectId);
            var lecturerProfile = await _userRequestProducer.GetUserByIdAsync(updatedClassroom.LecturerId);
            return _classroomMapper.ToClassroomResponse(updatedClassroom, subject, lecturerProfile);
        }

        public async Task<ClassroomResponse> SoftDeleteClassroomAsync(string classroomId)
        {
            var existingClassroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (existingClassroom == null)
            {
                _logger.LogError("Classroom not found");
                throw new Exception("Classroom not found");
            }
            await _classroomRepository.SoftDeleteAsync(classroomId);
            existingClassroom.IsDeleted = true;
            existingClassroom.UpdatedDate = DateTime.UtcNow;
            var subject = await _subjectRepository.FindByIdAsync(existingClassroom.SubjectId);
            var lecturerProfile = await _userRequestProducer.GetUserByIdAsync(existingClassroom.LecturerId);
            return _classroomMapper.ToClassroomResponse(existingClassroom, subject, lecturerProfile);
        }



        public async Task<ClassroomResponse> DeleteClassroomAsync(string classroomId)
        {
            var existingClassroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (existingClassroom == null)
            {
                _logger.LogError("Classroom not found");
                throw new Exception("Classroom not found");
            }
            await _classroomRepository.DeleteAsync(classroomId);
            var subject = await _subjectRepository.FindByIdAsync(existingClassroom.SubjectId);
            var lecturerProfile = await _userRequestProducer.GetUserByIdAsync(existingClassroom.LecturerId);
            return _classroomMapper.ToClassroomResponse(existingClassroom, subject, lecturerProfile);
        }

    }
}
