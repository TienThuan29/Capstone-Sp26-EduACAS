namespace AcasService.Application.ResponseDTOs;

using AcasService.Models;

    public class ExaminationResponseDTO
    {
        public string Id { get; set; } = string.Empty;

        public string ExamName { get; set; } = string.Empty;

        public string ProgrammingLanguageId { get; set; } = string.Empty;

        public string[] ProblemIds { get; set; } = Array.Empty<string>();

        public string ClassroomId { get; set; } = string.Empty;

        public DateTime StartDatetime { get; set; }

        public DateTime EndDatetime { get; set; }

        public string Description { get; set; } = string.Empty;

        public bool IsPublicResult { get; set; }

        public float TotalMark { get; set; }

        public Status Status { get; set; }

        public Mode Mode { get; set; }

        public bool IsDeleted { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }
    }