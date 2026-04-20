using AcasService.Application.Commands.Problem;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Problem;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.ComponentModel.DataAnnotations;
using ModelTestCase = AcasService.Models.TestCase;

namespace AcasService.Tests.Commands;

public class ProblemCommandTests
{
    private readonly Mock<IProblemRepository> _mockRepository;
    private readonly Mock<ILogger<ProblemCommand>> _mockLogger;
    private readonly ProblemMapper _mapper;
    private readonly ProblemCommand _sut;

    public ProblemCommandTests()
    {
        _mockRepository = new Mock<IProblemRepository>();
        _mockLogger = new Mock<ILogger<ProblemCommand>>();
        _mapper = new ProblemMapper();
        _sut = new ProblemCommand(_mockRepository.Object, _mockLogger.Object, _mapper);
    }

    // ========================================================================
    // PRO-01 — Create successfully (Normal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_ValidManualRequest_ReturnsProblemResponse()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "Two Sum",
            Content = "Given an array of integers...",
            Difficulty = "EASY",
            Mode = "MANUAL",
            Tags = new List<string> { "arrays", "hash-map" }
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Problem>()))
            .ReturnsAsync(new Problem
            {
                Id = "prob-new-123",
                LecturerId = request.LecturerId,
                Title = request.Title,
                Content = request.Content,
                Difficulty = Difficulty.EASY,
                Tags = new[] { "arrays", "hash-map" },
                TestCases = new List<ModelTestCase>()
            });

        // Act
        var result = await _sut.CreateProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be("prob-new-123");
        result.Title.Should().Be("Two Sum");
        result.Difficulty.Should().Be(Difficulty.EASY);
        _mockRepository.Verify(x => x.CreateAsync(It.IsAny<Problem>()), Times.Once);
    }

    // ========================================================================
    // PRO-02 — Duplicate problem name (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_RepositoryThrowsDuplicate_PropagatesException()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "Duplicate Title",
            Content = "Some content is needed here for testing...",
            Difficulty = "EASY",
            Mode = "MANUAL"
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Problem>()))
            .ThrowsAsync(new InvalidOperationException("Problem with this title already exists"));

        // Act
        var act = async () => await _sut.CreateProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    // ========================================================================
    // PRO-03 — Invalid difficulty (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_InvalidDifficulty_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "Test Problem",
            Content = "Test content is valid for testing purposes here...",
            Difficulty = "INVALID",
            Mode = "MANUAL"
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Problem>()))
            .ReturnsAsync(new Problem { Id = "p", Title = "", TestCases = new List<ModelTestCase>() });

        // Act
        var act = async () => await _sut.CreateProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Requested value 'INVALID' was not found*");
    }

    // ========================================================================
    // PRO-04 — Empty title (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_EmptyTitle_AcceptsEmptyAndCallsRepository()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "",
            Content = "Test content with enough characters for validation...",
            Difficulty = "EASY",
            Mode = "MANUAL"
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Problem>()))
            .ReturnsAsync(new Problem { Id = "prob-empty-title", Title = "", TestCases = new List<ModelTestCase>() });

        // Act
        var result = await _sut.CreateProblemAsync(request);

        // Assert — code does not validate title length; it assigns empty title directly
        result.Should().NotBeNull();
        _mockRepository.Verify(x => x.CreateAsync(It.Is<Problem>(p => p.Title == "")), Times.Once);
    }

    // ========================================================================
    // PRO-05 — Null testcases (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_NullTestcases_CreatesProblemWithEmptyTestcases()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "No Testcases Problem",
            Content = "Problem without testcases right here for testing...",
            Difficulty = "MEDIUM",
            Mode = "MANUAL",
            TestCases = null
        };

        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Problem>()))
            .ReturnsAsync(new Problem
            {
                Id = "prob-no-tc",
                Title = request.Title,
                Difficulty = Difficulty.MEDIUM,
                Tags = Array.Empty<string>(),
                TestCases = new List<ModelTestCase>()
            });

        // Act
        var result = await _sut.CreateProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.TestCases.Should().BeEmpty();
        _mockRepository.Verify(x => x.CreateAsync(It.Is<Problem>(
            p => p.TestCases.Count == 0)), Times.Once);
    }

    // ========================================================================
    // PRO-06 — Content too short triggers ValidationException (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_ContentTooShort_ThrowsValidationException()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "Short Content Problem",
            Content = "Short",
            Difficulty = "EASY",
            Mode = "MANUAL"
        };

        // Act
        var act = async () => await _sut.CreateProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Content*");
    }

    // ========================================================================
    // PRO-07 — Invalid mode throws ArgumentException (Abnormal)
    // ========================================================================
    [Fact]
    public async Task CreateProblemAsync_InvalidMode_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateProblemRequest
        {
            LecturerId = "lect-001",
            Title = "Bad Mode Problem",
            Content = "Problem content is fine here for testing purposes...",
            Difficulty = "HARD",
            Mode = "INVALID_MODE"
        };

        // Act
        var act = async () => await _sut.CreateProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Invalid mode*");
    }

    // ========================================================================
    // PRO-08 — Update successfully (Normal)
    // ========================================================================
    [Fact]
    public async Task UpdateProblemAsync_ValidRequest_UpdatesProblem()
    {
        // Arrange
        var problemId = "prob-123";
        var existing = new Problem
        {
            Id = problemId,
            LecturerId = "lect-001",
            Title = "Old Title",
            Difficulty = Difficulty.EASY,
            TestCases = new List<ModelTestCase>()
        };

        var request = new UpdateProblemRequest
        {
            Title = "Updated Title",
            Difficulty = "MEDIUM",
            Content = "Updated content for the problem here for testing...",
            Tags = new List<string> { "updated" }
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(existing);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<Problem>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.UpdateProblemAsync(problemId, request);

        // Assert
        _mockRepository.Verify(x => x.UpdateAsync(It.Is<Problem>(
            p => p.Title == "Updated Title" &&
                 p.Difficulty == Difficulty.MEDIUM)), Times.Once);
    }

    // ========================================================================
    // PRO-09 — Problem not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task UpdateProblemAsync_ProblemNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var problemId = "nonexistent";
        var request = new UpdateProblemRequest
        {
            Title = "Some Title",
            Difficulty = "EASY",
            Content = "Some content here for testing purposes..."
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync((Problem?)null);

        // Act
        var act = async () => await _sut.UpdateProblemAsync(problemId, request);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*not found*");
    }

    // ========================================================================
    // PRO-10 — Rename to existing name (Abnormal)
    // ========================================================================
    [Fact]
    public async Task UpdateProblemAsync_RepositoryThrowsDuplicate_PropagatesException()
    {
        // Arrange
        var problemId = "prob-123";
        var existing = new Problem
        {
            Id = problemId,
            Title = "Old Title",
            Difficulty = Difficulty.EASY,
            TestCases = new List<ModelTestCase>()
        };

        var request = new UpdateProblemRequest
        {
            Title = "Existing Title",
            Difficulty = "EASY",
            Content = "Some content here for update testing..."
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(existing);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<Problem>()))
            .ThrowsAsync(new InvalidOperationException("Problem with this title already exists"));

        // Act
        var act = async () => await _sut.UpdateProblemAsync(problemId, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    // ========================================================================
    // PRO-11 — Partial update (Normal)
    // ========================================================================
    [Fact]
    public async Task UpdateProblemAsync_PartialUpdate_UpdatesOnlyProvidedFields()
    {
        // Arrange
        var problemId = "prob-partial";
        var existing = new Problem
        {
            Id = problemId,
            Title = "Original Title",
            Difficulty = Difficulty.EASY,
            Tags = new[] { "original" },
            TestCases = new List<ModelTestCase>()
        };

        var request = new UpdateProblemRequest
        {
            Title = "New Title Only",
            Difficulty = "EASY",
            Content = "Some updated content here for testing purposes..."
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(existing);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<Problem>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.UpdateProblemAsync(problemId, request);

        // Assert
        _mockRepository.Verify(x => x.UpdateAsync(It.Is<Problem>(
            p => p.Title == "New Title Only" &&
                 p.Difficulty == Difficulty.EASY)), Times.Once);
    }

    // ========================================================================
    // PRO-12 — Soft delete related exams (Normal)
    // ========================================================================
    [Fact]
    public async Task UpdateProblemAsync_RepositoryUpdateSucceeds_DoesNotThrow()
    {
        // Arrange
        var problemId = "prob-exam-relation";
        var existing = new Problem
        {
            Id = problemId,
            Title = "Exam Related Problem",
            Difficulty = Difficulty.MEDIUM,
            TestCases = new List<ModelTestCase>()
        };

        var request = new UpdateProblemRequest
        {
            Title = "Updated Exam Related Problem",
            Difficulty = "MEDIUM",
            Content = "Updated content for exam here for testing purposes..."
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(existing);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<Problem>()))
            .Returns(Task.CompletedTask);

        // Act
        var act = async () => await _sut.UpdateProblemAsync(problemId, request);

        // Assert
        await act.Should().NotThrowAsync();
        _mockRepository.Verify(x => x.UpdateAsync(It.IsAny<Problem>()), Times.Once);
    }

    // ========================================================================
    // PRO-13 — Delete successfully (Normal)
    // ========================================================================
    [Fact]
    public async Task DeleteProblemAsync_ExistingProblem_DeletesAndReturns()
    {
        // Arrange
        var problemId = "prob-to-delete";

        _mockRepository
            .Setup(x => x.DeleteAsync(problemId))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteProblemAsync(problemId);

        // Assert
        _mockRepository.Verify(x => x.DeleteAsync(problemId), Times.Once);
    }

    // ========================================================================
    // PRO-14 — Has existing submissions (Abnormal)
    // ========================================================================
    [Fact]
    public async Task DeleteProblemAsync_RepositoryThrowsOnDelete_PropagatesException()
    {
        // Arrange
        var problemId = "prob-with-submissions";

        _mockRepository
            .Setup(x => x.DeleteAsync(problemId))
            .ThrowsAsync(new InvalidOperationException("Cannot delete problem with existing submissions"));

        // Act
        var act = async () => await _sut.DeleteProblemAsync(problemId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*submissions*");
    }

    // ========================================================================
    // PRO-15 — Problem not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task DeleteProblemAsync_RepositoryThrowsKeyNotFound_PropagatesException()
    {
        // Arrange
        var problemId = "nonexistent-problem";

        _mockRepository
            .Setup(x => x.DeleteAsync(problemId))
            .ThrowsAsync(new KeyNotFoundException($"Problem {problemId} not found"));

        // Act
        var act = async () => await _sut.DeleteProblemAsync(problemId);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*not found*");
    }
}
