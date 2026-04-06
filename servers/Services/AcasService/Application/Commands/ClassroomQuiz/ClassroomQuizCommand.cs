using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.Quiz;
using AcasService.Web.Requests;
using AcasService.Application.Jobs;

namespace AcasService.Application.Commands.ClassroomQuiz
{
    public interface IClassroomQuizCommand
    {
        Task<ClassroomQuizResponse> CreateClassroomQuizAsync(CreateClassroomQuizRequest request);
        Task<ClassroomQuizResponse> UpdateClassroomQuizAsync(string id, UpdateClassroomQuizRequest request);
        Task SoftDeleteClassroomQuizAsync(string id);
        Task DeleteClassroomQuizAsync(string id);
    }

    public class ClassroomQuizCommand : IClassroomQuizCommand
    {
        private readonly IClassroomQuizRepository _repository;
        private readonly IQuizAttemptRepository _quizAttemptRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly ClassroomQuizMapper _mapper;
        private readonly IClassroomQuizJobScheduling _jobScheduling;
        private readonly ILogger<ClassroomQuizCommand> _logger;

        public ClassroomQuizCommand(
            IClassroomQuizRepository repository,
            IQuizAttemptRepository quizAttemptRepository,
            IQuizRepository quizRepository,
            ClassroomQuizMapper mapper,
            IClassroomQuizJobScheduling jobScheduling,
            ILogger<ClassroomQuizCommand> logger)
        {
            _repository = repository;
            _quizAttemptRepository = quizAttemptRepository;
            _quizRepository = quizRepository;
            _mapper = mapper;
            _jobScheduling = jobScheduling;
            _logger = logger;
        }

        public async Task<ClassroomQuizResponse> CreateClassroomQuizAsync(CreateClassroomQuizRequest request)
        {
            var now = DateTime.UtcNow;
            
            if (request.StartTime < now.AddMinutes(-1))
            {
                throw new ArgumentException("Start time must be in the future.");
            }

            if (request.EndTime <= request.StartTime)
            {
                throw new ArgumentException("End time must be after start time.");
            }

            var quiz = await _quizRepository.FindByIdAsync(request.QuizId);
            if (quiz != null)
            {
                var windowMinutes = (request.EndTime - request.StartTime).TotalMinutes;
                if (windowMinutes < quiz.Duration)
                {
                    throw new ArgumentException($"The time window ({Math.Round(windowMinutes)} min) must be at least equal to the quiz duration ({quiz.Duration} min)");
                }
            }

            var cq = new Models.ClassroomQuiz
            {
                Id = Guid.NewGuid().ToString(),
                ClassroomId = request.ClassroomId,
                QuizId = request.QuizId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                MaxOfAttempts = request.MaxOfAttempts,
                Passcode = request.Passcode,
                Status = ClassroomQuizStatus.DRAFT,
                IsDeleted = false,
                CreatedBy = request.CreatedBy,
                CreatedAt = now,
                UpdatedAt = now
            };

            var created = await _repository.CreateAsync(cq);
            if (created == null)
            {
                _logger.LogError("Failed to create classroom quiz assignment");
                throw new Exception("Failed to create classroom quiz assignment");
            }
            return _mapper.ToClassroomQuizResponse(created);
        }
        

        public async Task<ClassroomQuizResponse> UpdateClassroomQuizAsync(string id, UpdateClassroomQuizRequest request)
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                _logger.LogError($"ClassroomQuiz with ID {id} not found.");
                throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");
            }

            var now = DateTime.UtcNow;
            
            bool isDraft = existing.Status == ClassroomQuizStatus.DRAFT;
            bool isPublished = existing.Status == ClassroomQuizStatus.PUBLISHED;
            bool isOngoing = isPublished && existing.StartTime <= now && existing.EndTime > now;
            bool isClosed = existing.Status == ClassroomQuizStatus.CLOSED;

