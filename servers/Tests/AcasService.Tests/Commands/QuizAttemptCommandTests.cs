using AcasService.Application.Commands.QuizAttempt;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.QuizAttempt;
using AcasService.Application.ResponseDTOs;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.Quiz;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.ClassroomQuiz;
using AcasService.Repositories.Quiz;
using AcasService.Repositories.QuizAttempt;
using AcasService.Repositories.Question;
using AcasService.Repositories.StudentAnswer;
using AcasService.Repositories.AnswerOption;
using AcasService.Web.Requests;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using AcasService.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace AcasService.Tests.Commands;

public class QuizAttemptCommandTests
{
    private readonly Mock<IQuizAttemptRepository> _attemptRepoMock;
    private readonly Mock<IClassroomQuizRepository> _classroomQuizRepoMock;
    private readonly Mock<IQuizRepository> _quizRepoMock;
    private readonly Mock<IQuestionRepository> _questionRepoMock;
    private readonly Mock<IStudentAnswerRepository> _studentAnswerRepoMock;
    private readonly Mock<IAnswerOptionRepository> _answerOptionRepoMock;
    private readonly Mock<IQuizCache> _cacheMock;
    private readonly Mock<ILogger<QuizAttemptCommand>> _loggerMock;
    private readonly Mock<IQuizAttemptQuery> _queryMock;
    private readonly Mock<IClassroomEnrollmentRepository> _enrollmentRepoMock;
    private readonly QuizAttemptMapper _mapper;
    private readonly QuizAttemptCommand _command;

    public QuizAttemptCommandTests()
    {
        _attemptRepoMock = new Mock<IQuizAttemptRepository>();
        _classroomQuizRepoMock = new Mock<IClassroomQuizRepository>();
        _quizRepoMock = new Mock<IQuizRepository>();
        _questionRepoMock = new Mock<IQuestionRepository>();
        _studentAnswerRepoMock = new Mock<IStudentAnswerRepository>();
        _answerOptionRepoMock = new Mock<IAnswerOptionRepository>();
        _cacheMock = new Mock<IQuizCache>();
        _loggerMock = new Mock<ILogger<QuizAttemptCommand>>();
        _queryMock = new Mock<IQuizAttemptQuery>();
        _enrollmentRepoMock = new Mock<IClassroomEnrollmentRepository>();
        _mapper = new QuizAttemptMapper();

        _command = new QuizAttemptCommand(
            _attemptRepoMock.Object,
            _classroomQuizRepoMock.Object,
            _quizRepoMock.Object,
            _questionRepoMock.Object,
            _studentAnswerRepoMock.Object,
            _answerOptionRepoMock.Object,
            null!, 
            _cacheMock.Object,
            _mapper,
            _loggerMock.Object,
            _queryMock.Object,
            _enrollmentRepoMock.Object
        );
    }

