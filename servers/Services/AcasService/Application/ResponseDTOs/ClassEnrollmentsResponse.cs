

namespace AcasService.Application.ClassroomEnrollment.ResponseDTOs
{
    public class ClassEnrollmentsResponse
    {
        public string EnrollmentId { get; set; } = string.Empty;
        public string ClassId { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public DateTime JoinedDate { get; set; } = DateTime.MinValue;

        public DateTime MovedOutDate { get; set; } = DateTime.MinValue;

        public bool IsJoining { get; set; } = false;
    }
}