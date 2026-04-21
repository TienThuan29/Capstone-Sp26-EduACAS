using AcasService.Application.Commands.QuizAttempt;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.QuizAttempt;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.AnswerOption;
using AcasService.Repositories.Caching.Redis.Quiz;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.Question;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.StudentAnswer;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class QuizAttemptCommandTests
{
    private readonly Mock<IQuizAttemptRepository> _mockAttemptRepo;
    private readonly Mock<IClassroomQuizRepository> _mockClassroomQuizRepo;
    private readonly Mock<IQuizRepository> _mockQuizRepo;
    private readonly Mock<IQuestionRepository> _mockQuestionRepo;
    private readonly Mock<IStudentAnswerRepository> _mockStudentAnswerRepo;
    private readonly Mock<IAnswerOptionRepository> _mockAnswerOptionRepo;
    private readonly TestableUserRequestProducer _userProducer;
    private readonly Mock<IQuizCache> _mockQuizCache;
    private readonly Mock<ILogger<QuizAttemptCommand>> _mockLogger;
    private readonly Mock<IQuizAttemptQuery> _mockAttemptQuery;
    private readonly QuizAttemptMapper _mapper;
    private readonly QuizAttemptCommand _sut;

    public QuizAttemptCommandTests()
    {
        _mockAttemptRepo = new Mock<IQuizAttemptRepository>();
        _mockClassroomQuizRepo = new Mock<IClassroomQuizRepository>();
        _mockQuizRepo = new Mock<IQuizRepository>();
        _mockQuestionRepo = new Mock<IQuestionRepository>();
        _mockStudentAnswerRepo = new Mock<IStudentAnswerRepository>();
        _mockAnswerOptionRepo = new Mock<IAnswerOptionRepository>();
        _mockQuizCache = new Mock<IQuizCache>();
        _mockLogger = new Mock<ILogger<QuizAttemptCommand>>();
        _mockAttemptQuery = new Mock<IQuizAttemptQuery>();
        _mapper = new QuizAttemptMapper();

        _userProducer = new TestableUserRequestProducer(
            Mock.Of<ILogger<UserRequestProducer>>());

        _mockQuizCache.Setup(x => x.GetQuizAttemptKey(It.IsAny<string>()))
            .Returns<string>(id => $"quiz:attempt:{id}");

        _sut = new QuizAttemptCommand(
            _mockAttemptRepo.Object,
            _mockClassroomQuizRepo.Object,
            _mockQuizRepo.Object,
            _mockQuestionRepo.Object,
            _mockStudentAnswerRepo.Object,
            _mockAnswerOptionRepo.Object,
            _userProducer,
            _mockQuizCache.Object,
            _mapper,
            _mockLogger.Object,
            _mockAttemptQuery.Object);
    }

    // ========================================================================
    // QA-01: Start quiz attempt
    // ========================================================================
    [Fact]
    public async Task StartAttemptAsync_WhenQuizOngoingAndWithinTimeWindow_StartsAttempt()
    {
        // Arrange
        var request = new StartQuizAttemptRequest
        {
            ClassroomQuizId = "cq-1",
            StudentId = "student-1"
        };

        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddHours(1), 1);
        var quiz = CreateQuiz("quiz-1");

        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockAttemptRepo.Setup(x => x.GetMaxAttemptNumberAsync("cq-1", "student-1"))
            .ReturnsAsync(0);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockAttemptRepo.Setup(x => x.CreateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => a);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = "attempt-new" });

        // Act
        var result = await _sut.StartAttemptAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockAttemptRepo.Verify(x => x.CreateAsync(It.Is<QuizAttempt>(
            a => a.StudentId == "student-1" && a.ClassroomQuizId == "cq-1" &&
                 a.AttemptNumber == 1)), Times.Once);
    }

    // ========================================================================
    // QA-02: Submit quiz with all answers
    // ========================================================================
    [Fact]
    public async Task SubmitAttemptAsync_WithInProgressAttempt_SubmitsAndGrades()
    {
        // Arrange
        var attemptId = "attempt-1";
        var attempt = CreateQuizAttempt(attemptId, "cq-1", "student-1",
            QuizAttemptStatus.INPROGRESS, 1);
        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddHours(1), 3);
        var quiz = CreateQuiz("quiz-1");
        quiz.Questions = new List<QuizQuestion>
        {
            new() { QuizId = "quiz-1", QuestionId = "q1", Marks = 10, DisplayOrder = 1 }
        };

        _mockAttemptRepo.Setup(x => x.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _mockQuizCache.Setup(x => x.GetAsync<Dictionary<string, string>>(It.IsAny<string>()))
            .ReturnsAsync(new Dictionary<string, string>());
        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuestionRepo.Setup(x => x.FindByIdAsync("q1")).ReturnsAsync(CreateQuestion("q1", QuestionType.SINGLE_CHOICE, "opt-1"));
        _mockAnswerOptionRepo.Setup(x => x.FindByQuestionIdAsync("q1"))
            .ReturnsAsync(new List<AnswerOption>
            {
                new() { Id = "opt-1", IsCorrect = true }
            });
        _mockStudentAnswerRepo.Setup(x => x.BatchCreateAsync(It.IsAny<List<StudentAnswer>>()))
            .Returns(Task.CompletedTask);
        _mockAttemptRepo.Setup(x => x.UpdateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => a);
        _mockQuizCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = attemptId });

        // Act
        var result = await _sut.SubmitAttemptAsync(attemptId);

        // Assert
        result.Should().NotBeNull();
        _mockStudentAnswerRepo.Verify(x => x.BatchCreateAsync(It.IsAny<List<StudentAnswer>>()), Times.Once);
    }

    // ========================================================================
    // QA-03: Submit quiz with missing answers
    // ========================================================================
    [Fact]
    public async Task SubmitAttemptAsync_WithMissingAnswers_StillSubmits()
    {
        // Arrange
        var attemptId = "attempt-1";
        var attempt = CreateQuizAttempt(attemptId, "cq-1", "student-1", QuizAttemptStatus.INPROGRESS, 1);
        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddHours(1), 3);
        var quiz = CreateQuiz("quiz-1");
        quiz.Questions = new List<QuizQuestion>
        {
            new() { QuizId = "quiz-1", QuestionId = "q1", Marks = 10, DisplayOrder = 1 }
        };

        _mockAttemptRepo.Setup(x => x.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _mockQuizCache.Setup(x => x.GetAsync<Dictionary<string, string>>(It.IsAny<string>()))
            .ReturnsAsync(new Dictionary<string, string>());
        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuestionRepo.Setup(x => x.FindByIdAsync("q1")).ReturnsAsync(CreateQuestion("q1", QuestionType.SINGLE_CHOICE, "opt-1"));
        _mockAnswerOptionRepo.Setup(x => x.FindByQuestionIdAsync("q1"))
            .ReturnsAsync(new List<AnswerOption>
            {
                new() { Id = "opt-1", IsCorrect = true }
            });
        _mockStudentAnswerRepo.Setup(x => x.BatchCreateAsync(It.IsAny<List<StudentAnswer>>()))
            .Returns(Task.CompletedTask);
        _mockAttemptRepo.Setup(x => x.UpdateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => a);
        _mockQuizCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = attemptId });

        // Act
        var result = await _sut.SubmitAttemptAsync(attemptId);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // QA-04: Auto grade correct answer
    // ========================================================================
    [Fact]
    public async Task SubmitAttemptAsync_WithCorrectAnswer_AwardsMarks()
    {
        // Arrange
        var attemptId = "attempt-correct";
        var attempt = CreateQuizAttempt(attemptId, "cq-1", "student-1", QuizAttemptStatus.INPROGRESS, 1);
        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddHours(1), 3);
        var quiz = CreateQuiz("quiz-1");
        quiz.Questions = new List<QuizQuestion>
        {
            new() { QuizId = "quiz-1", QuestionId = "q1", Marks = 10, DisplayOrder = 1 }
        };

        _mockAttemptRepo.Setup(x => x.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _mockQuizCache.Setup(x => x.GetAsync<Dictionary<string, string>>(It.IsAny<string>()))
            .ReturnsAsync(new Dictionary<string, string> { ["q1"] = "opt-correct" });
        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuestionRepo.Setup(x => x.FindByIdAsync("q1"))
            .ReturnsAsync(CreateQuestion("q1", QuestionType.SINGLE_CHOICE, "opt-correct"));
        _mockAnswerOptionRepo.Setup(x => x.FindByQuestionIdAsync("q1"))
            .ReturnsAsync(new List<AnswerOption>
            {
                new() { Id = "opt-correct", IsCorrect = true }
            });
        _mockStudentAnswerRepo.Setup(x => x.BatchCreateAsync(It.IsAny<List<StudentAnswer>>()))
            .Returns(Task.CompletedTask);
        _mockAttemptRepo.Setup(x => x.UpdateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => { a.FinalScore = 10; return a; });
        _mockQuizCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = attemptId });

        // Act
        var result = await _sut.SubmitAttemptAsync(attemptId);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // QA-05: Auto grade wrong answer
    // ========================================================================
    [Fact]
    public async Task SubmitAttemptAsync_WithWrongAnswer_AwardsZeroMarks()
    {
        // Arrange
        var attemptId = "attempt-wrong";
        var attempt = CreateQuizAttempt(attemptId, "cq-1", "student-1", QuizAttemptStatus.INPROGRESS, 1);
        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddHours(1), 3);
        var quiz = CreateQuiz("quiz-1");
        quiz.Questions = new List<QuizQuestion>
        {
            new() { QuizId = "quiz-1", QuestionId = "q1", Marks = 10, DisplayOrder = 1 }
        };

        _mockAttemptRepo.Setup(x => x.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _mockQuizCache.Setup(x => x.GetAsync<Dictionary<string, string>>(It.IsAny<string>()))
            .ReturnsAsync(new Dictionary<string, string> { ["q1"] = "opt-wrong" });
        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuestionRepo.Setup(x => x.FindByIdAsync("q1"))
            .ReturnsAsync(CreateQuestion("q1", QuestionType.SINGLE_CHOICE, "opt-correct"));
        _mockAnswerOptionRepo.Setup(x => x.FindByQuestionIdAsync("q1"))
            .ReturnsAsync(new List<AnswerOption>
            {
                new() { Id = "opt-correct", IsCorrect = true }
            });
        _mockStudentAnswerRepo.Setup(x => x.BatchCreateAsync(It.IsAny<List<StudentAnswer>>()))
            .Returns(Task.CompletedTask);
        _mockAttemptRepo.Setup(x => x.UpdateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => { a.FinalScore = 0; return a; });
        _mockQuizCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = attemptId });

        // Act
        var result = await _sut.SubmitAttemptAsync(attemptId);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // QA-06: Multiple attempts allowed
    // ========================================================================
    [Fact]
    public async Task StartAttemptAsync_WhenAttemptsRemaining_StartsNewAttempt()
    {
        // Arrange
        var request = new StartQuizAttemptRequest
        {
            ClassroomQuizId = "cq-1",
            StudentId = "student-1"
        };

        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow.AddHours(1), 3);
        var quiz = CreateQuiz("quiz-1");

        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockAttemptRepo.Setup(x => x.GetMaxAttemptNumberAsync("cq-1", "student-1"))
            .ReturnsAsync(2);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockAttemptRepo.Setup(x => x.CreateAsync(It.IsAny<QuizAttempt>()))
            .ReturnsAsync((QuizAttempt a) => a);
        _mockAttemptQuery.Setup(x => x.BuildEnrichedResponse(It.IsAny<QuizAttempt>()))
            .ReturnsAsync(new Application.ResponseDTOs.QuizAttemptResponse { Id = "attempt-3" });

        // Act
        var result = await _sut.StartAttemptAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // QA-07: Multiple attempts not allowed
    // ========================================================================
    [Fact]
    public async Task StartAttemptAsync_WhenMaxAttemptsReached_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new StartQuizAttemptRequest
        {
            ClassroomQuizId = "cq-1",
            StudentId = "student-1"
        };

        var classroomQuiz = CreateClassroomQuiz("cq-1", "quiz-1",
            ClassroomQuizStatus.ONGOING,
            DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow.AddHours(1), 1);

        _mockClassroomQuizRepo.Setup(x => x.FindByIdAsync("cq-1")).ReturnsAsync(classroomQuiz);
        _mockAttemptRepo.Setup(x => x.GetMaxAttemptNumberAsync("cq-1", "student-1"))
            .ReturnsAsync(1);

        // Act
        var act = async () => await _sut.StartAttemptAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("You have already reached the maximum allowed attempts (1) for this quiz.");
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static ClassroomQuiz CreateClassroomQuiz(
        string id, string quizId, ClassroomQuizStatus status,
        DateTime startTime, DateTime endTime, int maxAttempts) => new()
    {
        Id = id,
        QuizId = quizId,
        Status = status,
        StartTime = startTime,
        EndTime = endTime,
        MaxOfAttempts = maxAttempts,
        ClassroomId = "class-1",
        IsDeleted = false,
        CreatedBy = "user-1",
        CreatedAt = DateTime.UtcNow.AddDays(-1),
        UpdatedAt = DateTime.UtcNow
    };

    private static Quiz CreateQuiz(string id) => new()
    {
        Id = id,
        SubjectId = "subj-1",
        Title = "Test Quiz",
        Duration = 30,
        TotalQuestions = 1,
        IsDeleted = false,
        CreatedBy = "user-1",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        Questions = new List<QuizQuestion>()
    };

    private static QuizAttempt CreateQuizAttempt(
        string id, string cqId, string studentId,
        QuizAttemptStatus status, int attemptNumber) => new()
    {
        Id = id,
        ClassroomQuizId = cqId,
        StudentId = studentId,
        Status = status,
        AttemptNumber = attemptNumber,
        StartTime = DateTime.UtcNow.AddMinutes(-5),
        EndTime = null
    };

    private static Question CreateQuestion(string id, QuestionType type, string correctOptionId) => new()
    {
        Id = id,
        Content = "What is 2+2?",
        Type = type,
        AnswerOptions = new List<AnswerOption>
        {
            new() { Id = correctOptionId, IsCorrect = true, Content = "4" }
        }
    };
}
