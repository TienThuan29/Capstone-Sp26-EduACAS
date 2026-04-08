using Hangfire;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;

namespace AcasService.Application.Jobs
{
    public interface IClassroomQuizJobScheduling
    {
        Task<string> ScheduleCloseJobAsync(string classroomQuizId, DateTime endTime);
        Task CancelCloseJobAsync(string jobId);
        Task<string> RescheduleCloseJobAsync(string? oldJobId, string classroomQuizId, DateTime newEndTime);
        Task<string> ScheduleStartJobAsync(string classroomQuizId, DateTime startTime);
        Task CancelStartJobAsync(string jobId);
        Task<string> RescheduleStartJobAsync(string? oldJobId, string classroomQuizId, DateTime newStartTime);
    
    }

    public class ClassroomQuizJobScheduling : IClassroomQuizJobScheduling
    {
        private readonly IClassroomQuizRepository _repository;
        private readonly IQuizAttemptRepository _quizAttemptRepository;
        private readonly IBackgroundJobClient _jobClient;
        private readonly ILogger<ClassroomQuizJobScheduling> _logger;

        public ClassroomQuizJobScheduling(
            IClassroomQuizRepository repository, 
            IQuizAttemptRepository quizAttemptRepository,
            IBackgroundJobClient jobClient,
            ILogger<ClassroomQuizJobScheduling> logger)
        {
            _repository = repository;
            _quizAttemptRepository = quizAttemptRepository;
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

        public async Task<string> ScheduleStartJobAsync(string classroomQuizId, DateTime startTime)
        {
            var now = DateTime.UtcNow;
            var delay = startTime - now;

            if (delay < TimeSpan.Zero) delay = TimeSpan.Zero;

            var jobId = _jobClient.Schedule<ClassroomQuizJobScheduling>(
                s => s.OpenQuizAsync(classroomQuizId),
                delay);

            _logger.LogInformation($"Scheduled START job for ClassroomQuiz {classroomQuizId} at {startTime} (JobId: {jobId})");
            return await Task.FromResult(jobId);
        }

        public async Task CancelStartJobAsync(string jobId)
        {
            if (string.IsNullOrEmpty(jobId)) return;
            
            _jobClient.Delete(jobId);
            _logger.LogInformation($"Cancelled scheduled job {jobId}");
            await Task.CompletedTask;
        }

        public async Task<string> RescheduleStartJobAsync(string? oldJobId, string classroomQuizId, DateTime newStartTime)
        {
            if (!string.IsNullOrEmpty(oldJobId))
            {
                await CancelStartJobAsync(oldJobId);
            }
            return await ScheduleStartJobAsync(classroomQuizId, newStartTime);
        }

        public async Task OpenQuizAsync(string classroomQuizId)
        {
            try 
            {
                var quiz = await _repository.FindByIdAsync(classroomQuizId);
                if (quiz == null)
                {
                    _logger.LogWarning($"START job failed: ClassroomQuiz {classroomQuizId} not found.");
                    return;
                }

                if (quiz.Status != ClassroomQuizStatus.PUBLISHED)
                {
                    _logger.LogInformation($"START job skipped: ClassroomQuiz {classroomQuizId} is {quiz.Status} (expected PUBLISHED).");
                    return;
                }

                quiz.Status = ClassroomQuizStatus.ONGOING;
                quiz.UpdatedAt = DateTime.UtcNow;
                
                await _repository.UpdateAsync(quiz);
                _logger.LogInformation($"ClassroomQuiz {classroomQuizId} has been automatically opened (ONGOING) by scheduled job.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during automated OPENING of ClassroomQuiz {classroomQuizId}");
                throw; 
            }
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

                if (quiz.Status != ClassroomQuizStatus.ONGOING && quiz.Status != ClassroomQuizStatus.PUBLISHED)
                {
                    _logger.LogInformation($"CLOSE job skipped: ClassroomQuiz {classroomQuizId} is already {quiz.Status}.");
                    return;
                }

                quiz.Status = ClassroomQuizStatus.CLOSED;
                quiz.UpdatedAt = DateTime.UtcNow;
                
                await _repository.UpdateAsync(quiz);
                _logger.LogInformation($"ClassroomQuiz {classroomQuizId} has been automatically CLOSED by scheduled job.");

                // Auto-submit all in-progress attempts
                var attempts = await _quizAttemptRepository.FindByClassroomQuizIdAsync(classroomQuizId);
                var inProgressAttempts = attempts.Where(a => a.Status == QuizAttemptStatus.INPROGRESS).ToList();
                
                if (inProgressAttempts.Any())
                {
                    _logger.LogInformation($"Force-submitting {inProgressAttempts.Count} in-progress attempts for ClassroomQuiz {classroomQuizId}");
                    foreach (var attempt in inProgressAttempts)
                    {
                        attempt.Status = QuizAttemptStatus.SUBMITTED;
                        // Note: In a real system, you might want to calculate marks here or trigger a score calculation job.
                        await _quizAttemptRepository.UpdateAsync(attempt);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during automated CLOSING of ClassroomQuiz {classroomQuizId}");
                throw; 
            }
        }
    }
}

