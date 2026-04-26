using AcasService.Application.Mappers;
using AcasService.Application.Queries.Subject;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.Subject;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AcasService.Tests.Queries;

public class SubjectQueryTests
{
    private readonly Mock<ISubjectRepository> _mockSubjectRepository;
    private readonly SubjectMapper _subjectMapper;
    private readonly Mock<ILogger<SubjectQuery>> _mockLogger;

    public SubjectQueryTests()
    {
        _mockSubjectRepository = new Mock<ISubjectRepository>();
        _subjectMapper = new SubjectMapper();
        _mockLogger = new Mock<ILogger<SubjectQuery>>();
    }

    private SubjectQuery CreateSut() =>
        new SubjectQuery(_mockSubjectRepository.Object, _subjectMapper, _mockLogger.Object);

    // ========================================================================
    // GetSubjectByIdAsync Tests (from 6155bcf7)
    // ========================================================================

    /// <summary>
    /// GetSubjectByIdAsync with valid id -> returns SubjectResponse
    /// </summary>
    [Fact]
    public async Task GetSubjectByIdAsync_WithValidId_ReturnsSubjectResponse()
    {
        var sut = CreateSut();
        var subjectId = "sub1";
        var subject = new Subject { Id = subjectId, SubjectName = "C# Programming", IsDeleted = false };

        _mockSubjectRepository.Setup(r => r.FindByIdAsync(subjectId)).ReturnsAsync(subject);

        var result = await sut.GetSubjectByIdAsync(subjectId);

        result.Should().NotBeNull();
        result!.Id.Should().Be(subjectId);
        result.SubjectName.Should().Be("C# Programming");
        _mockSubjectRepository.Verify(r => r.FindByIdAsync(subjectId), Times.Once);
    }

