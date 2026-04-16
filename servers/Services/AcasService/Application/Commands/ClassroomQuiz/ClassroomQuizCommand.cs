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
            var oldStatus = existing.Status;
            
            if (request.StartTime.HasValue && Math.Abs((request.StartTime.Value - existing.StartTime).TotalSeconds) >= 60)
            {
                if (oldStatus == ClassroomQuizStatus.ONGOING || oldStatus == ClassroomQuizStatus.CLOSED)
                {
                    throw new InvalidOperationException("Cannot change start time once the quiz has started or ended.");
                }
                
                if (oldStatus == ClassroomQuizStatus.DRAFT && request.StartTime.Value < now.AddMinutes(-5))
                {
                    throw new ArgumentException("Start time cannot be in the past.");
                }

                if (oldStatus == ClassroomQuizStatus.PUBLISHED && request.StartTime.Value < now)
                {
                    throw new ArgumentException("Cannot update PUBLISHED quiz to a past start time. Use ONGOING instead.");
                }

                existing.StartTime = request.StartTime.Value;
            }

            if (request.EndTime.HasValue && Math.Abs((request.EndTime.Value - existing.EndTime).TotalSeconds) >= 60)
            {
                if (oldStatus == ClassroomQuizStatus.ONGOING && request.EndTime.Value < existing.EndTime)
                {
                    throw new InvalidOperationException("Cannot reduce end time while quiz is ongoing. Please use CLOSED status to end it early.");
                }

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
                if (oldStatus == ClassroomQuizStatus.ONGOING || oldStatus == ClassroomQuizStatus.CLOSED)
                {
                    if (request.MaxOfAttempts.Value < existing.MaxOfAttempts)
                    {
                        int maxAttemptNumberUsed = await _quizAttemptRepository.GetMaxAttemptNumberAsync(id);
                        if (request.MaxOfAttempts.Value < maxAttemptNumberUsed)
                        {
                            throw new InvalidOperationException($"Cannot reduce MaxAttempts to {request.MaxOfAttempts.Value}. A student has already used {maxAttemptNumberUsed} attempts.");
                        }
                    }
                }
                
                existing.MaxOfAttempts = request.MaxOfAttempts.Value;
            }

            if (request.Passcode != null && request.Passcode != existing.Passcode) 
            {
                if (oldStatus == ClassroomQuizStatus.CLOSED)
                {
                    throw new InvalidOperationException("Cannot change passcode of a closed quiz.");
                }
                existing.Passcode = request.Passcode;
            }

            if (request.Status.HasValue && request.Status.Value != oldStatus)
            {
                var newStatus = request.Status.Value;

                if (oldStatus == ClassroomQuizStatus.DRAFT)
                {
                    if (newStatus == ClassroomQuizStatus.PUBLISHED)
                    {
                        if (existing.StartTime <= now) 
                            throw new InvalidOperationException("Cannot publish to the past. Please update StartTime or move to ONGOING.");
                        existing.Status = newStatus;
                    }
                    else if (newStatus == ClassroomQuizStatus.ONGOING)
                    {
                        existing.StartTime = now; 
                        var quiz = await _quizRepository.FindByIdAsync(existing.QuizId);
                        if (quiz != null && (existing.EndTime - existing.StartTime).TotalMinutes < quiz.Duration)
                        {
                            throw new InvalidOperationException("End time is too close to start now. Please extend EndTime first.");
                        }
                        existing.Status = newStatus;
                    }
                    else if (newStatus == ClassroomQuizStatus.CLOSED)
                    {
                        throw new InvalidOperationException("Cannot transition DRAFT directly to CLOSED.");
                    }
                }
                else if (oldStatus == ClassroomQuizStatus.PUBLISHED)
                {
                    if (newStatus == ClassroomQuizStatus.DRAFT)
                    {
                        existing.Status = newStatus;
                    }
                    else if (newStatus == ClassroomQuizStatus.ONGOING)
                    {
                        existing.StartTime = now;
                        existing.Status = newStatus;
                    }
                    else if (newStatus == ClassroomQuizStatus.CLOSED)
                    {
                        throw new InvalidOperationException("Cannot transition PUBLISHED directly to CLOSED. Move to DRAFT to retract.");
                    }
                }
                else if (oldStatus == ClassroomQuizStatus.ONGOING)
                {
                    if (newStatus == ClassroomQuizStatus.CLOSED)
                    {
                        existing.EndTime = now;
                        existing.Status = newStatus;
                    }
                    else
                    {
                        throw new InvalidOperationException($"Cannot move from ONGOING back to {newStatus}.");
                    }
                }
            }

            if (existing.Status == ClassroomQuizStatus.CLOSED && existing.EndTime > now)
            {
                existing.Status = ClassroomQuizStatus.ONGOING;
            }

            if (existing.Status == ClassroomQuizStatus.DRAFT)
            {
                await _jobScheduling.CancelStartJobAsync(existing.StartJobId ?? "");
                await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId ?? "");
                existing.StartJobId = null;
                existing.CloseJobId = null;
            }
            else if (existing.Status == ClassroomQuizStatus.PUBLISHED)
            {
                existing.StartJobId = await _jobScheduling.RescheduleStartJobAsync(existing.StartJobId, id, existing.StartTime);
                existing.CloseJobId = await _jobScheduling.RescheduleCloseJobAsync(existing.CloseJobId, id, existing.EndTime);
            }
            else if (existing.Status == ClassroomQuizStatus.ONGOING)
            {
                await _jobScheduling.CancelStartJobAsync(existing.StartJobId ?? "");
                existing.StartJobId = null;
                existing.CloseJobId = await _jobScheduling.RescheduleCloseJobAsync(existing.CloseJobId, id, existing.EndTime);
            }
            else if (existing.Status == ClassroomQuizStatus.CLOSED)
            {
                await _jobScheduling.CancelStartJobAsync(existing.StartJobId ?? "");
                await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId ?? "");
                existing.StartJobId = null;
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
            if (existing == null) throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");

            if (existing.Status == ClassroomQuizStatus.ONGOING)
            {
                throw new InvalidOperationException("Cannot delete an ongoing quiz. Please close it first.");
            }

            await _jobScheduling.CancelStartJobAsync(existing.StartJobId ?? "");
            await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId ?? "");

            await _repository.SoftDeleteAsync(id);
        }

        public async Task DeleteClassroomQuizAsync(string id)
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null) throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");

            if (existing.Status == ClassroomQuizStatus.ONGOING)
            {
                throw new InvalidOperationException("Cannot delete an ongoing quiz.");
            }

            await _jobScheduling.CancelStartJobAsync(existing.StartJobId ?? "");
            await _jobScheduling.CancelCloseJobAsync(existing.CloseJobId ?? "");

            await _repository.DeleteAsync(id);
        }
    }
}

