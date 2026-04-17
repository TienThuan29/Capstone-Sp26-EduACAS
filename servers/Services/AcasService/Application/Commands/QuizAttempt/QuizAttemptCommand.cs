using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.Caching.Redis.Quiz;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.Question;
using AcasService.Repositories.StudentAnswer;
using AcasService.Repositories.AnswerOption;
using AcasService.Models;
using AcasService.Web.Requests;
using AcasService.Messaging.User;
using AcasService.Application.Queries.QuizAttempt;

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
        private readonly IAnswerOptionRepository _answerOptionRepository;
        private readonly UserRequestProducer _userRequestProducer;
        private readonly IQuizCache _quizCache;
        private readonly QuizAttemptMapper _mapper;
        private readonly ILogger<QuizAttemptCommand> _logger;
        private readonly IQuizAttemptQuery _quizAttemptQuery;
        

        public QuizAttemptCommand(
            IQuizAttemptRepository repository,
            IClassroomQuizRepository classroomQuizRepository,
            IQuizRepository quizRepository,
            IQuestionRepository questionRepository,
            IStudentAnswerRepository studentAnswerRepository,
            IAnswerOptionRepository answerOptionRepository,
            UserRequestProducer userRequestProducer,
            IQuizCache quizCache,
            QuizAttemptMapper mapper,
            ILogger<QuizAttemptCommand> logger,
            IQuizAttemptQuery quizAttemptQuery)
        {
            _repository = repository;
            _classroomQuizRepository = classroomQuizRepository;
            _quizRepository = quizRepository;
            _questionRepository = questionRepository;
            _studentAnswerRepository = studentAnswerRepository;
            _answerOptionRepository = answerOptionRepository;
            _userRequestProducer = userRequestProducer;
            _quizCache = quizCache;
            _mapper = mapper;
            _logger = logger;
            _quizAttemptQuery = quizAttemptQuery;
        }

        public async Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request)
        {
            try
            {
                var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(request.ClassroomQuizId);
                if (classroomQuiz == null)
                    throw new KeyNotFoundException($"ClassroomQuiz with ID {request.ClassroomQuizId} not found.");

                if (classroomQuiz.Status != Models.ClassroomQuizStatus.ONGOING)
                {
                    if (classroomQuiz.Status == Models.ClassroomQuizStatus.DRAFT)
                        throw new InvalidOperationException("This quiz is currently in DRAFT mode and not yet available for students.");
                    
                    if (classroomQuiz.Status == Models.ClassroomQuizStatus.PUBLISHED)
                        throw new InvalidOperationException("This quiz has been scheduled but not yet started (PUBLISHED).");
                    
                    if (classroomQuiz.Status == Models.ClassroomQuizStatus.CLOSED)
                        throw new InvalidOperationException("The quiz has already ended (CLOSED).");

                    throw new InvalidOperationException($"Quiz is not available (Current Status: {classroomQuiz.Status})");
                }

                var now = DateTime.UtcNow;
                if (now < classroomQuiz.StartTime || now > classroomQuiz.EndTime)
                {
                    throw new InvalidOperationException("The quiz is not within its valid time window.");
                }

                int currentMax = await _repository.GetMaxAttemptNumberAsync(request.ClassroomQuizId, request.StudentId);
                int nextAttempt = currentMax + 1;

                if (nextAttempt > classroomQuiz.MaxOfAttempts)
                    throw new InvalidOperationException($"You have already reached the maximum allowed attempts ({classroomQuiz.MaxOfAttempts}) for this quiz.");

                var quiz = await _quizRepository.FindByIdAsync(classroomQuiz.QuizId);
                if (quiz == null) throw new Exception("Base quiz not found.");

                var durationEndTime = now.AddMinutes(quiz.Duration);
                var deadline = durationEndTime < classroomQuiz.EndTime ? durationEndTime : classroomQuiz.EndTime;

                var newAttempt = new Models.QuizAttempt
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomQuizId = request.ClassroomQuizId,
                    StudentId = request.StudentId,
                    StartTime = now,
                    EndTime = deadline, 
                    Status = Models.QuizAttemptStatus.INPROGRESS,
                    AttemptNumber = nextAttempt
                };

                var created = await _repository.CreateAsync(newAttempt);
                if (created == null) throw new Exception("Failed to start quiz attempt");

                return await _quizAttemptQuery.BuildEnrichedResponse(created);
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
                if (attempt == null) throw new KeyNotFoundException($"QuizAttempt with ID {attemptId} not found.");

                if (attempt.Status != Models.QuizAttemptStatus.INPROGRESS)
                    throw new InvalidOperationException("Cannot update answers for a submitted or abandoned quiz.");

                var key = _quizCache.GetQuizAttemptKey(attemptId);
                var answers = await _quizCache.GetAsync<Dictionary<string, string>>(key) ?? new Dictionary<string, string>();
                
                answers[request.QuestionId.ToLower()] = request.SelectedOptionId ?? request.TextAnswer ?? "";
                
                await _quizCache.SetAsync(key, answers);
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
                if (attempt == null) throw new KeyNotFoundException($"QuizAttempt with ID {attemptId} not found.");

                if (attempt.Status != Models.QuizAttemptStatus.INPROGRESS)
                    throw new InvalidOperationException("This quiz has already been submitted or is no longer active.");

                var cacheKey = _quizCache.GetQuizAttemptKey(attemptId);
                var cachedAnswersRaw = await _quizCache.GetAsync<Dictionary<string, string>>(cacheKey) ?? new Dictionary<string, string>();
                var cachedAnswers = cachedAnswersRaw.ToDictionary(kvp => kvp.Key.ToLower(), kvp => kvp.Value);
                
                var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(attempt.ClassroomQuizId);
                if (classroomQuiz == null) throw new Exception("Classroom quiz configuration not found.");

                var quiz = await _quizRepository.FindByIdAsync(classroomQuiz.QuizId);
                if (quiz == null) throw new Exception("Base quiz not found.");

                double totalScore = 0;
                var studentAnswers = new List<Models.StudentAnswer>();

                foreach (var quizQuestion in quiz.Questions)
                {
                    var question = await _questionRepository.FindByIdAsync(quizQuestion.QuestionId);
                    if (question == null) 
                    {
                        _logger.LogWarning($"Question ID {quizQuestion.QuestionId} not found during grading.");
                        continue;
                    }

                    if (question.AnswerOptions == null || !question.AnswerOptions.Any())
                    {
                        _logger.LogInformation($"Fetching answer options for question {question.Id}...");
                        question.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(question.Id);
                    }

                    string studentValue = "";
                    cachedAnswers.TryGetValue(question.Id.ToLower(), out studentValue);
                    studentValue ??= "";
                    
                    bool isCorrect = false;

                    if (question.Type == Models.QuestionType.ESSAY)
                    {
                        if (!string.IsNullOrWhiteSpace(question.TextAnswer) && !string.IsNullOrWhiteSpace(studentValue))
                        {
                            var normalizedExpected = question.TextAnswer.Replace("\r", "").Trim();
                            var normalizedActual = studentValue.Replace("\r", "").Trim();
                            isCorrect = normalizedExpected.Equals(normalizedActual, StringComparison.OrdinalIgnoreCase);
                            if (isCorrect) totalScore += quizQuestion.Marks;
                        }

                        studentAnswers.Add(new Models.StudentAnswer
                        {
                            Id = Guid.NewGuid().ToString(),
                            AttemptId = attemptId,
                            QuestionId = question.Id,
                            TextAnswer = studentValue,
                            IsCorrect = isCorrect
                        });
                        continue;
                    }

                    if (question.Type == Models.QuestionType.MULTIPLE_CHOICE)
                    {
                        var correctOptionIds = question.AnswerOptions?.Where(o => o.IsCorrect).Select(o => o.Id.Trim().ToLower()).OrderBy(id => id).ToList() ?? new List<string>();
                        var studentSelectedIds = studentValue.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(id => id.Trim().ToLower()).OrderBy(id => id).ToList();

                        if (correctOptionIds.Count > 0 && correctOptionIds.SequenceEqual(studentSelectedIds))
                        {
                            isCorrect = true;
                            totalScore += quizQuestion.Marks;
                        }

                        studentAnswers.Add(new Models.StudentAnswer
                        {
                            Id = Guid.NewGuid().ToString(),
                            AttemptId = attemptId,
                            QuestionId = question.Id,
                            AnswerOptionId = studentValue,
                            IsCorrect = isCorrect
                        });
                        continue;
                    }

                    var correctOption = question.AnswerOptions?.FirstOrDefault(o => o.IsCorrect);
                    if (!string.IsNullOrEmpty(studentValue) && correctOption != null)
                    {
                        if (correctOption.Id.Trim().Equals(studentValue.Trim(), StringComparison.OrdinalIgnoreCase))
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
                        AnswerOptionId = studentValue,
                        IsCorrect = isCorrect
                    });
                }

                await _studentAnswerRepository.BatchCreateAsync(studentAnswers);

                attempt.EndTime = DateTime.UtcNow;
                attempt.FinalScore = totalScore;
                attempt.Status = Models.QuizAttemptStatus.SUBMITTED;
                await _repository.UpdateAsync(attempt);

                await _quizCache.RemoveAsync(cacheKey);

                return await _quizAttemptQuery.BuildEnrichedResponse(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting quiz attempt {attemptId}");
                throw;
            }
        }

       
        
    }
}
