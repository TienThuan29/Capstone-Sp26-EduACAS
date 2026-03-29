using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Caching.Redis.Quiz;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.Question;
using AcasService.Repositories.StudentAnswer;
using AcasService.Models;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.QuizAttempt
{
    public interface IQuizAttemptCommand
    {
        Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request);
        Task UpdateAnswerAsync(string attemptId, UpdateQuizAnswerRequest request);
        Task<QuizAttemptResponse> SubmitAttemptAsync(string attemptId);
    }

    public class QuizAttemptCommand : IQuizAttemptCommand
    {
        private readonly IQuizAttemptRepository _repository;
        private readonly IClassroomQuizRepository _classroomQuizRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IStudentAnswerRepository _studentAnswerRepository;
        private readonly IQuizCache _quizCache;
        private readonly QuizAttemptMapper _mapper;
        private readonly ILogger<QuizAttemptCommand> _logger;

        public QuizAttemptCommand(
            IQuizAttemptRepository repository,
            IClassroomQuizRepository classroomQuizRepository,
            IQuizRepository quizRepository,
            IQuestionRepository questionRepository,
            IStudentAnswerRepository studentAnswerRepository,
            IQuizCache quizCache,
            QuizAttemptMapper mapper,
            ILogger<QuizAttemptCommand> logger)
        {
            _repository = repository;
            _classroomQuizRepository = classroomQuizRepository;
            _quizRepository = quizRepository;
            _questionRepository = questionRepository;
            _studentAnswerRepository = studentAnswerRepository;
            _quizCache = quizCache;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request)
        {
            try
            {
                var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(request.ClassroomQuizId);
                if (classroomQuiz == null)
                {
                    _logger.LogError($"ClassroomQuiz with ID {request.ClassroomQuizId} not found.");
                    throw new KeyNotFoundException($"ClassroomQuiz with ID {request.ClassroomQuizId} not found.");
                }

                if (classroomQuiz.Status != Models.ClassroomQuizStatus.PUBLISHED)
                {
                    _logger.LogError($"ClassroomQuiz {request.ClassroomQuizId} is not published.");
                    throw new InvalidOperationException("This quiz is not currently available.");
                }

                var now = DateTime.UtcNow;
                if (now < classroomQuiz.StartTime || now > classroomQuiz.EndTime)
                {
                    _logger.LogError($"Current time {now} is outside quiz time range ({classroomQuiz.StartTime} - {classroomQuiz.EndTime}).");
                    throw new InvalidOperationException("The quiz is not currently in its active time range.");
                }

                int currentMax = await _repository.GetMaxAttemptNumberAsync(request.ClassroomQuizId, request.StudentId);
                int nextAttempt = currentMax + 1;

                if (nextAttempt > classroomQuiz.MaxOfAttempts)
                {
                    _logger.LogError($"Student {request.StudentId} has reached max attempts ({classroomQuiz.MaxOfAttempts}) for quiz {request.ClassroomQuizId}.");
                    throw new InvalidOperationException($"You have already reached the maximum allowed attempts ({classroomQuiz.MaxOfAttempts}) for this quiz.");
                }

                var newAttempt = new Models.QuizAttempt
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomQuizId = request.ClassroomQuizId,
                    StudentId = request.StudentId,
                    StartTime = now,
                    Status = Models.QuizAttemptStatus.INPROGRESS,
                    AttemptNumber = nextAttempt
                };

                var created = await _repository.CreateAsync(newAttempt);
                if (created == null)
                {
                    _logger.LogError("Failed to create quiz attempt record");
                    throw new Exception("Failed to start quiz attempt");
                }

                return _mapper.ToQuizAttemptResponse(created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error starting quiz attempt for student {request.StudentId} and quiz {request.ClassroomQuizId}");
                throw;
            }
        }

        public async Task UpdateAnswerAsync(string attemptId, UpdateQuizAnswerRequest request)
        {
            try
            {
                var attempt = await _repository.FindByIdAsync(attemptId);
                if (attempt == null)
                {
                    _logger.LogError($"QuizAttempt with ID {attemptId} not found.");
                    throw new KeyNotFoundException($"QuizAttempt with ID {attemptId} not found.");
                }

                if (attempt.Status != Models.QuizAttemptStatus.INPROGRESS)
                {
                    _logger.LogError($"Cannot update answer for attempt {attemptId} because status is {attempt.Status}.");
                    throw new InvalidOperationException("Cannot update answers for a submitted or abandoned quiz.");
                }

                var key = _quizCache.GetQuizAttemptKey(attemptId);
                var answers = await _quizCache.GetAsync<Dictionary<string, string>>(key) ?? new Dictionary<string, string>();
                
                answers[request.QuestionId] = request.SelectedOptionId;
                
                await _quizCache.SetAsync(key, answers);
                _logger.LogInformation($"Updated answer for attempt {attemptId}, question {request.QuestionId} in Redis.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating answer in Redis for attempt {attemptId}");
                throw;
            }
        }

        public async Task<QuizAttemptResponse> SubmitAttemptAsync(string attemptId)
        {
            try
            {
                var attempt = await _repository.FindByIdAsync(attemptId);
                if (attempt == null)
                {
                    _logger.LogError($"QuizAttempt with ID {attemptId} not found.");
                    throw new KeyNotFoundException($"QuizAttempt with ID {attemptId} not found.");
                }

                if (attempt.Status != Models.QuizAttemptStatus.INPROGRESS)
                {
                    _logger.LogError($"Cannot submit attempt {attemptId} because status is {attempt.Status}.");
                    throw new InvalidOperationException("This quiz has already been submitted or is no longer active.");
                }

                var cacheKey = _quizCache.GetQuizAttemptKey(attemptId);
                var cachedAnswers = await _quizCache.GetAsync<Dictionary<string, string>>(cacheKey) ?? new Dictionary<string, string>();

                var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(attempt.ClassroomQuizId);
                if (classroomQuiz == null) throw new Exception("Classroom quiz configuration not found.");

                var quiz = await _quizRepository.FindByIdAsync(classroomQuiz.QuizId);
                if (quiz == null) throw new Exception("Base quiz not found.");

                double totalScore = 0;
                var studentAnswers = new List<Models.StudentAnswer>();

                foreach (var quizQuestion in quiz.Questions)
                {
                    var question = await _questionRepository.FindByIdAsync(quizQuestion.QuestionId);
                    if (question == null) continue;

                    cachedAnswers.TryGetValue(question.Id, out var selectedOptionId);
                    
                    bool isCorrect = false;
                    if (!string.IsNullOrEmpty(selectedOptionId))
                    {
                        var correctOption = question.AnswerOptions.FirstOrDefault(o => o.IsCorrect);
                        if (correctOption != null && correctOption.Id == selectedOptionId)
                        {
                            isCorrect = true;
                            totalScore += quizQuestion.Marks;
                        }
                    }

                    studentAnswers.Add(new Models.StudentAnswer
                    {
                        Id = Guid.NewGuid().ToString(),
                        AttemptId = attemptId,
                        QuestionId = question.Id,
                        AnswerOptionId = selectedOptionId,
                        IsCorrect = isCorrect
                    });
                }

                await _studentAnswerRepository.BatchCreateAsync(studentAnswers);

                attempt.EndTime = DateTime.UtcNow;
                attempt.FinalScore = totalScore;
                attempt.Status = Models.QuizAttemptStatus.SUBMITTED;
                await _repository.UpdateAsync(attempt);

                await _quizCache.RemoveAsync(cacheKey);

                _logger.LogInformation($"Attempt {attemptId} submitted successfully. Final Score: {totalScore}");
                return _mapper.ToQuizAttemptResponse(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting quiz attempt {attemptId}");
                throw;
            }
        }
    }
}
