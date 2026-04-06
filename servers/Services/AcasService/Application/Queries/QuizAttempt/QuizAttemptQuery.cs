using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.Question;
using AcasService.Repositories.StudentAnswer;
using AcasService.Repositories.AnswerOption;
using AcasService.Repositories.Caching.Redis.Quiz;
using AcasService.Messaging.User;

namespace AcasService.Application.Queries.QuizAttempt
{
    public interface IQuizAttemptQuery
    {
        Task<QuizAttemptResponse> GetByIdAsync(string id);
        Task<List<QuizAttemptResponse>> GetByStudentIdAsync(string studentId);
        Task<List<QuizAttemptResponse>> GetHistoryAsync(string classroomQuizId, string studentId);
        Task<ResponseDTOs.PagedResult<QuizAttemptResponse>> GetPagedSubmissionsAsync(string classroomQuizId, int pageIndex, int pageSize);
        Task<QuizAttemptResponse> BuildEnrichedResponse(Models.QuizAttempt attempt);
    }

    public class QuizAttemptQuery : IQuizAttemptQuery
    {
        private readonly IQuizAttemptRepository _quizAttemptRepository;
        private readonly QuizAttemptMapper _mapper;
        private readonly ILogger<QuizAttemptQuery> _logger;
        private readonly UserRequestProducer _userRequestProducer;
        private readonly IClassroomQuizRepository _classroomQuizRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IStudentAnswerRepository _studentAnswerRepository;
        private readonly IAnswerOptionRepository _answerOptionRepository;
        private readonly IQuizCache _quizCache;
        

        public QuizAttemptQuery(
            IQuizAttemptRepository quizAttemptRepository,
            QuizAttemptMapper mapper,
            ILogger<QuizAttemptQuery> logger,
            UserRequestProducer userRequestProducer,
            IClassroomQuizRepository classroomQuizRepository,
            IQuizRepository quizRepository,
            IQuestionRepository questionRepository,
            IStudentAnswerRepository studentAnswerRepository,
            IAnswerOptionRepository answerOptionRepository,
            IQuizCache quizCache)
        {
            _quizAttemptRepository = quizAttemptRepository;
            _classroomQuizRepository = classroomQuizRepository;
            _quizRepository = quizRepository;
            _questionRepository = questionRepository;
            _studentAnswerRepository = studentAnswerRepository;
            _answerOptionRepository = answerOptionRepository;
            _quizCache = quizCache;
            _mapper = mapper;
            _logger = logger;
            _userRequestProducer = userRequestProducer;
        }

        public async Task<QuizAttemptResponse> GetByIdAsync(string id)
        {
            var attempt = await _quizAttemptRepository.FindByIdAsync(id);
            if (attempt == null)
            {
                _logger.LogWarning("Quiz attempt not found with id {Id}", id);
                throw new KeyNotFoundException($"Quiz attempt with id {id} not found");
            }

            return await BuildEnrichedResponse(attempt);
        }

        public async Task<List<QuizAttemptResponse>> GetByStudentIdAsync(string studentId)
        {
            var attempts = await _quizAttemptRepository.FindByStudentIdAsync(studentId);
            return attempts
                .OrderByDescending(x => x.StartTime)
                .Select(_mapper.ToQuizAttemptResponse)
                .ToList();
        }

         public async Task<List<QuizAttemptResponse>> GetHistoryAsync(string classroomQuizId, string studentId)
        {
            var attempts = await _quizAttemptRepository.FindHistoryAsync(classroomQuizId, studentId);
            var result = new List<QuizAttemptResponse>();
            foreach (var a in attempts)
            {
                result.Add(await BuildEnrichedResponse(a));
            }
            return result.OrderByDescending(r => r.AttemptNumber).ToList();
        }

        public async Task<ResponseDTOs.PagedResult<QuizAttemptResponse>> GetPagedSubmissionsAsync(string classroomQuizId, int pageIndex, int pageSize)
        {
            var pagedAttempts = await _quizAttemptRepository.FindPagedByClassroomQuizIdAsync(classroomQuizId, pageIndex, pageSize);
            
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

        public async Task<QuizAttemptResponse> BuildEnrichedResponse(Models.QuizAttempt attempt)
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

            bool isSubmitted = attempt.Status == Models.QuizAttemptStatus.SUBMITTED;
            bool isInProgress = attempt.Status == Models.QuizAttemptStatus.INPROGRESS;

            if (isInProgress || isSubmitted)
            {
                int addedCount = 0;
                foreach (var qq in quiz.Questions)
                {
                    var qDetails = await _questionRepository.FindByIdAsync(qq.QuestionId);
                    if (qDetails != null)
                    {
                        qDetails.AnswerOptions = await _answerOptionRepository.FindByQuestionIdAsync(qq.QuestionId);
                        
                        response.Questions.Add(_mapper.ToStudentQuizQuestionResponse(qq, qDetails, isSubmitted));
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
                response.Answers = studentAnswers.ToDictionary(
                    a => a.QuestionId.ToLower(), 
                    a => (string.IsNullOrEmpty(a.AnswerOptionId) ? a.TextAnswer : a.AnswerOptionId) ?? ""
                );
                response.QuestionResults = studentAnswers.ToDictionary(
                    a => a.QuestionId.ToLower(),
                    a => a.IsCorrect
                );
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
