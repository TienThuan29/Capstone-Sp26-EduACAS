using Hangfire;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;

namespace AcasService.Application.Jobs
{
    public interface IClassroomQuizJobScheduling
    {
        Task<string> ScheduleCloseJobAsync(string classroomQuizId, DateTime endTime);
        Task CancelCloseJobAsync(string jobId);
        Task<string> RescheduleCloseJobAsync(string? oldJobId, string classroomQuizId, DateTime newEndTime);
    }

    public class ClassroomQuizJobScheduling : IClassroomQuizJobScheduling
    {
        private readonly IClassroomQuizRepository _repository;
        private readonly IBackgroundJobClient _jobClient;
        private readonly ILogger<ClassroomQuizJobScheduling> _logger;

        public ClassroomQuizJobScheduling(
            IClassroomQuizRepository repository, 
            IBackgroundJobClient jobClient,
            ILogger<ClassroomQuizJobScheduling> logger)
        {
            _repository = repository;
            _jobClient = jobClient;
            _logger = logger;
        }

        public async Task<string> ScheduleCloseJobAsync(string classroomQuizId, DateTime endTime)
        {
            var now = DateTime.UtcNow;
            var delay = endTime - now;

            if (delay < TimeSpan.Zero) delay = TimeSpan.Zero;

            var jobId = _jobClient.Schedule<ClassroomQuizJobScheduling>(
                s => s.CloseQuizAsync(classroomQuizId),
                delay);

            _logger.LogInformation($"Scheduled CLOSE job for ClassroomQuiz {classroomQuizId} at {endTime} (JobId: {jobId})");
            return await Task.FromResult(jobId);
        }

        public async Task CancelCloseJobAsync(string jobId)
        {
            if (string.IsNullOrEmpty(jobId)) return;
            
            _jobClient.Delete(jobId);
            _logger.LogInformation($"Cancelled scheduled job {jobId}");
            await Task.CompletedTask;
        }

        public async Task<string> RescheduleCloseJobAsync(string? oldJobId, string classroomQuizId, DateTime newEndTime)
        {
            if (!string.IsNullOrEmpty(oldJobId))
            {
                await CancelCloseJobAsync(oldJobId);
            }
            return await ScheduleCloseJobAsync(classroomQuizId, newEndTime);
        }

        public async Task CloseQuizAsync(string classroomQuizId)
        {
            try 
            {
                var quiz = await _repository.FindByIdAsync(classroomQuizId);
                if (quiz == null)
                {
                    _logger.LogWarning($"CLOSE job failed: ClassroomQuiz {classroomQuizId} not found.");
                    return;
                }

                if (quiz.Status != ClassroomQuizStatus.PUBLISHED)
                {
                    _logger.LogInformation($"CLOSE job skipped: ClassroomQuiz {classroomQuizId} is already {quiz.Status}.");
                    return;
                }

                quiz.Status = ClassroomQuizStatus.CLOSED;
                quiz.UpdatedAt = DateTime.UtcNow;
                
                await _repository.UpdateAsync(quiz);
                _logger.LogInformation($"ClassroomQuiz {classroomQuizId} has been automatically CLOSED by scheduled job.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during automated CLOSING of ClassroomQuiz {classroomQuizId}");
                throw; 
            }
        }
    }
}