            if (request.StartTime.HasValue && request.StartTime.Value != existing.StartTime)
            {
                if (!isDraft && (isOngoing || isClosed))
                {
                    throw new InvalidOperationException("Cannot change start time once the quiz has started or ended.");
                }
                
                if (isDraft && request.StartTime.Value < now.AddMinutes(-1))
                {
                    throw new ArgumentException("Start time must be in the future.");
                }
                
                existing.StartTime = request.StartTime.Value;
            }

            if (request.EndTime.HasValue)
            {
                if (request.EndTime.Value <= existing.StartTime)
                {
                    throw new ArgumentException("End time must be after start time.");
                }
                
                var quiz = await _quizRepository.FindByIdAsync(existing.QuizId);
                if (quiz != null)
                {
                    var windowMinutes = (request.EndTime.Value - existing.StartTime).TotalMinutes;
                    if (windowMinutes < quiz.Duration)
                    {
                        throw new ArgumentException($"The time window ({Math.Round(windowMinutes)} min) must be at least equal to the quiz duration ({quiz.Duration} min)");
                    }
                }
                
                existing.EndTime = request.EndTime.Value;
            }

            if (request.MaxOfAttempts.HasValue && request.MaxOfAttempts.Value != existing.MaxOfAttempts)
            {
                if (!isDraft && (isOngoing || isClosed))
                {
                    throw new InvalidOperationException("Cannot change MaxAttempts once the quiz has started or ended.");
                }

                int maxAttemptNumberUsed = await _quizAttemptRepository.GetMaxAttemptNumberAsync(id);
                if (request.MaxOfAttempts.Value < maxAttemptNumberUsed)
                {
                    throw new InvalidOperationException($"Cannot update MaxAttempts to {request.MaxOfAttempts.Value}. A student has already used {maxAttemptNumberUsed} attempts.");
                }
                
                existing.MaxOfAttempts = request.MaxOfAttempts.Value;
            }

            if (request.Passcode != null) 
            {
                if (isClosed)
                {
                    throw new InvalidOperationException("Cannot change passcode of a closed quiz.");
                }
                existing.Passcode = request.Passcode;
            }
            
            if (isClosed && existing.EndTime > now)
            {
                existing.Status = ClassroomQuizStatus.PUBLISHED;
            }
            else if (request.Status.HasValue)
            {
                existing.Status = request.Status.Value;
            }

            if (existing.Status == ClassroomQuizStatus.PUBLISHED)
            {
                if (isDraft || (request.EndTime.HasValue && request.EndTime.Value != existing.EndTime))
                {
                    existing.CloseJobId = await _jobScheduling.RescheduleCloseJobAsync(existing.CloseJobId, id, existing.EndTime);
                }
            }
            else if (existing.Status == ClassroomQuizStatus.CLOSED && isPublished)
            {
                await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId ?? "");
                existing.CloseJobId = null;
            }

            existing.UpdatedAt = DateTime.UtcNow;
            var updated = await _repository.UpdateAsync(existing);
            if (updated == null)
            {
                _logger.LogError($"Failed to update classroom quiz assignment {id}");
                throw new Exception($"Failed to update classroom quiz assignment {id}");
            }
            return _mapper.ToClassroomQuizResponse(updated);
        }

        public async Task SoftDeleteClassroomQuizAsync(string id)
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");
            }

            var now = DateTime.UtcNow;
            if (existing.Status == ClassroomQuizStatus.PUBLISHED && 
                existing.StartTime <= now && 
                existing.EndTime > now)
            {
                throw new InvalidOperationException("Cannot delete an ongoing quiz. Please close it first.");
            }

            if (!string.IsNullOrEmpty(existing.CloseJobId))
            {
                await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId);
            }

            await _repository.SoftDeleteAsync(id);
        }

        public async Task DeleteClassroomQuizAsync(string id)
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");
            }

            var now = DateTime.UtcNow;
            if (existing.Status == ClassroomQuizStatus.PUBLISHED && 
                existing.StartTime <= now && 
                existing.EndTime > now)
            {
                throw new InvalidOperationException("Cannot delete an ongoing quiz.");
            }

            if (!string.IsNullOrEmpty(existing.CloseJobId))
            {
                await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId);
            }

            await _repository.DeleteAsync(id);
        }
    }
}
