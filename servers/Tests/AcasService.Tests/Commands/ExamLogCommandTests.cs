using AcasService.Application.Commands.ExamLog;
using AcasService.Application.Mappers;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.ExamLog;
using AcasService.Repositories.ExamLog;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ExamLogCommandTests
{
    private readonly Mock<IExamLogRepository> _mockExamLogRepo;
    private readonly Mock<IExamLogCache> _mockCache;
    private readonly Mock<ILogger<ExamLogCommand>> _mockLogger;
    private readonly ExamLogMapper _mapper;
    private readonly ExamLogCommand _sut;

    public ExamLogCommandTests()
    {
        _mockExamLogRepo = new Mock<IExamLogRepository>();
        _mockCache = new Mock<IExamLogCache>();
        _mockLogger = new Mock<ILogger<ExamLogCommand>>();
        _mapper = new ExamLogMapper();

        _mockCache.Setup(x => x.GetSessionLogKey(It.IsAny<string>()))
            .Returns<string>(s => $"session:{s}");

        _sut = new ExamLogCommand(
            _mockExamLogRepo.Object,
            _mockCache.Object,
            _mapper,
            _mockLogger.Object);
    }

    // ========================================================================
    // EL-01: Log suspicious activity
    // ========================================================================
    [Fact]
    public async Task CreateAsync_WithSuspiciousActivity_CreatesLog()
    {
        // Arrange
        var request = new CreateExamLogRequest
        {
            SubmissionId = "sub-1",
            EventType = "TAB_LEAVE",
            EventDetail = "User switched tabs 3 times",
            Message = "Suspicious tab switching detected",
            Severity = "CRITICAL",
            IsViolation = true,
            ClientTimestamp = DateTime.UtcNow
        };

        var createdLog = new ExamLog
        {
            Id = "log-1",
            SubmissionId = request.SubmissionId,
            EventType = ExamLogEventType.TAB_LEAVE,
            Severity = ExamLogSeverity.CRITICAL,
            IsViolation = true,
            CreatedDate = DateTime.UtcNow
        };

        _mockExamLogRepo.Setup(x => x.CreateAsync(It.IsAny<ExamLog>()))
            .ReturnsAsync(createdLog);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.IsViolation.Should().BeTrue();
        _mockExamLogRepo.Verify(x => x.CreateAsync(
            It.Is<ExamLog>(l => l.IsViolation == true)), Times.Once);
    }

    // ========================================================================
    // EL-02: Log normal activity
    // ========================================================================
    [Fact]
    public async Task CreateAsync_WithNormalActivity_CreatesLog()
    {
        // Arrange
        var request = new CreateExamLogRequest
        {
            SubmissionId = "sub-1",
            EventType = "EXAM_HEARTBEAT",
            EventDetail = "Heartbeat every 30 seconds",
            Message = "Normal heartbeat",
            Severity = "INFO",
            IsViolation = false,
            ClientTimestamp = DateTime.UtcNow
        };

        var createdLog = new ExamLog
        {
            Id = "log-1",
            SubmissionId = request.SubmissionId,
            EventType = ExamLogEventType.EXAM_HEARTBEAT,
            Severity = ExamLogSeverity.INFO,
            IsViolation = false,
            CreatedDate = DateTime.UtcNow
        };

        _mockExamLogRepo.Setup(x => x.CreateAsync(It.IsAny<ExamLog>()))
            .ReturnsAsync(createdLog);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.IsViolation.Should().BeFalse();
    }

    // ========================================================================
    // EL-03: Log tab switch
    // ========================================================================
    [Fact]
    public async Task CreateAsync_WithTabSwitch_CreatesViolationLog()
    {
        // Arrange
        var request = new CreateExamLogRequest
        {
            SubmissionId = "sub-1",
            EventType = "TAB_LEAVE",
            EventDetail = "User left the tab",
            Message = "Tab switch detected",
            Severity = "WARNING",
            IsViolation = true,
            ClientTimestamp = DateTime.UtcNow
        };

        var createdLog = new ExamLog
        {
            Id = "log-1",
            SubmissionId = request.SubmissionId,
            EventType = ExamLogEventType.TAB_LEAVE,
            Severity = ExamLogSeverity.WARNING,
            IsViolation = true,
            CreatedDate = DateTime.UtcNow
        };

        _mockExamLogRepo.Setup(x => x.CreateAsync(It.IsAny<ExamLog>()))
            .ReturnsAsync(createdLog);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockExamLogRepo.Verify(x => x.CreateAsync(
            It.Is<ExamLog>(l => l.EventType == ExamLogEventType.TAB_LEAVE)), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task CacheAsync_WithEntries_CachesAndReturnsCount()
    {
        // Arrange
        var request = new CacheExamLogsRequest
        {
            SessionKey = "session-123",
            Entries = new List<CacheExamLogEntryRequest>
            {
                new() { EventType = "TAB_LEAVE", Message = "Switched", Severity = "WARNING", IsViolation = true, ClientTimestamp = DateTime.UtcNow },
                new() { EventType = "HEARTBEAT", Message = "OK", Severity = "INFO", IsViolation = false, ClientTimestamp = DateTime.UtcNow }
            }
        };

        _mockCache.Setup(x => x.GetAsync<List<CacheExamLogEntryRequest>>(It.IsAny<string>()))
            .ReturnsAsync((List<CacheExamLogEntryRequest>?)null);
        _mockCache.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<List<CacheExamLogEntryRequest>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CacheAsync(request);

        // Assert
        result.Should().Be(2);
    }

    [Fact]
    public async Task FlushCachedAsync_WithCachedEntries_FlushesAllEntries()
    {
        // Arrange
        var request = new FlushCachedExamLogsRequest
        {
            SessionKey = "session-123",
            SubmissionId = "sub-1"
        };

        var cachedEntries = new List<CacheExamLogEntryRequest>
        {
            new() { EventType = "TAB_LEAVE", Message = "Tab 1", Severity = "WARNING", IsViolation = true, ClientTimestamp = DateTime.UtcNow },
            new() { EventType = "TAB_LEAVE", Message = "Tab 2", Severity = "WARNING", IsViolation = true, ClientTimestamp = DateTime.UtcNow }
        };

        _mockCache.Setup(x => x.GetAsync<List<CacheExamLogEntryRequest>>(It.IsAny<string>()))
            .ReturnsAsync(cachedEntries);
        _mockCache.Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _mockExamLogRepo.Setup(x => x.CreateAsync(It.IsAny<ExamLog>()))
            .ReturnsAsync(new ExamLog { Id = "log-new" });

        // Act
        var result = await _sut.FlushCachedAsync(request);

        // Assert
        result.Should().Be(2);
        _mockExamLogRepo.Verify(x => x.CreateAsync(It.IsAny<ExamLog>()), Times.Exactly(2));
        _mockCache.Verify(x => x.RemoveAsync(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task FlushCachedAsync_WhenNoCachedEntries_ReturnsZero()
    {
        // Arrange
        var request = new FlushCachedExamLogsRequest
        {
            SessionKey = "session-empty",
            SubmissionId = "sub-1"
        };

        _mockCache.Setup(x => x.GetAsync<List<CacheExamLogEntryRequest>>(It.IsAny<string>()))
            .ReturnsAsync((List<CacheExamLogEntryRequest>?)null);

        // Act
        var result = await _sut.FlushCachedAsync(request);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public async Task CreateAsync_WhenRepositoryFails_ReturnsNull()
    {
        // Arrange
        var request = new CreateExamLogRequest
        {
            SubmissionId = "sub-1",
            EventType = "TAB_LEAVE",
            Message = "Test",
            Severity = "WARNING",
            IsViolation = false,
            ClientTimestamp = DateTime.UtcNow
        };

        _mockExamLogRepo.Setup(x => x.CreateAsync(It.IsAny<ExamLog>()))
            .ReturnsAsync((ExamLog?)null);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().BeNull();
    }
}
