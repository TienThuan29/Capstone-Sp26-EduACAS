using AcasService.Application.Mappers;
using AcasService.Application.Queries.Subject;
using AcasService.Models;
using AcasService.Repositories.Subject;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AcasService.Tests.Queries
{
    public class SubjectQueryTests
    {
        private readonly Mock<ISubjectRepository> _subjectRepositoryMock;
        private readonly SubjectMapper _subjectMapper;
        private readonly Mock<ILogger<SubjectQuery>> _loggerMock;
        private readonly SubjectQuery _sut;

        public SubjectQueryTests()
        {
            _subjectRepositoryMock = new Mock<ISubjectRepository>();
            _subjectMapper = new SubjectMapper();
            _loggerMock = new Mock<ILogger<SubjectQuery>>();
            _sut = new SubjectQuery(_subjectRepositoryMock.Object, _subjectMapper, _loggerMock.Object);
        }

        // F077: GetAllSubjectsAsync()

        [Fact]
        public async Task GetAllSubjectsAsync_UTC01_Normal_ShouldReturnList_WhenISubjectRepositoryFindAllAsyncReturnsList()
        {
            var subjects = new List<Subject>
            {
                new Subject { Id = "s1", SubjectName = "Math", SubjectCode = "MA101" },
                new Subject { Id = "s2", SubjectName = "Physics", SubjectCode = "PH101" }
            };
            _subjectRepositoryMock.Setup(r => r.FindAllAsync()).ReturnsAsync(subjects);

            var result = await _sut.GetAllSubjectsAsync();

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("Math", result[0].SubjectName);
        }

        [Fact]
        public async Task GetAllSubjectsAsync_UTC02_Boundary_ShouldReturnEmptyList_WhenISubjectRepositoryFindAllAsyncReturnsEmptyList()
        {
            _subjectRepositoryMock.Setup(r => r.FindAllAsync()).ReturnsAsync(new List<Subject>());

            var result = await _sut.GetAllSubjectsAsync();

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllSubjectsAsync_UTC03_Abnormal_ShouldThrowException_WhenISubjectRepositoryFindAllAsyncThrowsException()
        {
            _subjectRepositoryMock.Setup(r => r.FindAllAsync()).ThrowsAsync(new Exception("Database error"));

            var ex = await Assert.ThrowsAsync<Exception>(() => _sut.GetAllSubjectsAsync());
            Assert.Equal("Database error", ex.Message);
        }

        // F078: SearchSubjectsAsync(string? searchTerm, bool? isDeleted, string? createdBy)

        [Fact]
        public async Task SearchSubjectsAsync_UTC01_Abnormal_ShouldReturnList_WhenSearchTermIsProgramming()
        {
            var subjects = new List<Subject> { new Subject { SubjectName = "Programming 1" } };
            _subjectRepositoryMock.Setup(r => r.SearchAsync("Programming", null, null)).ReturnsAsync(subjects);

            var result = await _sut.SearchSubjectsAsync("Programming", null, null);

            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact]
        public async Task SearchSubjectsAsync_UTC02_Abnormal_ShouldReturnList_WhenIsDeletedIsFalse()
        {
            var subjects = new List<Subject> { new Subject { SubjectName = "Math", IsDeleted = false } };
            _subjectRepositoryMock.Setup(r => r.SearchAsync(null, false, null)).ReturnsAsync(subjects);

            var result = await _sut.SearchSubjectsAsync(null, false, null);

            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact]
        public async Task SearchSubjectsAsync_UTC03_Abnormal_ShouldReturnList_WhenCreatedByIsU1()
        {
            var subjects = new List<Subject> { new Subject { SubjectName = "Physics", CreatedBy = "u1" } };
            _subjectRepositoryMock.Setup(r => r.SearchAsync(null, null, "u1")).ReturnsAsync(subjects);

            var result = await _sut.SearchSubjectsAsync(null, null, "u1");

            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact]
        public async Task SearchSubjectsAsync_UTC04_Normal_ShouldReturnList_WhenAllParametersAreProvided()
        {
            var subjects = new List<Subject> { new Subject { SubjectName = "Math", IsDeleted = true, CreatedBy = "u1" } };
            _subjectRepositoryMock.Setup(r => r.SearchAsync("Math", true, "u1")).ReturnsAsync(subjects);

            var result = await _sut.SearchSubjectsAsync("Math", true, "u1");

            Assert.NotNull(result);
            Assert.Single(result);
        }

        // F079: GetPagedSubjectsAsync

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC01_Abnormal_ShouldReturnPagedResponse_WhenValidInputsProvided()
        {
            var subjects = Enumerable.Range(1, 10).Select(i => new Subject { Id = i.ToString() }).ToList();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(1, 10, null, true, true)).ReturnsAsync((subjects, 50));

            var result = await _sut.GetPagedSubjectsAsync(1, 10, null, true, true);

            Assert.NotNull(result);
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(50, result.TotalCount);
            Assert.Equal(5, result.TotalPages);
        }

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC02_Abnormal_ShouldReturnSortedByNameAsc()
        {
            var subjects = new List<Subject>();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(1, 10, "Name", true, null)).ReturnsAsync((subjects, 0));

            var result = await _sut.GetPagedSubjectsAsync(1, 10, "Name", true, null);

            Assert.NotNull(result);
            _subjectRepositoryMock.Verify(r => r.GetPagedAsync(1, 10, "Name", true, null), Times.Once);
        }

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC03_Abnormal_ShouldReturnSortedByNameDesc()
        {
            var subjects = new List<Subject>();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(1, 10, "Name", false, null)).ReturnsAsync((subjects, 0));

            var result = await _sut.GetPagedSubjectsAsync(1, 10, "Name", false, null);

            Assert.NotNull(result);
            _subjectRepositoryMock.Verify(r => r.GetPagedAsync(1, 10, "Name", false, null), Times.Once);
        }

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC04_Abnormal_ShouldCorrectPageSize_WhenExceeds100()
        {
            var subjects = new List<Subject>();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(1, 100, null, true, null)).ReturnsAsync((subjects, 0));

            var result = await _sut.GetPagedSubjectsAsync(1, 200, null, true, null);

            Assert.Equal(100, result.PageSize);
            _subjectRepositoryMock.Verify(r => r.GetPagedAsync(1, 100, null, true, null), Times.Once);
        }

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC05_Abnormal_ShouldCorrectPage_WhenIsZero()
        {
            var subjects = new List<Subject>();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(1, 10, null, true, null)).ReturnsAsync((subjects, 0));

            var result = await _sut.GetPagedSubjectsAsync(0, 10, null, true, null);

            Assert.Equal(1, result.Page);
            _subjectRepositoryMock.Verify(r => r.GetPagedAsync(1, 10, null, true, null), Times.Once);
        }

        [Fact]
        public async Task GetPagedSubjectsAsync_UTC06_Abnormal_ShouldReturnCorrectPage_WhenPageIs3()
        {
            var subjects = new List<Subject>();
            _subjectRepositoryMock.Setup(r => r.GetPagedAsync(3, 10, null, true, true)).ReturnsAsync((subjects, 30));

            var result = await _sut.GetPagedSubjectsAsync(3, 10, null, true, true);

            Assert.Equal(3, result.Page);
            _subjectRepositoryMock.Verify(r => r.GetPagedAsync(3, 10, null, true, true), Times.Once);
        }
    }
}
