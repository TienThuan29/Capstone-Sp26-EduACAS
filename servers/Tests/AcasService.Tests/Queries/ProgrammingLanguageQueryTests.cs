using AcasService.Application.Mappers;
using AcasService.Application.Queries.ProgrammingLanguage;
using AcasService.Application.ResponseDTOs;
using AcasService.Models;
using AcasService.Repositories.ProgrammingLanguage;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AcasService.Tests.Queries
{
    public class ProgrammingLanguageQueryTests
    {
        private readonly Mock<IProgrammingLanguageRepository> _repositoryMock;
        private readonly Mock<ILogger<ProgrammingLanguageQuery>> _loggerMock;
        private readonly ProgrammingLanguageMapper _mapper;
        private readonly ProgrammingLanguageQuery _sut;

        public ProgrammingLanguageQueryTests()
        {
            _repositoryMock = new Mock<IProgrammingLanguageRepository>();
            _loggerMock = new Mock<ILogger<ProgrammingLanguageQuery>>();
            _mapper = new ProgrammingLanguageMapper();
            _sut = new ProgrammingLanguageQuery(_repositoryMock.Object, _loggerMock.Object, _mapper);
        }

        // F083: GetByIdAsync(string id)

        [Fact]
        public async Task GetByIdAsync_UTC01_Normal_ShouldReturnResponse_WhenIdExists()
        {
            var id = "python";
            var language = new ProgrammingLanguage { Id = id, Name = "Python" };
            _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(language);

            var result = await _sut.GetByIdAsync(id);

            Assert.NotNull(result);
            Assert.Equal("Python", result.Name);
        }

        [Fact]
        public async Task GetByIdAsync_UTC02_Abnormal_ShouldThrowException_WhenIdDoesNotExist()
        {
            var id = "nonexistent";
            _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((ProgrammingLanguage)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _sut.GetByIdAsync(id));
            Assert.Equal("Programming language with id not found.", ex.Message);
        }

        // F084: GetAllAsync()

        [Fact]
        public async Task GetAllAsync_UTC01_Normal_ShouldReturnList_WhenRepositoryReturnsList()
        {
            var languages = new List<ProgrammingLanguage>
            {
                new ProgrammingLanguage { Id = "1", Name = "C#" },
                new ProgrammingLanguage { Id = "2", Name = "Java" },
                new ProgrammingLanguage { Id = "3", Name = "Python" }
            };
            _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(languages);

            var result = await _sut.GetAllAsync();

            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async Task GetAllAsync_UTC02_Abnormal_ShouldThrowException_WhenRepositoryReturnsEmptyList()
        {
            _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<ProgrammingLanguage>());

            var ex = await Assert.ThrowsAsync<Exception>(() => _sut.GetAllAsync());
            Assert.Equal("No programming languages found.", ex.Message);
        }

        // F085: GetEnabledAsync()

        [Fact]
        public async Task GetEnabledAsync_UTC01_Normal_ShouldReturnOnlyEnabledLanguages()
        {
            var languages = new List<ProgrammingLanguage>
            {
                new ProgrammingLanguage { Id = "1", Name = "C#", Status = PLStatus.ENABLE },
                new ProgrammingLanguage { Id = "2", Name = "Java", Status = PLStatus.DISABLE }
            };
            _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(languages);

            var result = await _sut.GetEnabledAsync();

            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("ENABLE", result[0].Status);
        }

        [Fact]
        public async Task GetEnabledAsync_UTC02_Boundary_ShouldReturnEmpty_WhenNoEnabledLanguagesExist()
        {
            var languages = new List<ProgrammingLanguage>
            {
                new ProgrammingLanguage { Id = "1", Name = "C#", Status = PLStatus.DISABLE }
            };
            _repositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(languages);

            var result = await _sut.GetEnabledAsync();

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        // F086: GetPagedAsync(int page, int pageSize, string? sortBy, bool ascending)

        [Fact]
        public async Task GetPagedAsync_UTC01_Abnormal_ShouldReturnPagedResult()
        {
            var languages = Enumerable.Range(1, 10).Select(i => new ProgrammingLanguage { Id = i.ToString() }).ToList();
            _repositoryMock.Setup(r => r.GetPagedAsync(1, 10, null, true)).ReturnsAsync((languages, 25));

            var result = await _sut.GetPagedAsync(1, 10, null, true);

            Assert.NotNull(result);
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(25, result.TotalCount);
        }

        [Fact]
        public async Task GetPagedAsync_UTC02_Abnormal_ShouldCorrectPageSize_WhenExceeds100()
        {
            var languages = new List<ProgrammingLanguage>();
            _repositoryMock.Setup(r => r.GetPagedAsync(1, 100, null, true)).ReturnsAsync((languages, 0));

            var result = await _sut.GetPagedAsync(1, 200, null, true);

            Assert.Equal(100, result.PageSize);
            _repositoryMock.Verify(r => r.GetPagedAsync(1, 100, null, true), Times.Once);
        }

        [Fact]
        public async Task GetPagedAsync_UTC03_Boundary_ShouldSortByNameDescending()
        {
            var languages = new List<ProgrammingLanguage>();
            _repositoryMock.Setup(r => r.GetPagedAsync(1, 10, "Name", false)).ReturnsAsync((languages, 0));

            await _sut.GetPagedAsync(1, 10, "Name", false);

            _repositoryMock.Verify(r => r.GetPagedAsync(1, 10, "Name", false), Times.Once);
        }

        [Fact]
        public async Task GetPagedAsync_UTC04_Abnormal_ShouldCorrectPage_WhenLessThan1()
        {
            var languages = new List<ProgrammingLanguage>();
            _repositoryMock.Setup(r => r.GetPagedAsync(1, 10, null, true)).ReturnsAsync((languages, 0));

            var result = await _sut.GetPagedAsync(0, 10, null, true);

            Assert.Equal(1, result.Page);
            _repositoryMock.Verify(r => r.GetPagedAsync(1, 10, null, true), Times.Once);
        }
    }
}
