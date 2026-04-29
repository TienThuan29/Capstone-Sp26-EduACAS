using AcasService.Application.Mappers;
using AcasService.Application.Queries.Notification;
using AcasService.Models;
using AcasService.Repositories.Notification;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AcasService.Tests.Queries
{
    public class NotificationQueryTests
    {
        private readonly Mock<INotificationRepository> _notificationRepositoryMock;
        private readonly NotificationMapper _notificationMapper;
        private readonly Mock<ILogger<NotificationQuery>> _loggerMock;
        private readonly NotificationQuery _sut;

        public NotificationQueryTests()
        {
            _notificationRepositoryMock = new Mock<INotificationRepository>();
            _notificationMapper = new NotificationMapper();
            _loggerMock = new Mock<ILogger<NotificationQuery>>();
            _sut = new NotificationQuery(_loggerMock.Object, _notificationRepositoryMock.Object, _notificationMapper);
        }

        // F080: GetNotificationsByUserIdAsync(string userId, int pageIndex, int pageSize)

        [Fact]
        public async Task GetNotificationsByUserIdAsync_UTC01_Boundary_ShouldReturnSortedNotifications_WhenNotificationsFound()
        {
            var userId = "u1";
            var notifications = new List<Notification>
            {
                new Notification { Id = "1", IsRead = true, SentDate = DateTime.Now.AddMinutes(-10) },
                new Notification { Id = "2", IsRead = false, SentDate = DateTime.Now.AddMinutes(-5) },
                new Notification { Id = "3", IsRead = false, SentDate = DateTime.Now }
            };
            _notificationRepositoryMock.Setup(r => r.FindByTargetUserIdAsync(userId)).ReturnsAsync(notifications);

            var result = await _sut.GetNotificationsByUserIdAsync(userId, 1, 10);

            Assert.NotNull(result);
            Assert.Equal("3", result.Items[0].Id);
            Assert.Equal("2", result.Items[1].Id);
            Assert.Equal("1", result.Items[2].Id);
        }

        [Fact]
        public async Task GetNotificationsByUserIdAsync_UTC02_Boundary_ShouldReturnEmpty_WhenNoNotificationsFound()
        {
            var userId = "u1";
            _notificationRepositoryMock.Setup(r => r.FindByTargetUserIdAsync(userId)).ReturnsAsync(new List<Notification>());

            var result = await _sut.GetNotificationsByUserIdAsync(userId, 1, 10);
            Assert.NotNull(result);
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact]
        public async Task GetNotificationsByUserIdAsync_UTC03_Abnormal_ShouldThrowArgumentException_WhenUserIdIsEmpty()
        {
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _sut.GetNotificationsByUserIdAsync("", 1, 10));
            Assert.Contains("userId is required", ex.Message);
        }

        [Fact]
        public async Task GetNotificationsByUserIdAsync_UTC04_Boundary_ShouldCorrectPageSize_WhenExceeds100()
        {
            var userId = "u1";
            _notificationRepositoryMock.Setup(r => r.FindByTargetUserIdAsync(userId)).ReturnsAsync(new List<Notification>());

            var result = await _sut.GetNotificationsByUserIdAsync(userId, 1, 200);

            Assert.Equal(100, result.PageSize);
        }

        [Fact]
        public async Task GetNotificationsByUserIdAsync_UTC05_Boundary_ShouldCorrectPageSize_WhenIsZero()
        {
            var userId = "u1";
            _notificationRepositoryMock.Setup(r => r.FindByTargetUserIdAsync(userId)).ReturnsAsync(new List<Notification>());

            var result = await _sut.GetNotificationsByUserIdAsync(userId, 1, 0);

            Assert.Equal(10, result.PageSize); 
        }

        // F081: GetByTargetUserIdAsync(string targetUserId)

        [Fact]
        public async Task GetByTargetUserIdAsync_UTC01_Normal_ShouldReturnSortedNotifications_WhenTargetUserIdIsValid()
        {
            var targetUserId = "u1";
            var notifications = new List<Notification>
            {
                new Notification { Id = "1", SentDate = DateTime.Now.AddMinutes(-10) },
                new Notification { Id = "2", SentDate = DateTime.Now }
            };
            _notificationRepositoryMock.Setup(r => r.FindByTargetUserIdAsync(targetUserId)).ReturnsAsync(notifications);

            var result = await _sut.GetByTargetUserIdAsync(targetUserId);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("2", result[0].Id);
            Assert.Equal("1", result[1].Id);
        }

        [Fact]
        public async Task GetByTargetUserIdAsync_UTC02_Abnormal_ShouldThrowArgumentException_WhenTargetUserIdIsEmpty()
        {
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _sut.GetByTargetUserIdAsync(""));
            Assert.Contains("targetUserId is required", ex.Message);
        }

        // F082: GetAllNotificationsAsync(int pageIndex, int pageSize, string? searchTerm)

        [Fact]
        public async Task GetAllNotificationsAsync_UTC01_Abnormal_ShouldReturnAllNotifications_WhenSearchTermIsNull()
        {
            var notifications = new List<Notification> { new Notification { Id = "1" } };
            _notificationRepositoryMock.Setup(r => r.SearchAsync(null, 1, 10)).ReturnsAsync((notifications, 1));

            var result = await _sut.GetAllNotificationsAsync(1, 10, null);

            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(1, result.TotalCount);
        }

        [Fact]
        public async Task GetAllNotificationsAsync_UTC02_Boundary_ShouldReturnFilteredNotifications_WhenSearchTermProvided()
        {
            var searchTerm = "grade";
            var notifications = new List<Notification> { new Notification { Id = "1", Title = "New Grade" } };
            _notificationRepositoryMock.Setup(r => r.SearchAsync(searchTerm, 1, 10)).ReturnsAsync((notifications, 1));

            var result = await _sut.GetAllNotificationsAsync(1, 10, searchTerm);

            Assert.NotNull(result);
            Assert.Single(result.Items);
            _notificationRepositoryMock.Verify(r => r.SearchAsync(searchTerm, 1, 10), Times.Once);
        }

        [Fact]
        public async Task GetAllNotificationsAsync_UTC03_Abnormal_ShouldReturnEmpty_WhenNoNotificationsFound()
        {
            _notificationRepositoryMock.Setup(r => r.SearchAsync(null, 1, 10)).ReturnsAsync((new List<Notification>(), 0));

            var result = await _sut.GetAllNotificationsAsync(1, 10, null);

            Assert.NotNull(result);
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }
    }
}
