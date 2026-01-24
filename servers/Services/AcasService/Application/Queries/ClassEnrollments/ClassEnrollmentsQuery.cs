

using AcasService.Application.ClassroomEnrollment.ResponseDTOs;

namespace AcasService.Application.Queries.ClassEnrollments
{
    public interface IClassEnrollmentsQuery
    {
        Task<List<ClassEnrollmentsResponse>> GetEnrollmentsByStudentIdAsync(string studentId);
    }
}