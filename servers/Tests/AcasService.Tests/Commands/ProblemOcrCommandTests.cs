using AcasService.Application.Commands.OCR;
using AcasService.Repositories.S3;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class ProblemOcrCommandTests
{
    private readonly Mock<IAzureOcrCommand> _mockOcr;
    private readonly Mock<IPrivateS3Repository> _mockS3;
    private readonly Mock<ILogger<ProblemOcrCommand>> _mockLogger;
    private readonly ProblemOcrCommand _sut;

    public ProblemOcrCommandTests()
    {
        _mockOcr = new Mock<IAzureOcrCommand>();
        _mockS3 = new Mock<IPrivateS3Repository>();
        _mockLogger = new Mock<ILogger<ProblemOcrCommand>>();

        _sut = new ProblemOcrCommand(
            _mockOcr.Object,
            _mockS3.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // OCR-01: OCR with clear image
    // ========================================================================
    [Fact]
    public async Task ExtractContentFromFileAsync_WithValidImage_ReturnsExtractedText()
    {
        // Arrange
        var fileName = "clear_image.png";
        var fileBytes = "PNG file content"u8.ToArray();
        var expectedText = "# Problem Statement\nCalculate the sum of two numbers.";

        _mockS3.Setup(x => x.DownloadFileAsync(fileName))
            .ReturnsAsync(fileBytes);
        _mockOcr.Setup(x => x.AnalyzeToMarkdownAsync(It.IsAny<Stream>()))
            .ReturnsAsync(expectedText);

        // Act
        var result = await _sut.ExtractContentFromFileAsync(fileName);

        // Assert
        result.Should().Be(expectedText);
        _mockOcr.Verify(x => x.AnalyzeToMarkdownAsync(
            It.Is<Stream>(s => s != null)), Times.Once);
    }

    // ========================================================================
    // OCR-02: OCR with noisy image
    // ========================================================================
    [Fact]
    public async Task ExtractContentFromFileAsync_WithNoisyImage_ReturnsExtractedText()
    {
        // Arrange
        var fileName = "noisy_image.jpg";
        var fileBytes = "JPEG content"u8.ToArray();
        var noisyText = "3A + B = ?"; // lower quality extraction

        _mockS3.Setup(x => x.DownloadFileAsync(fileName))
            .ReturnsAsync(fileBytes);
        _mockOcr.Setup(x => x.AnalyzeToMarkdownAsync(It.IsAny<Stream>()))
            .ReturnsAsync(noisyText);

        // Act
        var result = await _sut.ExtractContentFromFileAsync(fileName);

        // Assert
        result.Should().Be(noisyText);
    }

    // ========================================================================
    // OCR-03: OCR empty image
    // ========================================================================
    [Fact]
    public async Task ExtractContentFromFileAsync_WithEmptyFile_ThrowsInvalidOperationException()
    {
        // Arrange
        var fileName = "empty.png";
        var emptyBytes = Array.Empty<byte>();

        _mockS3.Setup(x => x.DownloadFileAsync(fileName))
            .ReturnsAsync(emptyBytes);

        // Act
        var act = async () => await _sut.ExtractContentFromFileAsync(fileName);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"File {fileName} is empty or not found");
    }

    // ========================================================================
    // OCR-04: Unsupported image format
    // ========================================================================
    [Fact]
    public async Task ExtractContentFromFileAsync_WhenFileDownloadThrows_PropagatesException()
    {
        // Arrange
        var fileName = "unsupported.bmp";
        _mockS3.Setup(x => x.DownloadFileAsync(fileName))
            .ThrowsAsync(new InvalidOperationException("Unsupported format"));

        // Act
        var act = async () => await _sut.ExtractContentFromFileAsync(fileName);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Unsupported format");
    }

    // ========================================================================
    // OCR-05: Large image
    // ========================================================================
    [Fact]
    public async Task ExtractContentFromFileAsync_WithLargeFile_DownloadsAndProcesses()
    {
        // Arrange — simulate large file bytes
        var largeFileName = "large_image.png";
        var largeBytes = new byte[10 * 1024 * 1024]; // 10MB
        var expectedText = "Large file processed successfully";

        _mockS3.Setup(x => x.DownloadFileAsync(largeFileName))
            .ReturnsAsync(largeBytes);
        _mockOcr.Setup(x => x.AnalyzeToMarkdownAsync(It.IsAny<Stream>()))
            .ReturnsAsync(expectedText);

        // Act
        var result = await _sut.ExtractContentFromFileAsync(largeFileName);

        // Assert
        result.Should().Be(expectedText);
        _mockS3.Verify(x => x.DownloadFileAsync(largeFileName), Times.Once);
        _mockOcr.Verify(x => x.AnalyzeToMarkdownAsync(It.IsAny<Stream>()), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task ExtractContentFromFileAsync_WhenOcrServiceThrows_PropagatesException()
    {
        // Arrange
        var fileName = "image.png";
        var fileBytes = "PNG content"u8.ToArray();

        _mockS3.Setup(x => x.DownloadFileAsync(fileName))
            .ReturnsAsync(fileBytes);
        _mockOcr.Setup(x => x.AnalyzeToMarkdownAsync(It.IsAny<Stream>()))
            .ThrowsAsync(new InvalidOperationException("OCR service unavailable"));

        // Act
        var act = async () => await _sut.ExtractContentFromFileAsync(fileName);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("OCR service unavailable");
    }

    [Fact]
    public async Task ExtractContentFromFileAsync_WhenFileNotFoundInS3_ReturnsNullBytes()
    {
        // Arrange
        _mockS3.Setup(x => x.DownloadFileAsync("missing.png"))
            .ReturnsAsync((byte[]?)null);

        // Act
        var act = async () => await _sut.ExtractContentFromFileAsync("missing.png");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("File missing.png is empty or not found");
    }
}
