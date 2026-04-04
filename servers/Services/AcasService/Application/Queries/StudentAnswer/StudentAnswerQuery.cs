using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.StudentAnswer;

namespace AcasService.Application.Queries.StudentAnswer
{
    public interface IStudentAnswerQuery
    {
        Task<List<StudentAnswerResponse>> GetByAttemptIdAsync(string attemptId);
    }

    public class StudentAnswerQuery : IStudentAnswerQuery
    {
        private readonly IStudentAnswerRepository _studentAnswerRepository;
        private readonly ILogger<StudentAnswerQuery> _logger;

        public StudentAnswerQuery(
            IStudentAnswerRepository studentAnswerRepository,
            ILogger<StudentAnswerQuery> logger)
        {
            _studentAnswerRepository = studentAnswerRepository;
            _logger = logger;
        }

        public async Task<List<StudentAnswerResponse>> GetByAttemptIdAsync(string attemptId)
        {
            var answers = await _studentAnswerRepository.FindByAttemptIdAsync(attemptId);

            return answers.Select(x => new StudentAnswerResponse
            {
                Id = x.Id,
                AttemptId = x.AttemptId,
                QuestionId = x.QuestionId,
                AnswerOptionId = x.AnswerOptionId,
                TextAnswer = x.TextAnswer,
                IsCorrect = x.IsCorrect
            }).ToList();
        }
    }
}
