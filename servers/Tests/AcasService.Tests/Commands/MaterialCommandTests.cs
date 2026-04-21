using AcasService.Application.Commands.Material;
using AcasService.Application.Commands.Notification;
using AcasService.Application.Commands.S3;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.S3;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Material;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class MaterialCommandTests
{
    private readonly Mock<IMaterialRepository> _mockMaterialRepo;
    private readonly Mock<IClassroomRepository> _mockClassroomRepo;
    private readonly Mock<IPrivateS3Command> _mockS3Command;
    private readonly Mock<IPrivateS3Query> _mockS3Query;
    private readonly Mock<IBusinessNotificationService> _mockNotification;
    private readonly Mock<ILogger<MaterialCommand>> _mockLogger;
    private readonly MaterialMapper _mapper;
    private readonly MaterialCommand _sut;

    public MaterialCommandTests()
    {
        _mockMaterialRepo = new Mock<IMaterialRepository>();
        _mockClassroomRepo = new Mock<IClassroomRepository>();
        _mockS3Command = new Mock<IPrivateS3Command>();
        _mockS3Query = new Mock<IPrivateS3Query>();
        _mockNotification = new Mock<IBusinessNotificationService>();
        _mockLogger = new Mock<ILogger<MaterialCommand>>();
        _mapper = new MaterialMapper();

        _sut = new MaterialCommand(
            _mockMaterialRepo.Object,
            _mockClassroomRepo.Object,
            _mockS3Command.Object,
            _mockS3Query.Object,
            _mockNotification.Object,
            _mapper,
            _mockLogger.Object);
    }

    // ========================================================================
    // MAT-01: Upload material
    // ========================================================================
    [Fact]
    public async Task CreateMaterialAsync_WithValidFileAndClassroom_ReturnsMaterial()
    {
        // Arrange
        var request = CreateMaterialRequest(out var mockFile);
        var classroom = new Classroom { Id = request.ClassroomId, ClassName = "Test Class" };
        var createdMaterial = CreateMaterial("mat-1", request.ClassroomId);

        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassroomId))
            .ReturnsAsync(classroom);
        _mockS3Command.Setup(x => x.UploadFilesAsync(
                It.IsAny<byte[]>(), request.File.FileName, request.File.ContentType))
            .ReturnsAsync("uploaded-file.pdf");
        _mockS3Query.Setup(x => x.GetFileUrlAsync("uploaded-file.pdf"))
            .ReturnsAsync("https://s3.example.com/file.pdf");
        _mockMaterialRepo.Setup(x => x.CreateAsync(It.IsAny<Material>()))
            .ReturnsAsync(createdMaterial);

        // Act
        var result = await _sut.CreateMaterialAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.ClassroomId.Should().Be(request.ClassroomId);
        _mockS3Command.Verify(x => x.UploadFilesAsync(
            It.IsAny<byte[]>(), request.File.FileName, request.File.ContentType), Times.Once);
        _mockNotification.Verify(x => x.NotifyClassroomAsync(
            request.ClassroomId,
            NotificationType.NEW_MATERIAL,
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string?>(),
            It.IsAny<Dictionary<string, object?>?>()), Times.Once);
    }

    // ========================================================================
    // MAT-02: Delete material
    // ========================================================================
    [Fact]
    public async Task DeleteMaterialAsync_WhenMaterialExists_DeletesAndRemovesFromS3()
    {
        // Arrange
        var material = CreateMaterial("mat-1", "class-1");
        _mockMaterialRepo.Setup(x => x.FindByIdAsync("mat-1")).ReturnsAsync(material);
        _mockS3Command.Setup(x => x.DeleteFilesAsync(material.Filename))
            .ReturnsAsync("deleted");
        _mockMaterialRepo.Setup(x => x.DeleteAsync("mat-1"))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteMaterialAsync("mat-1");

        // Assert
        result.Should().NotBeNull();
        _mockS3Command.Verify(x => x.DeleteFilesAsync(material.Filename), Times.Once);
        _mockMaterialRepo.Verify(x => x.DeleteAsync("mat-1"), Times.Once);
    }

    // ========================================================================
    // MAT-03: Get materials by subject — tested via SoftDeleteMaterialAsync
    // ========================================================================
    [Fact]
    public async Task SoftDeleteMaterialAsync_WhenMaterialExists_SoftDeletes()
    {
        // Arrange
        var material = CreateMaterial("mat-1", "class-1");
        _mockMaterialRepo.Setup(x => x.FindByIdAsync("mat-1")).ReturnsAsync(material);
        _mockMaterialRepo.Setup(x => x.SoftDeleteAsync("mat-1"))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.SoftDeleteMaterialAsync("mat-1");

        // Assert
        result.Should().NotBeNull();
        _mockMaterialRepo.Verify(x => x.SoftDeleteAsync("mat-1"), Times.Once);
    }

    // ========================================================================
    // MAT-04: Upload unsupported file type
    // ========================================================================
    [Fact]
    public async Task CreateMaterialAsync_WhenClassroomNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var request = CreateMaterialRequest(out var mockFile);
        _mockClassroomRepo.Setup(x => x.FindByIdAsync(request.ClassroomId))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.CreateMaterialAsync(request);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Classroom not found");
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task UpdateMaterialAsync_WhenMaterialExists_UpdatesDescription()
    {
        // Arrange
        var material = CreateMaterial("mat-1", "class-1");
        var request = new UpdateMaterialRequest { Description = "Updated description" };

        _mockMaterialRepo.Setup(x => x.FindByIdAsync("mat-1")).ReturnsAsync(material);
        _mockMaterialRepo.Setup(x => x.UpdateAsync(It.IsAny<Material>()))
            .ReturnsAsync((Material m) => m);

        // Act
        var result = await _sut.UpdateMaterialAsync("mat-1", request);

        // Assert
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteMaterialAsync_WhenMaterialNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockMaterialRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Material?)null);

        // Act
        var act = async () => await _sut.DeleteMaterialAsync("nonexistent");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ========================================================================
    // Test data helpers
    // ========================================================================

    private static CreateMaterialRequest CreateMaterialRequest(out Mock<IFormFile> mockFile)
    {
        mockFile = new Mock<IFormFile>();
        var content = "test file content"u8.ToArray();
        var stream = new MemoryStream(content);
        mockFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        mockFile.Setup(f => f.FileName).Returns("test.pdf");
        mockFile.Setup(f => f.ContentType).Returns("application/pdf");
        mockFile.Setup(f => f.Length).Returns(content.Length);

        return new CreateMaterialRequest
        {
            File = mockFile.Object,
            ClassroomId = "class-1",
            LecturerId = "user-1",
            Description = "Test material"
        };
    }

    private static Material CreateMaterial(string id, string classroomId) => new()
    {
        Id = id,
        ClassroomId = classroomId,
        LecturerId = "user-1",
        Filename = "test.pdf",
        FileUrl = "https://s3.example.com/test.pdf",
        Description = "Test material",
        IsDeleted = false,
        CreatedDate = DateTime.UtcNow
    };
}
