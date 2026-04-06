using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Web.Requests;

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
        private readonly ClassroomQuizMapper _mapper;
        private readonly ILogger<ClassroomQuizCommand> _logger;

        public ClassroomQuizCommand(
            IClassroomQuizRepository repository,
            IQuizAttemptRepository quizAttemptRepository,
            ClassroomQuizMapper mapper,
            ILogger<ClassroomQuizCommand> logger)
        {
            _repository = repository;
            _quizAttemptRepository = quizAttemptRepository;
            _mapper = mapper;
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

            var cq = new Models.ClassroomQuiz
            {
                Id = Guid.NewGuid().ToString(),
                ClassroomId = request.ClassroomId,
                QuizId = request.QuizId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                MaxOfAttempts = request.MaxOfAttempts,
                Passcode = request.Passcode,
                Status = now > request.EndTime 
                    ? ClassroomQuizStatus.CLOSED 
                    : (now < request.StartTime ? ClassroomQuizStatus.DRAFT : ClassroomQuizStatus.PUBLISHED),
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
            bool isStarted = existing.StartTime < now.AddMinutes(-1);

            if (request.StartTime.HasValue)
            {
                if (isStarted && request.StartTime.Value != existing.StartTime)
                {
                    throw new InvalidOperationException("Cannot change start time of an ongoing quiz.");
                }
                existing.StartTime = request.StartTime.Value;
            }

            if (request.EndTime.HasValue)
            {
                if (request.EndTime.Value <= existing.StartTime)
                {
                    throw new ArgumentException("End time must be after start time.");
                }
                existing.EndTime = request.EndTime.Value;
            }

            if (request.Passcode != null) existing.Passcode = request.Passcode;
            
            if (now > existing.EndTime)
            {
                existing.Status = ClassroomQuizStatus.CLOSED;
            }
            else if (now < existing.StartTime)
            {
                existing.Status = ClassroomQuizStatus.DRAFT;
            }
            else
            {
                existing.Status = ClassroomQuizStatus.PUBLISHED;
            }

            if (request.MaxOfAttempts.HasValue)
            {
                int maxVersionDone = await _quizAttemptRepository.GetMaxAttemptNumberAsync(id);
                if (request.MaxOfAttempts.Value < maxVersionDone)
                {
                    _logger.LogError($"Cannot update MaxAttempts to {request.MaxOfAttempts.Value}. A student has already reached attempt #{maxVersionDone}.");
                    throw new InvalidOperationException($"Cannot update MaxAttempts to {request.MaxOfAttempts.Value}. A student has already reached attempt #{maxVersionDone}.");
                }
                existing.MaxOfAttempts = request.MaxOfAttempts.Value;
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
                _logger.LogError($"ClassroomQuiz with ID {id} not found for soft delete.");
                throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");
            }
            await _repository.SoftDeleteAsync(id);
        }

        public async Task DeleteClassroomQuizAsync(string id)
        {
            var existing = await _repository.FindByIdAsync(id);
            if (existing == null)
            {
                _logger.LogError($"ClassroomQuiz with ID {id} not found for deletion.");
                throw new KeyNotFoundException($"ClassroomQuiz with ID {id} not found.");
            }
            await _repository.DeleteAsync(id);
        }
    }
}
