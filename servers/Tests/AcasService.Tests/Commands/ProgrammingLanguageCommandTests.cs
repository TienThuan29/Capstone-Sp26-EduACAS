using AcasService.Application.CodeRunner;
using AcasService.Application.Commands.ProgrammingLanguage;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Models;
using AcasService.Repositories.ProgrammingLanguage;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ProgrammingLanguageCommandTests
{
    private readonly Mock<IProgrammingLanguageRepository> _mockRepo;
    private readonly Mock<ICodeRunnerService> _mockCodeRunner;
    private readonly Mock<ILogger<ProgrammingLanguageCommand>> _mockLogger;
    private readonly ProgrammingLanguageMapper _mapper;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly ProgrammingLanguageCommand _sut;

    public ProgrammingLanguageCommandTests()
    {
        _mockRepo = new Mock<IProgrammingLanguageRepository>();
        _mockCodeRunner = new Mock<ICodeRunnerService>();
        _mockLogger = new Mock<ILogger<ProgrammingLanguageCommand>>();
        _mapper = new ProgrammingLanguageMapper();
        _mockConfig = new Mock<IConfiguration>();

        _sut = new ProgrammingLanguageCommand(
            _mockRepo.Object,
            _mockCodeRunner.Object,
            _mockLogger.Object,
            _mapper,
            _mockConfig.Object);
    }

    // ========================================================================
    // PL-01: Add supported language
    // ========================================================================
    [Fact]
    public async Task SyncProgrammingLanguagesAsync_WhenLanguagesAvailable_SyncsAll()
    {
        // Arrange
        var externalLanguages = new List<CodeRunnerLanguageDto>
        {
            new() { Id = "python", Name = "Python", Monaco = "python", Extensions = new List<string> { ".py" } },
            new() { Id = "java", Name = "Java", Monaco = "java", Extensions = new List<string> { ".java" } }
        };

        var externalCompilers = new Dictionary<string, List<CodeRunnerCompilerDto>>
        {
            ["python"] = new() { new() { Id = "py3", Name = "Python 3", Group = "python3" } },
            ["java"] = new() { new() { Id = "java17", Name = "Java 17", Group = "java17" } }
        };

        _mockCodeRunner.Setup(x => x.GetLanguagesAsync()).ReturnsAsync(externalLanguages);
        _mockCodeRunner.Setup(x => x.GetCompilersAsync()).ReturnsAsync(externalCompilers);
        _mockRepo.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<Models.ProgrammingLanguage>());

        _mockRepo.Setup(x => x.CreateAsync(It.IsAny<Models.ProgrammingLanguage>()))
            .ReturnsAsync((Models.ProgrammingLanguage lang) => lang);

        // Act
        var result = await _sut.SyncProgrammingLanguagesAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
    }

    // ========================================================================
    // PL-02: Duplicate language — repository updates existing
    // ========================================================================
    [Fact]
    public async Task SyncProgrammingLanguagesAsync_WhenLanguageExists_UpdatesExisting()
    {
        // Arrange
        var existingLang = new Models.ProgrammingLanguage
        {
            Id = "python",
            Name = "Python",
            Status = PLStatus.ENABLE,
            CreatedDate = DateTime.UtcNow.AddDays(-1)
        };

        var externalLanguages = new List<CodeRunnerLanguageDto>
        {
            new() { Id = "python", Name = "Python", Monaco = "python", Extensions = new List<string> { ".py" } }
        };

        var externalCompilers = new Dictionary<string, List<CodeRunnerCompilerDto>>
        {
            ["python"] = new() { new() { Id = "py3", Name = "Python 3", Group = "python3" } }
        };

        _mockCodeRunner.Setup(x => x.GetLanguagesAsync()).ReturnsAsync(externalLanguages);
        _mockCodeRunner.Setup(x => x.GetCompilersAsync()).ReturnsAsync(externalCompilers);
        _mockRepo.Setup(x => x.GetAllAsync()).ReturnsAsync(new List<Models.ProgrammingLanguage> { existingLang });
        _mockRepo.Setup(x => x.UpdateAsync("python", It.IsAny<Models.ProgrammingLanguage>()))
            .ReturnsAsync((string id, Models.ProgrammingLanguage lang) => lang);

        // Act
        var result = await _sut.SyncProgrammingLanguagesAsync();

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync("python", It.IsAny<Models.ProgrammingLanguage>()), Times.Once);
    }

    // ========================================================================
    // PL-03: Delete language — tested via UpdateStatusAsync (status update)
    // ========================================================================
    [Fact]
    public async Task UpdateStatusAsync_WhenLanguageExists_UpdatesStatus()
    {
        // Arrange
        var language = new Models.ProgrammingLanguage
        {
            Id = "python",
            Name = "Python",
            Status = PLStatus.DISABLE,
            CreatedDate = DateTime.UtcNow.AddDays(-1)
        };

        _mockRepo.Setup(x => x.GetByIdAsync("python")).ReturnsAsync(language);
        _mockRepo.Setup(x => x.UpdateAsync("python", It.IsAny<Models.ProgrammingLanguage>()))
            .ReturnsAsync((string id, Models.ProgrammingLanguage lang) => lang);

        // Act
        var result = await _sut.UpdateStatusAsync("python", "ENABLE");

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync("python", It.Is<Models.ProgrammingLanguage>(
            l => l.Status == PLStatus.ENABLE)), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task UpdateStatusAsync_WhenLanguageNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(x => x.GetByIdAsync("nonexistent"))
            .ReturnsAsync((Models.ProgrammingLanguage?)null);

        // Act
        var act = async () => await _sut.UpdateStatusAsync("nonexistent", "ENABLE");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidStatus_ThrowsArgumentException()
    {
        // Arrange
        var language = new Models.ProgrammingLanguage { Id = "python" };
        _mockRepo.Setup(x => x.GetByIdAsync("python")).ReturnsAsync(language);

        // Act
        var act = async () => await _sut.UpdateStatusAsync("python", "INVALID_STATUS");

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid status value: 'INVALID_STATUS'*");
    }

    [Fact]
    public async Task UpdateLogoUrlAsync_WhenLanguageExists_UpdatesLogoUrl()
    {
        // Arrange
        var language = new Models.ProgrammingLanguage
        {
            Id = "python",
            Name = "Python",
            LogoFileUrl = ""
        };

        _mockRepo.Setup(x => x.GetByIdAsync("python")).ReturnsAsync(language);
        _mockRepo.Setup(x => x.UpdateAsync("python", It.IsAny<Models.ProgrammingLanguage>()))
            .ReturnsAsync((string id, Models.ProgrammingLanguage lang) => lang);

        // Act
        var result = await _sut.UpdateLogoUrlAsync("python", "https://example.com/logo.png");

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateLogoUrlAsync_WhenLanguageNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(x => x.GetByIdAsync("nonexistent"))
            .ReturnsAsync((Models.ProgrammingLanguage?)null);

        // Act
        var act = async () => await _sut.UpdateLogoUrlAsync("nonexistent", "https://example.com/logo.png");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateCompilerNameAsync_WhenCompilerExists_UpdatesName()
    {
        // Arrange
        var language = new Models.ProgrammingLanguage
        {
            Id = "python",
            Name = "Python",
            Compilers = new List<Compiler>
            {
                new() { Id = "py3", Name = "Python 3", Group = "python3" }
            }
        };

        _mockRepo.Setup(x => x.GetByIdAsync("python")).ReturnsAsync(language);
        _mockRepo.Setup(x => x.UpdateAsync("python", It.IsAny<Models.ProgrammingLanguage>()))
            .ReturnsAsync((string id, Models.ProgrammingLanguage lang) => lang);

        // Act
        var result = await _sut.UpdateCompilerNameAsync("python", "py3", "Python 3.11");

        // Assert
        result.Should().NotBeNull();
        _mockRepo.Verify(x => x.UpdateAsync("python", It.Is<Models.ProgrammingLanguage>(
            l => l.Compilers.First().Name == "Python 3.11")), Times.Once);
    }

    [Fact]
    public async Task UpdateCompilerNameAsync_WhenCompilerNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var language = new Models.ProgrammingLanguage
        {
            Id = "python",
            Compilers = new List<Compiler>()
        };

        _mockRepo.Setup(x => x.GetByIdAsync("python")).ReturnsAsync(language);

        // Act
        var act = async () => await _sut.UpdateCompilerNameAsync("python", "nonexistent", "Name");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
