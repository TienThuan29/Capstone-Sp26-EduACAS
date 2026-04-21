using AcasService.Application.Commands.KeystrokeLogs;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.KeystrokeLogs;
using AcasService.Repositories.KeystrokeLogs;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class KeystrokeLogsCommandTests
{
    private readonly Mock<IKeystrokeLogsCache> _mockCache;
    private readonly Mock<IKeystrokeLogRepository> _mockRepository;
    private readonly Mock<ISubmissionRepository> _mockSubmissionRepo;
    private readonly Mock<ILogger<KeystrokeLogsCommand>> _mockLogger;
    private readonly KeystrokeLogsMapper _mapper;
    private readonly KeystrokeLogsCommand _sut;

    public KeystrokeLogsCommandTests()
    {
        _mockCache = new Mock<IKeystrokeLogsCache>();
        _mockRepository = new Mock<IKeystrokeLogRepository>();
        _mockSubmissionRepo = new Mock<ISubmissionRepository>();
        _mockLogger = new Mock<ILogger<KeystrokeLogsCommand>>();
        _mapper = new KeystrokeLogsMapper();

        _mockCache.Setup(x => x.GetCacheKey(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns<string, string, string>((e, s, p) => $"ksl:{e}:{s}:{p}");

        _sut = new KeystrokeLogsCommand(
            _mockCache.Object,
            _mockRepository.Object,
            _mockSubmissionRepo.Object,
            _mapper,
            _mockLogger.Object);
    }

    // ========================================================================
    // KSL-01: Save single keystroke
    // ========================================================================
    [Fact]
    public async Task CacheKeystrokeLogsAsync_WithValidRecord_CachesAndReturnsResponse()
    {
        // Arrange
        var records = new List<KeystrokeRecord>
        {
            new() { TimeStartSet = "1000", TimeOffSet = "1100", Duration = 100, Cps = 10, CharCount = 5 }
        };

        var request = new CacheKeystrokeLogsRequest
        {
            ExaminationId = "exam-1",
            StudentId = "student-1",
            ProblemId = "prob-1",
            KeystrokeData = records
        };

        _mockCache.Setup(x => x.GetAsync<List<KeystrokeRecord>>(It.IsAny<string>()))
            .ReturnsAsync((List<KeystrokeRecord>?)null);
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<KeystrokeRecord>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CacheKeystrokeLogsAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.KeystrokeData.Count.Should().Be(1);
        _mockCache.Verify(x => x.SetAsync(
            It.IsAny<string>(),
            It.Is<List<KeystrokeRecord>>(r => r.Count == 1)), Times.Once);
    }

    // ========================================================================
    // KSL-02: Batch save keystrokes
    // ========================================================================
    [Fact]
    public async Task CacheKeystrokeLogsAsync_WithMultipleRecords_CachesAllRecords()
    {
        // Arrange
        var records = new List<KeystrokeRecord>
        {
            new() { TimeStartSet = "1000", TimeOffSet = "1100", Duration = 100, Cps = 10, CharCount = 5 },
            new() { TimeStartSet = "1100", TimeOffSet = "1200", Duration = 100, Cps = 10, CharCount = 5 },
            new() { TimeStartSet = "1200", TimeOffSet = "1300", Duration = 100, Cps = 10, CharCount = 5 }
        };

        var request = new CacheKeystrokeLogsRequest
        {
            ExaminationId = "exam-1",
            StudentId = "student-1",
            ProblemId = "prob-1",
            KeystrokeData = records
        };

        _mockCache.Setup(x => x.GetAsync<List<KeystrokeRecord>>(It.IsAny<string>()))
            .ReturnsAsync((List<KeystrokeRecord>?)null);
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<KeystrokeRecord>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CacheKeystrokeLogsAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.KeystrokeData.Count.Should().Be(3);
        _mockCache.Verify(x => x.SetAsync(
            It.IsAny<string>(),
            It.Is<List<KeystrokeRecord>>(r => r.Count == 3)), Times.Once);
    }

    // ========================================================================
    // KSL-03: Save with null metadata
    // ========================================================================
    [Fact]
    public async Task CacheKeystrokeLogsAsync_WithInvalidRecords_FiltersOutInvalid()
    {
        // Arrange — mix of valid and invalid records
        var records = new List<KeystrokeRecord>
        {
            new() { TimeStartSet = "1000", TimeOffSet = "1100", Duration = 100, Cps = 10, CharCount = 5 },
            new() { TimeStartSet = null!, TimeOffSet = "1200", Duration = 100, Cps = 10, CharCount = 5 },
            new() { TimeStartSet = "1200", TimeOffSet = "", Duration = 0, Cps = 0, CharCount = 0 }
        };

        var request = new CacheKeystrokeLogsRequest
        {
            ExaminationId = "exam-1",
            StudentId = "student-1",
            ProblemId = "prob-1",
            KeystrokeData = records
        };

        _mockCache.Setup(x => x.GetAsync<List<KeystrokeRecord>>(It.IsAny<string>()))
            .ReturnsAsync((List<KeystrokeRecord>?)null);
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<KeystrokeRecord>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CacheKeystrokeLogsAsync(request);

        // Assert — only the valid record should be cached
        _mockCache.Verify(x => x.SetAsync(
            It.IsAny<string>(),
            It.Is<List<KeystrokeRecord>>(r => r.Count == 1)), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task FlushKeystrokeLogsAsync_WhenSubmissionExists_FlushesToDb()
    {
        // Arrange
        var submission = new Submission
        {
            Id = "sub-1",
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "prob-1"
        };

        var records = new List<KeystrokeRecord>
        {
            new() { TimeStartSet = "1000", TimeOffSet = "1100", Duration = 100, Cps = 10, CharCount = 5 }
        };

        var request = new FlushKeystrokeLogsRequest
        {
            SubmissionId = "sub-1",
            ExaminationId = "exam-1",
            StudentId = "student-1",
            ProblemId = "prob-1",
            KeystrokeData = records
        };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-1")).ReturnsAsync(submission);
        _mockCache.Setup(x => x.GetAsync<List<KeystrokeRecord>>(It.IsAny<string>()))
            .ReturnsAsync(records);
        _mockRepository.Setup(x => x.CreateAsync(It.IsAny<KeystrokeLog>()))
            .ReturnsAsync(new KeystrokeLog { Id = "log-1" });
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.FlushKeystrokeLogsAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockRepository.Verify(x => x.CreateAsync(It.IsAny<KeystrokeLog>()), Times.Once);
        _mockCache.Verify(x => x.RemoveAsync(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task FlushKeystrokeLogsAsync_WhenSubmissionDoesNotMatch_ThrowsArgumentException()
    {
        // Arrange
        var submission = new Submission
        {
            Id = "sub-1",
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "prob-1"
        };

        var request = new FlushKeystrokeLogsRequest
        {
            SubmissionId = "sub-1",
            ExaminationId = "exam-1",
            StudentId = "wrong-student",
            ProblemId = "prob-1",
            KeystrokeData = new List<KeystrokeRecord>()
        };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-1")).ReturnsAsync(submission);

        // Act
        var act = async () => await _sut.FlushKeystrokeLogsAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Submission does not match*");
    }

    [Fact]
    public async Task FlushKeystrokeLogsAsync_WhenSubmissionNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new FlushKeystrokeLogsRequest
        {
            SubmissionId = "nonexistent",
            ExaminationId = "exam-1",
            StudentId = "student-1",
            ProblemId = "prob-1"
        };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("nonexistent"))
            .ReturnsAsync((Submission?)null);

        // Act
        var act = async () => await _sut.FlushKeystrokeLogsAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage($"Submission 'nonexistent' does not exist.");
    }
}