    /// <summary>
    /// GetSubjectByIdAsync with nonexistent id -> returns null, logs warning
    /// </summary>
    [Fact]
    public async Task GetSubjectByIdAsync_WithNonexistentId_ReturnsNull()
    {
        var sut = CreateSut();
        var subjectId = "nonexistent";
        _mockSubjectRepository.Setup(r => r.FindByIdAsync(subjectId)).ReturnsAsync((Subject?)null);

        var result = await sut.GetSubjectByIdAsync(subjectId);

        result.Should().BeNull();
        _mockLogger.Verify(l => l.Log(
            LogLevel.Warning, It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    /// <summary>
    /// GetSubjectByIdAsync when repository throws -> logs error and throws
    /// </summary>
    [Fact]
    public async Task GetSubjectByIdAsync_WhenRepositoryThrows_LogsAndThrows()
    {
        var sut = CreateSut();
        var subjectId = "sub1";
        var exception = new Exception("Database error");
        _mockSubjectRepository.Setup(r => r.FindByIdAsync(subjectId)).ThrowsAsync(exception);

        var act = () => sut.GetSubjectByIdAsync(subjectId);

        await act.Should().ThrowAsync<Exception>();
        _mockLogger.Verify(l => l.Log(
            LogLevel.Error, It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    // ========================================================================
    // F077: GetAllSubjectsAsync Tests
    // Merged: combines both versions' GetAllSubjectsAsync tests
    // ========================================================================

    /// <summary>
    /// F077-UTCID01: GetAllSubjectsAsync returns list when repository returns list
    /// </summary>
    [Fact]
    public async Task GetAllSubjectsAsync_UTCID01_ReturnsList_WhenRepositoryReturnsList()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>
        {
            new Subject { Id = "s1", SubjectName = "Math", SubjectCode = "MA101" },
            new Subject { Id = "s2", SubjectName = "Physics", SubjectCode = "PH101" }
        };
        _mockSubjectRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(subjects);

        var result = await sut.GetAllSubjectsAsync();

        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result[0].SubjectName.Should().Be("Math");
    }

    /// <summary>
    /// F077-UTCID02: GetAllSubjectsAsync returns empty list when repository is empty
    /// </summary>
    [Fact]
    public async Task GetAllSubjectsAsync_UTCID02_ReturnsEmptyList_WhenRepositoryIsEmpty()
    {
        var sut = CreateSut();
        _mockSubjectRepository.Setup(r => r.FindAllAsync()).ReturnsAsync(new List<Subject>());

        var result = await sut.GetAllSubjectsAsync();

        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    /// <summary>
    /// F077-UTCID03: GetAllSubjectsAsync throws exception when repository throws
    /// </summary>
    [Fact]
    public async Task GetAllSubjectsAsync_UTCID03_ThrowsException_WhenRepositoryThrows()
    {
        var sut = CreateSut();
        _mockSubjectRepository.Setup(r => r.FindAllAsync()).ThrowsAsync(new Exception("Database error"));

        var act = () => sut.GetAllSubjectsAsync();

        await act.Should().ThrowAsync<Exception>();
        _mockLogger.Verify(l => l.Log(
            LogLevel.Error, It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
    }

    // ========================================================================
    // F078: SearchSubjectsAsync Tests
    // Merged: combines both versions' SearchSubjectsAsync tests
    // ========================================================================

    /// <summary>
    /// F078-UTCID01: SearchSubjectsAsync with searchTerm "Programming" -> returns matching subjects
    /// </summary>
    [Fact]
    public async Task SearchSubjectsAsync_UTCID01_ReturnsList_WhenSearchTermIsProgramming()
    {
        var sut = CreateSut();
        var subjects = new List<Subject> { new Subject { SubjectName = "Programming 1" } };
        _mockSubjectRepository.Setup(r => r.SearchAsync("Programming", null, null)).ReturnsAsync(subjects);

        var result = await sut.SearchSubjectsAsync("Programming", null, null);

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }

    /// <summary>
    /// F078-UTCID02: SearchSubjectsAsync with isDeleted=false -> returns non-deleted subjects
    /// </summary>
    [Fact]
    public async Task SearchSubjectsAsync_UTCID02_ReturnsList_WhenIsDeletedIsFalse()
    {
        var sut = CreateSut();
        var subjects = new List<Subject> { new Subject { SubjectName = "Math", IsDeleted = false } };
        _mockSubjectRepository.Setup(r => r.SearchAsync(null, false, null)).ReturnsAsync(subjects);

        var result = await sut.SearchSubjectsAsync(null, false, null);

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }

    /// <summary>
    /// F078-UTCID03: SearchSubjectsAsync with createdBy="u1" -> returns subjects created by user
    /// </summary>
    [Fact]
    public async Task SearchSubjectsAsync_UTCID03_ReturnsList_WhenCreatedByIsU1()
    {
        var sut = CreateSut();
        var subjects = new List<Subject> { new Subject { SubjectName = "Physics", CreatedBy = "u1" } };
        _mockSubjectRepository.Setup(r => r.SearchAsync(null, null, "u1")).ReturnsAsync(subjects);

        var result = await sut.SearchSubjectsAsync(null, null, "u1");

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }

    /// <summary>
    /// F078-UTCID04: SearchSubjectsAsync with all parameters provided -> applies all filters
    /// </summary>
    [Fact]
    public async Task SearchSubjectsAsync_UTCID04_ReturnsList_WhenAllParametersProvided()
    {
        var sut = CreateSut();
        var subjects = new List<Subject> { new Subject { SubjectName = "Math", IsDeleted = true, CreatedBy = "u1" } };
        _mockSubjectRepository.Setup(r => r.SearchAsync("Math", true, "u1")).ReturnsAsync(subjects);

        var result = await sut.SearchSubjectsAsync("Math", true, "u1");

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
    }

    /// <summary>
    /// SearchSubjectsAsync with no matches -> returns empty list
    /// </summary>
    [Fact]
    public async Task SearchSubjectsAsync_WithNoMatches_ReturnsEmptyList()
    {
        var sut = CreateSut();
        _mockSubjectRepository.Setup(r => r.SearchAsync("NonExistent", null, null)).ReturnsAsync(new List<Subject>());

        var result = await sut.SearchSubjectsAsync("NonExistent", null, null);

        result.Should().BeEmpty();
    }

    // ========================================================================
    // F079: GetPagedSubjectsAsync Tests
    // Merged: combines both versions' GetPagedSubjectsAsync tests
    // ========================================================================

    /// <summary>
    /// F079-UTCID01: GetPagedSubjectsAsync with valid inputs -> returns paged response
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID01_ReturnsPagedResponse_WhenValidInputsProvided()
    {
        var sut = CreateSut();
        var subjects = Enumerable.Range(1, 10).Select(i => new Subject { Id = i.ToString() }).ToList();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(1, 10, null, true, true)).ReturnsAsync((subjects, 50));

        var result = await sut.GetPagedSubjectsAsync(1, 10, null, true, true);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(50);
        result.TotalPages.Should().Be(5);
    }

    /// <summary>
    /// F079-UTCID02: GetPagedSubjectsAsync sorts by name ascending
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID02_ReturnsSortedByNameAsc()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(1, 10, "Name", true, null)).ReturnsAsync((subjects, 0));

        var result = await sut.GetPagedSubjectsAsync(1, 10, "Name", true, null);

        result.Should().NotBeNull();
        _mockSubjectRepository.Verify(r => r.GetPagedAsync(1, 10, "Name", true, null), Times.Once);
    }

    /// <summary>
    /// F079-UTCID03: GetPagedSubjectsAsync sorts by name descending
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID03_ReturnsSortedByNameDesc()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(1, 10, "Name", false, null)).ReturnsAsync((subjects, 0));

        var result = await sut.GetPagedSubjectsAsync(1, 10, "Name", false, null);

        result.Should().NotBeNull();
        _mockSubjectRepository.Verify(r => r.GetPagedAsync(1, 10, "Name", false, null), Times.Once);
    }

    /// <summary>
    /// F079-UTCID04: GetPagedSubjectsAsync caps pageSize at 100 when exceeds 100
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID04_CorrectsPageSize_WhenExceeds100()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(1, 100, null, true, null)).ReturnsAsync((subjects, 0));

        var result = await sut.GetPagedSubjectsAsync(1, 200, null, true, null);

        result.PageSize.Should().Be(100);
        _mockSubjectRepository.Verify(r => r.GetPagedAsync(1, 100, null, true, null), Times.Once);
    }

    /// <summary>
    /// F079-UTCID05: GetPagedSubjectsAsync corrects page to 1 when page is 0
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID05_CorrectsPage_WhenIsZero()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(1, 10, null, true, null)).ReturnsAsync((subjects, 0));

        var result = await sut.GetPagedSubjectsAsync(0, 10, null, true, null);

        result.Page.Should().Be(1);
        _mockSubjectRepository.Verify(r => r.GetPagedAsync(1, 10, null, true, null), Times.Once);
    }

    /// <summary>
    /// F079-UTCID06: GetPagedSubjectsAsync returns correct page when page is 3
    /// </summary>
    [Fact]
    public async Task GetPagedSubjectsAsync_UTCID06_ReturnsCorrectPage_WhenPageIs3()
    {
        var sut = CreateSut();
        var subjects = new List<Subject>();
        _mockSubjectRepository.Setup(r => r.GetPagedAsync(3, 10, null, true, true)).ReturnsAsync((subjects, 30));

        var result = await sut.GetPagedSubjectsAsync(3, 10, null, true, true);

        result.Page.Should().Be(3);
        _mockSubjectRepository.Verify(r => r.GetPagedAsync(3, 10, null, true, true), Times.Once);
    }
}
