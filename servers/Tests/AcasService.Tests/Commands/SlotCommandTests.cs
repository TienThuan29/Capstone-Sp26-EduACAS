using AcasService.Application.Commands.SlotCommand;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Slot;
using AcasService.Web.Requests.SlotRequest;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AcasService.Tests.Commands;

public class SlotCommandTests
{
    private readonly Mock<ISlotRepository> _mockSlotRepo;
    private readonly Mock<IClassroomRepository> _mockClassroomRepo;
    private readonly Mock<ILogger<SlotCommand>> _mockLogger;
    private readonly SlotCommand _sut;

    public SlotCommandTests()
    {
        _mockSlotRepo = new Mock<ISlotRepository>();
        _mockClassroomRepo = new Mock<IClassroomRepository>();
        _mockLogger = new Mock<ILogger<SlotCommand>>();

        _sut = new SlotCommand(
            _mockSlotRepo.Object,
            _mockClassroomRepo.Object,
            _mockLogger.Object);
    }

    // ========================================================================
    // SL-01: Create slot
    // ========================================================================
    [Fact]
    public async Task CreateAnsync_WhenClassroomExistsAndSlotsAvailable_CreatesSlot()
    {
        // Arrange
        var request = new SlotRequest
        {
            ClassroomId = "class-1",
            Title = "Slot 1",
            Description = "First exam slot"
        };

        var classroom = new Classroom { Id = "class-1", MaxSlot = 3 };
        var existingSlots = new List<Models.Slot>();

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1")).ReturnsAsync(classroom);
        _mockSlotRepo.Setup(x => x.GetSlotsByClassroomIdAsync("class-1"))
            .ReturnsAsync(existingSlots.AsEnumerable());
        _mockSlotRepo.Setup(x => x.CreateAsync(It.IsAny<Models.Slot>()))
            .ReturnsAsync((Models.Slot s) => s);

        // Act
        var result = await _sut.CreateAnsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.SlotNumber.Should().Be("1");
        result.Title.Should().Be("Slot 1");
        _mockSlotRepo.Verify(x => x.CreateAsync(It.Is<Models.Slot>(s => s.SlotNumber == "1")), Times.Once);
    }

    // ========================================================================
    // SL-02: Assign classroom
    // ========================================================================
    [Fact]
    public async Task CreateAnsync_WithEmptyExistingSlots_CreatesSlotNumberOne()
    {
        // Arrange
        var request = new SlotRequest
        {
            ClassroomId = "class-1",
            Title = "Slot 1",
            Description = "First slot"
        };

        var classroom = new Classroom { Id = "class-1", MaxSlot = 3 };
        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1")).ReturnsAsync(classroom);
        _mockSlotRepo.Setup(x => x.GetSlotsByClassroomIdAsync("class-1"))
            .ReturnsAsync(new List<Models.Slot>().AsEnumerable());
        _mockSlotRepo.Setup(x => x.CreateAsync(It.IsAny<Models.Slot>()))
            .ReturnsAsync((Models.Slot s) => s);

        // Act
        var result = await _sut.CreateAnsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.SlotNumber.Should().Be("1");
    }

    // ========================================================================
    // SL-03: Overlap slot — classroom has reached max slots
    // ========================================================================
    [Fact]
    public async Task CreateAnsync_WhenMaxSlotsReached_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new SlotRequest
        {
            ClassroomId = "class-1",
            Title = "Extra Slot"
        };

