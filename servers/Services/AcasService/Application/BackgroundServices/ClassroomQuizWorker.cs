using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;

namespace AcasService.Application.BackgroundServices
{
    public class ClassroomQuizWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ClassroomQuizWorker> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public ClassroomQuizWorker(IServiceProvider serviceProvider, ILogger<ClassroomQuizWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ClassroomQuizWorker is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await UpdateExpiredQuizzesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while updating expired quizzes.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("ClassroomQuizWorker is stopping.");
        }

        private async Task UpdateExpiredQuizzesAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var repository = scope.ServiceProvider.GetRequiredService<IClassroomQuizRepository>();
                var now = DateTime.UtcNow;
                var allQuizzes = await repository.FindAllAsync();
                
                var expiredQuizzes = allQuizzes.Where(q => 
                    !q.IsDeleted && 
                    q.Status == ClassroomQuizStatus.PUBLISHED && 
                    q.EndTime < now).ToList();

                if (expiredQuizzes.Any())
                {
                    _logger.LogInformation($"ClassroomQuizWorker: Found {expiredQuizzes.Count} expired quizzes. Updating status to CLOSED...");
                    
                    foreach (var quiz in expiredQuizzes)
                    {
                        quiz.Status = ClassroomQuizStatus.CLOSED;
                        quiz.UpdatedAt = now;
                        await repository.UpdateAsync(quiz);
                        _logger.LogInformation($"Quiz {quiz.Id} (Classroom: {quiz.ClassroomId}) status updated to CLOSED.");
                    }
                }
            }
        }
    }
}
