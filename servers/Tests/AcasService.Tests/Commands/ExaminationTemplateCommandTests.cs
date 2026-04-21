using AcasService.Application.Commands.ExaminationTemplate;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.ExaminationTemplate;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ExaminationTemplateCommandTests
{
    private readonly Mock<IExaminationTemplateRepository> _mockRepo;
    private readonly Mock<ILogger<ExaminationTemplateCommand>> _mockLogger;
    private readonly ExaminationTemplateMapper _mapper;
    private readonly ExaminationTemplateCommand _sut;

    public ExaminationTemplateCommandTests()
    {
        _mockRepo = new Mock<IExaminationTemplateRepository>();
        _mockLogger = new Mock<ILogger<ExaminationTemplateCommand>>();
        _mapper = new ExaminationTemplateMapper();

        _sut = new ExaminationTemplateCommand(_mockRepo.Object, _mockLogger.Object);
    }

    // ========================================================================
    // ET-01: Create template
    // ========================================================================
    [Fact]
    public async Task CreateAsync_WithValidRequest_ReturnsCreatedTemplate()
    {
        // Arrange
        var request = new ExaminationTemplateRequest
        {
            ExamName = "Midterm Template",
            LecturerId = "lec-1",
            TotalMark = 10,
            Description = "Midterm exam template",
            Problems = new List<ExamTempProblemRequest>
            {
                new() { ProblemId = "p1", Mark = 5 },
                new() { ProblemId = "p2", Mark = 5 }
            }
        };

        _mockRepo.Setup(x => x.CreateAsync(It.IsAny<ExaminationTemplate>()))
            .ReturnsAsync((ExaminationTemplate t) => t);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.ExamName.Should().Be("Midterm Template");
        _mockRepo.Verify(x => x.CreateAsync(It.IsAny<ExaminationTemplate>()), Times.Once);
    }

    // ========================================================================
    // ET-02: Copy template to new exam
    // ========================================================================
    [Fact]
    public async Task CreateAsync_WithProblems_CreatesTemplateWithProblems()
    {
        // Arrange
        var request = new ExaminationTemplateRequest
        {
            ExamName = "Copy Template",
            LecturerId = "lec-1",
            TotalMark = 10,
            Problems = new List<ExamTempProblemRequest>
            {
                new() { ProblemId = "prob-1", Mark = 3 },
                new() { ProblemId = "prob-2", Mark = 7 }
            }
        };

        _mockRepo.Setup(x => x.CreateAsync(It.IsAny<ExaminationTemplate>()))
            .ReturnsAsync((ExaminationTemplate t) => t);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // ET-03: Update template
    // ========================================================================
    [Fact]
    public async Task UpdateAsync_WhenTemplateExists_UpdatesAndReturns()
    {
        // Arrange
        var template = CreateTemplate("tmpl-1");
        var request = new UpdateExaminationTemplateRequest
        {
            ExamName = "Updated Template",
            TotalMark = 10,
            Problems = new List<ExamTempProblemRequest>
            {
                new() { ProblemId = "p1", Mark = 10 }
            }
        };

        _mockRepo.Setup(x => x.FindByIdAsync("tmpl-1")).ReturnsAsync(template);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<ExaminationTemplate>()))
            .ReturnsAsync((ExaminationTemplate t) => t);

        // Act
        var result = await _sut.UpdateAsync("tmpl-1", request);

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<ExaminationTemplate>()), Times.Once);
    }

    // ========================================================================
    // ET-04: Delete template
    // ========================================================================
    [Fact]
    public async Task DeleteAsync_WhenTemplateExists_DeletesTemplate()
    {
        // Arrange
        var template = CreateTemplate("tmpl-1");
        _mockRepo.Setup(x => x.FindByIdAsync("tmpl-1")).ReturnsAsync(template);
        _mockRepo.Setup(x => x.DeleteAsync("tmpl-1")).Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync("tmpl-1");

        // Assert
        _mockRepo.Verify(x => x.DeleteAsync("tmpl-1"), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task CreateAsync_WhenTotalMarkOutOfRange_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExaminationTemplateRequest
        {
            ExamName = "Invalid Template",
            LecturerId = "lec-1",
            TotalMark = 15  // out of range (>10)
        };

        // Act
        var act = async () => await _sut.CreateAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Total mark must be between 1 and 10.");
    }

    [Fact]
    public async Task CreateAsync_WhenProblemMarkExceedsTotal_ThrowsArgumentException()
    {
        // Arrange
        var request = new ExaminationTemplateRequest
        {
            ExamName = "Invalid Template",
            LecturerId = "lec-1",
            TotalMark = 10,
            Problems = new List<ExamTempProblemRequest>
            {
                new() { ProblemId = "p1", Mark = 8 },
                new() { ProblemId = "p2", Mark = 5 } // 8+5 = 13 > 10
            }
        };

        // Act
        var act = async () => await _sut.CreateAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*cannot exceed total mark*");
    }

    [Fact]
    public async Task UpdateAsync_WhenTemplateNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((ExaminationTemplate?)null);

        var request = new UpdateExaminationTemplateRequest
        {
            ExamName = "Updated",
            TotalMark = 10
        };

        // Act
        var act = async () => await _sut.UpdateAsync("nonexistent", request);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_WhenTemplateNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((ExaminationTemplate?)null);

        // Act
        var act = async () => await _sut.DeleteAsync("nonexistent");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task SoftDeleteAsync_WhenTemplateExists_SoftDeletes()
    {
        // Arrange
        var template = CreateTemplate("tmpl-1");
        _mockRepo.Setup(x => x.SoftDeleteAsync("tmpl-1"))
            .ReturnsAsync(template);

        // Act
        var result = await _sut.SoftDeleteAsync("tmpl-1");

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task RestoreAsync_WhenTemplateExists_Restores()
    {
        // Arrange
        var template = CreateTemplate("tmpl-1");
        _mockRepo.Setup(x => x.RestoreAsync("tmpl-1"))
            .ReturnsAsync(template);

        // Act
        var result = await _sut.RestoreAsync("tmpl-1");

        // Assert
        result.Should().NotBeNull();
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static ExaminationTemplate CreateTemplate(string id) => new()
    {
        Id = id,
        ExamName = "Test Template",
        LecturerId = "lec-1",
        TotalMark = 10,
        IsDeleted = false,
        Problems = new List<ExamTempProblem>(),
        CreatedDate = DateTime.UtcNow
    };
}