        var classroom = new Classroom { Id = "class-1", MaxSlot = 2 };
        var existingSlots = new List<Models.Slot>
        {
            new() { Id = "slot-1", ClassroomId = "class-1", SlotNumber = "1" },
            new() { Id = "slot-2", ClassroomId = "class-1", SlotNumber = "2" }
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1")).ReturnsAsync(classroom);
        _mockSlotRepo.Setup(x => x.GetSlotsByClassroomIdAsync("class-1"))
            .ReturnsAsync(existingSlots.AsEnumerable());

        // Act
        var act = async () => await _sut.CreateAnsync(request);

        // Assert — the inner exception is wrapped by the catch block
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ========================================================================
    // SL-04: Delete slot
    // ========================================================================
    [Fact]
    public async Task DeleteAsync_WhenSlotExists_DeletesSlot()
    {
        // Arrange
        var slot = new Models.Slot { Id = "slot-1", ClassroomId = "class-1", SlotNumber = "1" };
        _mockSlotRepo.Setup(x => x.FindByIdAsync("slot-1")).ReturnsAsync(slot);
        _mockSlotRepo.Setup(x => x.DeleteAsync("slot-1")).Returns(Task.CompletedTask);

        // Act
        await _sut.DeleteAsync("slot-1");

        // Assert
        _mockSlotRepo.Verify(x => x.DeleteAsync("slot-1"), Times.Once);
    }

    // ========================================================================
    // Additional tests
    // ========================================================================

    [Fact]
    public async Task DeleteAsync_WhenSlotNotFound_DoesNotThrow()
    {
        // Arrange
        _mockSlotRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Models.Slot?)null);

        // Act
        var act = async () => await _sut.DeleteAsync("nonexistent");

        // Assert — should not throw
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task CreateAnsync_WhenClassroomNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new SlotRequest { ClassroomId = "nonexistent", Title = "Slot" };
        _mockClassroomRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Classroom?)null);

        // Act
        var act = async () => await _sut.CreateAnsync(request);

        // Assert — command wraps all exceptions
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateMultiAnsync_WhenSlotsAvailable_CreatesAllSlots()
    {
        // Arrange
        var classroom = new Classroom { Id = "class-1", MaxSlot = 5 };
        var existingSlots = new List<Models.Slot>
        {
            new() { Id = "slot-1", ClassroomId = "class-1", SlotNumber = "1" }
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1")).ReturnsAsync(classroom);
        _mockSlotRepo.Setup(x => x.GetSlotsByClassroomIdAsync("class-1"))
            .ReturnsAsync(existingSlots.AsEnumerable());
        _mockSlotRepo.Setup(x => x.AddRangeAsync(It.IsAny<List<Models.Slot>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.CreateMultiAnsync("class-1");

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(4); // slots 2,3,4,5
    }

    [Fact]
    public async Task UpdateAnsync_WhenSlotExists_UpdatesSlot()
    {
        // Arrange
        var slot = new Models.Slot { Id = "slot-1", ClassroomId = "class-1", SlotNumber = "1", Title = "Old" };
        var request = new SlotRequest { ClassroomId = "class-1", Title = "Updated", Description = "Desc" };

        _mockSlotRepo.Setup(x => x.FindByIdAsync("slot-1")).ReturnsAsync(slot);
        _mockSlotRepo.Setup(x => x.UpdateAsync(It.IsAny<Models.Slot>()))
            .ReturnsAsync((Models.Slot s) => s);

        // Act
        var result = await _sut.UpdateAnsync(request, "slot-1");

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task CreateAnsync_WhenSlotsExactlyAtMax_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new SlotRequest { ClassroomId = "class-1", Title = "Extra" };
        var classroom = new Classroom { Id = "class-1", MaxSlot = 2 };
        var existingSlots = new List<Models.Slot>
        {
            new() { Id = "slot-1", ClassroomId = "class-1", SlotNumber = "1" },
            new() { Id = "slot-2", ClassroomId = "class-1", SlotNumber = "2" }
        };

        _mockClassroomRepo.Setup(x => x.FindByIdAsync("class-1")).ReturnsAsync(classroom);
        _mockSlotRepo.Setup(x => x.GetSlotsByClassroomIdAsync("class-1"))
            .ReturnsAsync(existingSlots.AsEnumerable());

        // Act
        var act = async () => await _sut.CreateAnsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task UpdateAnsync_WhenSlotNotFound_ReturnsNull()
    {
        // Arrange
        var request = new SlotRequest { ClassroomId = "class-1", Title = "Updated" };
        _mockSlotRepo.Setup(x => x.FindByIdAsync("nonexistent"))
            .ReturnsAsync((Models.Slot?)null);

        // Act
        var result = await _sut.UpdateAnsync(request, "nonexistent");

        // Assert
        result.Should().BeNull();
    }
}