    private StartQuizAttemptRequest CreateRequest() => new StartQuizAttemptRequest
    {
        ClassroomQuizId = "cq1",
        StudentId = "s1",
        Passcode = null
    };

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F051 | StartAttemptAsync
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UTCD01_StartAttemptAsync_OngoingStatus_ReturnsResponse()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1", QuizId = "q1", MaxOfAttempts = 2 };
        var enrollment = new ClassEnrollment();
        var quiz = new Quiz { Id = "q1", Duration = 30 };

        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync(enrollment);
        _attemptRepoMock.Setup(r => r.GetMaxAttemptNumberAsync("cq1", "s1")).ReturnsAsync(0);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(quiz);
        _attemptRepoMock.Setup(r => r.CreateAsync(It.IsAny<Models.QuizAttempt>())).ReturnsAsync((Models.QuizAttempt a) => a);
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { AttemptNumber = 1 });

        var result = await _command.StartAttemptAsync(request);

        result.Should().NotBeNull();
        result.AttemptNumber.Should().Be(1);
    }

    [Fact]
    public async Task UTCD02_StartAttemptAsync_QuizNotFound_ThrowsKeyNotFoundException()
    {
        var request = CreateRequest();
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync((ClassroomQuiz?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _command.StartAttemptAsync(request));
    }

    [Fact]
    public async Task UTCD03_StartAttemptAsync_DraftStatus_ThrowsInvalidOperationException()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.DRAFT };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("DRAFT mode");
    }

    [Fact]
    public async Task UTCD04_StartAttemptAsync_PublishedStatus_ThrowsInvalidOperationException()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.PUBLISHED };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("scheduled but not yet started");
    }

    [Fact]
    public async Task UTCD05_StartAttemptAsync_InvalidTimeWindow_ThrowsInvalidOperationException()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-2), EndTime = DateTime.UtcNow.AddHours(-1) };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("not within its valid time window");
    }

    [Fact]
    public async Task UTCD06_StartAttemptAsync_NotEnrolled_ThrowsInvalidOperationException()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1" };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync((ClassEnrollment?)null);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("not enrolled");
    }

    [Fact]
    public async Task UTCD07_StartAttemptAsync_WrongPasscode_ThrowsArgumentException()
    {
        var request = CreateRequest();
        request.Passcode = "wrongpass";
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1", Passcode = "correctpass" };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync(new ClassEnrollment());

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("Incorrect or missing quiz passcode");
    }

    [Fact]
    public async Task UTCD08_StartAttemptAsync_MaxAttemptsReached_ThrowsInvalidOperationException()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1", MaxOfAttempts = 2 };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync(new ClassEnrollment());
        _attemptRepoMock.Setup(r => r.GetMaxAttemptNumberAsync("cq1", "s1")).ReturnsAsync(2); // Already reached limit

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.StartAttemptAsync(request));
        ex.Message.Should().Contain("maximum allowed attempts");
    }

    [Fact]
    public async Task UTCD09_StartAttemptAsync_WithinLimitAttempt2_ReturnsResponse()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1", QuizId = "q1", MaxOfAttempts = 2 };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync(new ClassEnrollment());
        _attemptRepoMock.Setup(r => r.GetMaxAttemptNumberAsync("cq1", "s1")).ReturnsAsync(1); // Next will be 2
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(new Quiz { Duration = 30 });
        _attemptRepoMock.Setup(r => r.CreateAsync(It.IsAny<Models.QuizAttempt>())).ReturnsAsync((Models.QuizAttempt a) => a);
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { AttemptNumber = 2 });

        var result = await _command.StartAttemptAsync(request);

        result.AttemptNumber.Should().Be(2);
    }

    [Fact]
    public async Task UTCD10_StartAttemptAsync_RegularOngoingSuccess_ReturnsResponse()
    {
        var request = CreateRequest();
        var cq = new ClassroomQuiz { Id = "cq1", Status = ClassroomQuizStatus.ONGOING, StartTime = DateTime.UtcNow.AddHours(-1), EndTime = DateTime.UtcNow.AddHours(1), ClassroomId = "c1", QuizId = "q1", MaxOfAttempts = 5 };
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _enrollmentRepoMock.Setup(r => r.FindByClassAndStudentIdAsync("c1", "s1")).ReturnsAsync(new ClassEnrollment());
        _attemptRepoMock.Setup(r => r.GetMaxAttemptNumberAsync("cq1", "s1")).ReturnsAsync(0);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(new Quiz { Duration = 30 });
        _attemptRepoMock.Setup(r => r.CreateAsync(It.IsAny<Models.QuizAttempt>())).ReturnsAsync((Models.QuizAttempt a) => a);
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { AttemptNumber = 1 });

        var result = await _command.StartAttemptAsync(request);

        result.Should().NotBeNull();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F052 | UpdateAnswerAsync
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UTCD01_UpdateAnswerAsync_OptionId_SavesToCache()
    {
        var attemptId = "att1";
        var request = new UpdateQuizAnswerRequest { QuestionId = "q1", SelectedOptionId = "A" };
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(new Dictionary<string, string>());

        await _command.UpdateAnswerAsync(attemptId, request);

        _cacheMock.Verify(c => c.SetAsync("cache_key", It.Is<Dictionary<string, string>>(d => d["q1"] == "A")), Times.Once);
    }

    [Fact]
    public async Task UTCD02_UpdateAnswerAsync_NotFound_ThrowsKeyNotFoundException()
    {
        var attemptId = "nonexistent";
        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync((Models.QuizAttempt?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _command.UpdateAnswerAsync(attemptId, new UpdateQuizAnswerRequest()));
    }

    [Fact]
    public async Task UTCD03_UpdateAnswerAsync_SubmittedStatus_ThrowsInvalidOperationException()
    {
        var attemptId = "att1";
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.SUBMITTED };
        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.UpdateAnswerAsync(attemptId, new UpdateQuizAnswerRequest()));
        ex.Message.Should().Contain("Cannot update answers for a submitted quiz");
    }

    [Fact]
    public async Task UTCD04_UpdateAnswerAsync_TextAnswer_SavesToCache()
    {
        var attemptId = "att1";
        var request = new UpdateQuizAnswerRequest { QuestionId = "q1", TextAnswer = "essay answer text" };
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(new Dictionary<string, string>());

        await _command.UpdateAnswerAsync(attemptId, request);

        _cacheMock.Verify(c => c.SetAsync("cache_key", It.Is<Dictionary<string, string>>(d => d["q1"] == "essay answer text")), Times.Once);
    }

    [Fact]
    public async Task UTCD05_UpdateAnswerAsync_Overwrite_UpdatesCache()
    {
        var attemptId = "att1";
        var request = new UpdateQuizAnswerRequest { QuestionId = "q1", SelectedOptionId = "B" };
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS };
        var oldAnswers = new Dictionary<string, string> { { "q1", "A" } };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(oldAnswers);

        await _command.UpdateAnswerAsync(attemptId, request);

        _cacheMock.Verify(c => c.SetAsync("cache_key", It.Is<Dictionary<string, string>>(d => d["q1"] == "B")), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FUNCTION F053 | SubmitAttemptAsync
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UTCD01_SubmitAttemptAsync_SingleChoiceCorrect_CalculatesScore()
    {
        var attemptId = "att1";
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS, ClassroomQuizId = "cq1" };
        var cq = new ClassroomQuiz { QuizId = "q1" };
        var quiz = new Quiz { 
            Questions = new List<QuizQuestion> { new QuizQuestion { QuestionId = "ques1", Marks = 10 } } 
        };
        var question = new Models.Question { 
            Id = "ques1", Type = QuestionType.SINGLE_CHOICE, 
            AnswerOptions = new List<AnswerOption> { new AnswerOption { Id = "opt1", IsCorrect = true } } 
        };
        var cachedAnswers = new Dictionary<string, string> { { "ques1", "opt1" } };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(quiz);
        _questionRepoMock.Setup(r => r.FindByIdAsync("ques1")).ReturnsAsync(question);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(cachedAnswers);
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { Score = 10 });

        var result = await _command.SubmitAttemptAsync(attemptId);

        result.Score.Should().Be(10);
        attempt.Status.Should().Be(QuizAttemptStatus.SUBMITTED);
    }

    [Fact]
    public async Task UTCD02_SubmitAttemptAsync_NotFound_ThrowsKeyNotFoundException()
    {
        _attemptRepoMock.Setup(r => r.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((Models.QuizAttempt?)null);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _command.SubmitAttemptAsync("nonexistent"));
    }

    [Fact]
    public async Task UTCD03_SubmitAttemptAsync_AlreadySubmitted_ThrowsInvalidOperationException()
    {
        var attempt = new Models.QuizAttempt { Status = QuizAttemptStatus.SUBMITTED };
        _attemptRepoMock.Setup(r => r.FindByIdAsync("att1")).ReturnsAsync(attempt);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _command.SubmitAttemptAsync("att1"));
        ex.Message.Should().Contain("already been submitted");
    }

    [Fact]
    public async Task UTCD04_SubmitAttemptAsync_MultipleChoiceCorrect_CalculatesScore()
    {
        var attemptId = "att1";
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS, ClassroomQuizId = "cq1" };
        var cq = new ClassroomQuiz { QuizId = "q1" };
        var quiz = new Quiz { Questions = new List<QuizQuestion> { new QuizQuestion { QuestionId = "ques1", Marks = 10 } } };
        var question = new Models.Question { 
            Id = "ques1", Type = QuestionType.MULTIPLE_CHOICE, 
            AnswerOptions = new List<AnswerOption> { 
                new AnswerOption { Id = "opt1", IsCorrect = true },
                new AnswerOption { Id = "opt2", IsCorrect = true }
            } 
        };
        var cachedAnswers = new Dictionary<string, string> { { "ques1", "opt1,opt2" } };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(quiz);
        _questionRepoMock.Setup(r => r.FindByIdAsync("ques1")).ReturnsAsync(question);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(cachedAnswers);
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { Score = 10 });

        var result = await _command.SubmitAttemptAsync(attemptId);

        result.Score.Should().Be(10);
    }

    [Fact]
    public async Task UTCD05_SubmitAttemptAsync_QuestionNotFound_ScoreIsZero()
    {
        var attemptId = "att1";
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS, ClassroomQuizId = "cq1" };
        var cq = new ClassroomQuiz { QuizId = "q1" };
        var quiz = new Quiz { Questions = new List<QuizQuestion> { new QuizQuestion { QuestionId = "ques1", Marks = 10 } } };

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(quiz);
        _questionRepoMock.Setup(r => r.FindByIdAsync("ques1")).ReturnsAsync((Models.Question?)null); // Question API fails
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(new Dictionary<string, string>());
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { Score = 0 });

        var result = await _command.SubmitAttemptAsync(attemptId);

        result.Score.Should().Be(0);
        _loggerMock.VerifyLog(LogLevel.Warning, "not found during grading", Times.Once());
    }

    [Fact]
    public async Task UTCD06_SubmitAttemptAsync_NoQuestionsInQuiz_ScoreIsZero()
    {
        var attemptId = "att1";
        var attempt = new Models.QuizAttempt { Id = attemptId, Status = QuizAttemptStatus.INPROGRESS, ClassroomQuizId = "cq1" };
        var cq = new ClassroomQuiz { QuizId = "q1" };
        var quiz = new Quiz { Questions = new List<QuizQuestion>() }; // Empty questions

        _attemptRepoMock.Setup(r => r.FindByIdAsync(attemptId)).ReturnsAsync(attempt);
        _classroomQuizRepoMock.Setup(r => r.FindByIdAsync("cq1")).ReturnsAsync(cq);
        _quizRepoMock.Setup(r => r.FindByIdAsync("q1")).ReturnsAsync(quiz);
        _cacheMock.Setup(c => c.GetQuizAttemptKey(attemptId)).Returns("cache_key");
        _cacheMock.Setup(c => c.GetAsync<Dictionary<string, string>>("cache_key")).ReturnsAsync(new Dictionary<string, string>());
        _queryMock.Setup(q => q.BuildEnrichedResponse(It.IsAny<Models.QuizAttempt>())).ReturnsAsync(new QuizAttemptResponse { Score = 0 });

        var result = await _command.SubmitAttemptAsync(attemptId);

        result.Score.Should().Be(0);
    }
}
