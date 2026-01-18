using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Web.Requests;
using Amazon.Runtime.Internal.Util;

namespace AcasService.Application.Commands.Classroom
{
    public interface IClassroomCommand
    {
        Task<ClassroomResponse> CreateClassroomAsync(CreateClassroomRequest request);
        Task<ClassroomResponse> UpdateClassroomAsync(string classroomId, UpdateClassroomRequest request);
        Task<ClassroomResponse> DeleteClassroomAsync(string classroomId);
    }

    public class ClassroomCommand : IClassroomCommand
    {

        private readonly IClassroomRepository _classroomRepository;

        
        private readonly ClassroomMapper _classroomMapper;
        private readonly ILogger<ClassroomCommand> _logger;

        public ClassroomCommand(IClassroomRepository classroomRepository, ClassroomMapper classroomMapper, ILogger<ClassroomCommand> logger)
        {
            _classroomRepository = classroomRepository;    
            _classroomMapper = classroomMapper;
            _logger = logger;
        }

        public async Task<ClassroomResponse> CreateClassroomAsync(CreateClassroomRequest request)
        {
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
            return _classroomMapper.ToClassroomResponse(createdClassroom);
        }


        public async Task<ClassroomResponse> UpdateClassroomAsync(string classroomId, UpdateClassroomRequest request)
        {
            var existingClassroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (existingClassroom == null)
            {
                _logger.LogError("Classroom not found");
                throw new Exception("Classroom not found");
            }
            existingClassroom.ClassCode = request.ClassCode;
            existingClassroom.ClassName = request.ClassName;
            existingClassroom.SemesterName = request.SemesterName;
            existingClassroom.SubjectId = request.SubjectId;
            existingClassroom.EndDate = request.EndDate;
            existingClassroom.EnrolKey = request.EnrolKey;
            existingClassroom.UpdatedDate = DateTime.UtcNow;

            var updatedClassroom = await _classroomRepository.UpdateAsync(existingClassroom);
            if (updatedClassroom == null)
            {
                _logger.LogError("Failed to update classroom");
                throw new Exception("Failed to update classroom");
            }
            return _classroomMapper.ToClassroomResponse(updatedClassroom);
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

            return _classroomMapper.ToClassroomResponse(existingClassroom);
        }

    }
}
