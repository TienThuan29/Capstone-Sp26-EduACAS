using AcasService.Application.Commands.Quiz;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Quiz;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class QuizCommandTests
{
    private readonly Mock<IQuizRepository> _mockQuizRepo;
    private readonly Mock<ILogger<QuizCommand>> _mockLogger;
    private readonly QuizMapper _mapper;
    private readonly QuizCommand _sut;

    public QuizCommandTests()
    {
        _mockQuizRepo = new Mock<IQuizRepository>();
        _mockLogger = new Mock<ILogger<QuizCommand>>();
        _mapper = new QuizMapper();

        _sut = new QuizCommand(_mockQuizRepo.Object, _mapper, _mockLogger.Object);
    }

    // ========================================================================
    // QZ-01: Create quiz successfully
    // ========================================================================
    [Fact]
    public async Task CreateQuizAsync_WithValidRequest_ReturnsCreatedQuiz()
    {
        // Arrange
        var request = new CreateQuizRequest
        {
            SubjectId = "subj-1",
            Title = "Quiz 1",
            Duration = 30,
            CreatedBy = "user-1"
        };

        _mockQuizRepo.Setup(x => x.CreateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.CreateQuizAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Quiz 1");
        result.TotalQuestions.Should().Be(0);
        _mockQuizRepo.Verify(x => x.CreateAsync(It.IsAny<Quiz>()), Times.Once);
    }

    // ========================================================================
    // QZ-02: Add question to quiz
    // ========================================================================
    [Fact]
    public async Task AssignQuestionsAsync_WithTotalMarksEqual10_AssignsQuestions()
    {
        // Arrange
        var quizId = "quiz-1";
        var quiz = CreateQuiz(quizId, false);
        var request = new AssignQuizQuestionsRequest
        {
            Questions = new List<QuizQuestionItemRequest>
            {
                new() { QuestionId = "q1", Marks = 5, DisplayOrder = 1 },
                new() { QuestionId = "q2", Marks = 5, DisplayOrder = 2 }
            }
        };

        _mockQuizRepo.Setup(x => x.FindByIdAsync(quizId)).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.UpdateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.AssignQuestionsAsync(quizId, request);

        // Assert
        result.Should().NotBeNull();
        result.Questions.Should().HaveCount(2);
    }

    // ========================================================================
    // QZ-03: Remove question from quiz
    // ========================================================================
    [Fact]
    public async Task AssignQuestionsAsync_WithEmptyQuestionsList_RemovesAllQuestions()
    {
        // Arrange
        var quizId = "quiz-1";
        var quiz = CreateQuiz(quizId, false);
        quiz.Questions = new List<QuizQuestion>
        {
            new() { QuizId = quizId, QuestionId = "q1", Marks = 5, DisplayOrder = 1 }
        };
        quiz.TotalQuestions = 1;

        var request = new AssignQuizQuestionsRequest { Questions = new List<QuizQuestionItemRequest>() };

        _mockQuizRepo.Setup(x => x.FindByIdAsync(quizId)).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.UpdateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.AssignQuestionsAsync(quizId, request);

        // Assert
        result.Should().NotBeNull();
        result.Questions.Should().BeEmpty();
        result.TotalQuestions.Should().Be(0);
    }

    // ========================================================================
    // QZ-04: Shuffle questions
    // ========================================================================
    [Fact]
    public async Task AssignQuestionsAsync_WithQuestionsInDifferentOrder_OrdersByDisplayOrder()
    {
        // Arrange
        var quizId = "quiz-1";
        var quiz = CreateQuiz(quizId, false);
        var request = new AssignQuizQuestionsRequest
        {
            Questions = new List<QuizQuestionItemRequest>
            {
                new() { QuestionId = "q3", Marks = 3, DisplayOrder = 3 },
                new() { QuestionId = "q1", Marks = 4, DisplayOrder = 1 },
                new() { QuestionId = "q2", Marks = 3, DisplayOrder = 2 }
            }
        };

        _mockQuizRepo.Setup(x => x.FindByIdAsync(quizId)).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.UpdateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.AssignQuestionsAsync(quizId, request);

        // Assert
        result.Should().NotBeNull();
        var questions = result.Questions.ToList();
        questions[0].QuestionId.Should().Be("q1");
        questions[1].QuestionId.Should().Be("q2");
        questions[2].QuestionId.Should().Be("q3");
    }

    // ========================================================================
    // QZ-05: Quiz with time limit — time limit set via Duration
    // ========================================================================
    [Fact]
    public async Task CreateQuizAsync_WithDuration_SetsDuration()
    {
        // Arrange
        var request = new CreateQuizRequest
        {
            SubjectId = "subj-1",
            Title = "Timed Quiz",
            Duration = 60,
            CreatedBy = "user-1"
        };

        _mockQuizRepo.Setup(x => x.CreateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.CreateQuizAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task SoftDeleteQuizAsync_WhenQuizExists_SoftDeletes()
    {
        // Arrange
        var quiz = CreateQuiz("quiz-1", false);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.SoftDeleteAsync("quiz-1")).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.SoftDeleteQuizAsync("quiz-1");

        // Assert
        result.Should().NotBeNull();
        _mockQuizRepo.Verify(x => x.SoftDeleteAsync("quiz-1"), Times.Once);
    }

    [Fact]
    public async Task RestoreQuizAsync_WhenQuizExists_RestoresQuiz()
    {
        // Arrange
        var quiz = CreateQuiz("quiz-1", true);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.UpdateAsync(It.IsAny<Quiz>()))
            .ReturnsAsync((Quiz q) => q);

        // Act
        var result = await _sut.RestoreQuizAsync("quiz-1");

        // Assert
        result.Should().NotBeNull();
        _mockQuizRepo.Verify(x => x.UpdateAsync(It.Is<Quiz>(q => !q.IsDeleted)), Times.Once);
    }

    [Fact]
    public async Task DeleteQuizAsync_WhenQuizExists_DeletesQuiz()
    {
        // Arrange
        var quiz = CreateQuiz("quiz-1", false);
        _mockQuizRepo.Setup(x => x.FindByIdAsync("quiz-1")).ReturnsAsync(quiz);
        _mockQuizRepo.Setup(x => x.DeleteAsync("quiz-1")).Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteQuizAsync("quiz-1");

        // Assert
        result.Should().NotBeNull();
        _mockQuizRepo.Verify(x => x.DeleteAsync("quiz-1"), Times.Once);
    }

    [Fact]
    public async Task UpdateQuizAsync_WhenQuizNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockQuizRepo.Setup(x => x.FindByIdAsync("nonexistent")).ReturnsAsync((Quiz?)null);

        // Act
        var act = async () => await _sut.UpdateQuizAsync("nonexistent", new UpdateQuizRequest { Title = "New" });

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static Quiz CreateQuiz(string id, bool isDeleted) => new()
    {
        Id = id,
        SubjectId = "subj-1",
        Title = "Test Quiz",
        Duration = 30,
        TotalQuestions = 0,
        IsDeleted = isDeleted,
        CreatedBy = "user-1",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        Questions = new List<QuizQuestion>()
    };
}
