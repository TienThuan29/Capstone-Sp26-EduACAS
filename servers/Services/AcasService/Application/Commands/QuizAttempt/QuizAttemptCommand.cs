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

namespace AcasService.Application.Commands.QuizAttempt
{
    public interface IQuizAttemptCommand
    {
        Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request);
        Task UpdateAnswerAsync(string attemptId, UpdateQuizAnswerRequest request);
        Task<QuizAttemptResponse> SubmitAttemptAsync(string attemptId);
        Task<List<QuizAttemptResponse>> GetHistoryAsync(string classroomQuizId, string studentId);
        Task<ResponseDTOs.PagedResult<QuizAttemptResponse>> GetPagedSubmissionsAsync(string classroomQuizId, int pageIndex, int pageSize);
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
            ILogger<QuizAttemptCommand> logger)
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
        }

        public async Task<QuizAttemptResponse> StartAttemptAsync(StartQuizAttemptRequest request)
        {
            try
            {
                var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(request.ClassroomQuizId);
                if (classroomQuiz == null)
                    throw new KeyNotFoundException($"ClassroomQuiz with ID {request.ClassroomQuizId} not found.");

                if (classroomQuiz.Status == Models.ClassroomQuizStatus.DRAFT)
                    throw new InvalidOperationException("This quiz is currently in DRAFT mode and not yet available for students.");

                // Validate Passcode
                if (!string.IsNullOrEmpty(classroomQuiz.Passcode) && classroomQuiz.Passcode != request.Passcode)
                {
                    throw new ArgumentException("Incorrect passcode. Please try again.");
                }

                var now = DateTime.UtcNow;
                _logger.LogInformation($"Checking time for quiz {request.ClassroomQuizId}. Now: {now}, Start: {classroomQuiz.StartTime}, End: {classroomQuiz.EndTime}");
                
                if (now < classroomQuiz.StartTime)
                {
                    var waitTime = classroomQuiz.StartTime - now;
                    throw new InvalidOperationException($"The quiz has not started yet. Starts in {(int)waitTime.TotalMinutes} minutes (at {classroomQuiz.StartTime.ToLocalTime():HH:mm dd/MM/yyyy}).");
                }

                if (now > classroomQuiz.EndTime || classroomQuiz.Status == Models.ClassroomQuizStatus.CLOSED)
                    throw new InvalidOperationException("The quiz has already ended.");

                int currentMax = await _repository.GetMaxAttemptNumberAsync(request.ClassroomQuizId, request.StudentId);
                int nextAttempt = currentMax + 1;

                if (nextAttempt > classroomQuiz.MaxOfAttempts)
                    throw new InvalidOperationException($"You have already reached the maximum allowed attempts ({classroomQuiz.MaxOfAttempts}) for this quiz.");

                var quiz = await _quizRepository.FindByIdAsync(classroomQuiz.QuizId);
                if (quiz == null) throw new Exception("Base quiz not found.");

                // Rule 8: Calculation of attempt end time
                // The deadline is the sooner of: (Start + Duration) OR (ClassroomQuiz EndTime)
                var durationEndTime = now.AddMinutes(quiz.Duration);
                var deadline = durationEndTime < classroomQuiz.EndTime ? durationEndTime : classroomQuiz.EndTime;

                var newAttempt = new Models.QuizAttempt
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomQuizId = request.ClassroomQuizId,
                    StudentId = request.StudentId,
                    StartTime = now,
                    EndTime = deadline, // Store the calculated deadline
                    Status = Models.QuizAttemptStatus.INPROGRESS,
                    AttemptNumber = nextAttempt
                };

                var created = await _repository.CreateAsync(newAttempt);
                if (created == null) throw new Exception("Failed to start quiz attempt");

                return await BuildEnrichedResponse(created);
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
                
                answers[request.QuestionId] = request.SelectedOptionId;
                
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
                    if (question == null) 
                    {
                        _logger.LogWarning($"Question ID {quizQuestion.QuestionId} not found during grading.");
                        continue;
                    }

                    // ENSURE AnswerOptions are loaded (they might not be by default in repository)
                    if (question.AnswerOptions == null || !question.AnswerOptions.Any())
                    {
                        _logger.LogInformation($"Fetching answer options for question {question.Id}...");
                        question.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(question.Id);
                    }

                    cachedAnswers.TryGetValue(question.Id, out var selectedOptionId);
                    
                    bool isCorrect = false;
                    var correctOption = question.AnswerOptions?.FirstOrDefault(o => o.IsCorrect);
                    
                    _logger.LogInformation($"Grading Question {question.Id}: Student selected '{selectedOptionId}', Correct Option is '{correctOption?.Id}'");

                    if (!string.IsNullOrEmpty(selectedOptionId) && correctOption != null)
                    {
                        if (correctOption.Id.Trim().Equals(selectedOptionId.Trim(), StringComparison.OrdinalIgnoreCase))
                        {
                            isCorrect = true;
                            totalScore += quizQuestion.Marks;
                            _logger.LogInformation($"Match found for Question {question.Id}! +{quizQuestion.Marks} marks.");
                        }
                        else 
                        {
                            _logger.LogInformation($"NO match for Question {question.Id}. '{correctOption.Id}' != '{selectedOptionId}'");
                        }
                    }
                    else if (correctOption == null)
                    {
                        _logger.LogWarning($"NO correct option defined for Question {question.Id}!");
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

                return await BuildEnrichedResponse(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting quiz attempt {attemptId}");
                throw;
            }
        }

        public async Task<List<QuizAttemptResponse>> GetHistoryAsync(string classroomQuizId, string studentId)
        {
            var attempts = await _repository.FindHistoryAsync(classroomQuizId, studentId);
            var result = new List<QuizAttemptResponse>();
            foreach (var a in attempts)
            {
                result.Add(await BuildEnrichedResponse(a));
            }
            return result.OrderByDescending(r => r.AttemptNumber).ToList();
        }

        public async Task<ResponseDTOs.PagedResult<QuizAttemptResponse>> GetPagedSubmissionsAsync(string classroomQuizId, int pageIndex, int pageSize)
        {
            var pagedAttempts = await _repository.FindPagedByClassroomQuizIdAsync(classroomQuizId, pageIndex, pageSize);
            
            // Fetch student profiles in batch
            var studentIds = pagedAttempts.Items.Select(a => a.StudentId).Distinct().ToList();
            var profiles = await _userRequestProducer.GetUsersByIdsAsync(studentIds);
            var profileMap = profiles.ToDictionary(p => p.Id);

            var enrichedItems = new List<QuizAttemptResponse>();
            foreach (var attempt in pagedAttempts.Items)
            {
                var response = await BuildEnrichedResponse(attempt);
                
                if (profileMap.TryGetValue(attempt.StudentId, out var profile))
                {
                    response.StudentName = profile.Fullname;
                    response.StudentEmail = profile.Email;
                }
                else
                {
                    response.StudentName = "Unknown Student";
                    response.StudentEmail = "Unknown Email";
                }
                
                enrichedItems.Add(response);
            }

            return new ResponseDTOs.PagedResult<QuizAttemptResponse>(
                enrichedItems, 
                pagedAttempts.TotalCount, 
                pagedAttempts.PageIndex, 
                pagedAttempts.PageSize
            );
        }

        private async Task<QuizAttemptResponse> BuildEnrichedResponse(Models.QuizAttempt attempt)
        {
            var response = _mapper.ToQuizAttemptResponse(attempt);
            
            var classroomQuiz = await _classroomQuizRepository.FindByIdAsync(attempt.ClassroomQuizId);
            if (classroomQuiz == null) return response;

            var quiz = await _quizRepository.FindByIdAsync(classroomQuiz.QuizId);
            if (quiz == null)
            {
                _logger.LogWarning($"Base Quiz {classroomQuiz.QuizId} not found for attempt {attempt.Id}");
                return response;
            }

            response.QuizTitle = quiz.Title;
            response.Duration = quiz.Duration;
            response.TotalQuestions = quiz.TotalQuestions;

            _logger.LogInformation($"Enriching attempt {attempt.Id} for Quiz '{quiz.Title}'. Questions in quiz: {quiz.Questions.Count}");

            if (attempt.Status == Models.QuizAttemptStatus.INPROGRESS)
            {
                int addedCount = 0;
                foreach (var qq in quiz.Questions)
                {
                    var qDetails = await _questionRepository.FindByIdAsync(qq.QuestionId);
                    if (qDetails != null)
                    {
                        // Fetch Answer Options for this question!
                        qDetails.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(qq.QuestionId);
                        
                        response.Questions.Add(_mapper.ToStudentQuizQuestionResponse(qq, qDetails));
                        addedCount++;
                    }
                    else
                    {
                        _logger.LogWarning($"Question detail for ID {qq.QuestionId} not found in database!");
                    }
                }
                _logger.LogInformation($"Successfully added {addedCount} out of {quiz.Questions.Count} questions to response.");
            }

            if (attempt.Status == Models.QuizAttemptStatus.SUBMITTED)
            {
                var studentAnswers = await _studentAnswerRepository.FindByAttemptIdAsync(attempt.Id);
                response.CorrectAnswers = studentAnswers.Count(a => a.IsCorrect);
                // Also provide the selections
                response.Answers = studentAnswers.ToDictionary(a => a.QuestionId, a => a.AnswerOptionId ?? "");
            }
            else
            {
                var cacheKey = _quizCache.GetQuizAttemptKey(attempt.Id);
                response.Answers = await _quizCache.GetAsync<Dictionary<string, string>>(cacheKey) ?? new Dictionary<string, string>();
            }

            return response;
        }
    }
}
