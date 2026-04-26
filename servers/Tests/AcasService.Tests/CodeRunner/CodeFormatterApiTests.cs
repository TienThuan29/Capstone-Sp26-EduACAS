using System.Net;
using System.Text.Json;
using AcasService.Application.CodeRunner;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Web.Requests;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace AcasService.Tests.CodeRunner
{
    public class CodeFormatterApiTests
    {
        private readonly Mock<HttpMessageHandler> _handlerMock;
        private readonly HttpClient _httpClient;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<ILogger<CodeFormatterApi>> _loggerMock;
        private readonly CodeFormatterApi _sut;

        public CodeFormatterApiTests()
        {
            _handlerMock = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_handlerMock.Object);
            _configMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<CodeFormatterApi>>();

            _configMock.Setup(c => c["CodeRunner:BaseUrl"]).Returns("http://localhost:5000");

            _sut = new CodeFormatterApi(_httpClient, _configMock.Object, _loggerMock.Object);
        }

        private void SetupResponse(HttpStatusCode code, object? body)
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = code,
                    Content = new StringContent(JsonSerializer.Serialize(body, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }))
                });
        }

        [Fact]
        public async Task FormatCodeAsync_UTC01_Abnormal_ShouldReturnFormattedCode_WhenSuccess()
        {
            var resultBody = new FormatCodeResponse { Code = 0, Formatted = "print('hello')" };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new FormatCodeRequest { Source = "print('hello')" };
            var result = await _sut.FormatCodeAsync("python", request);

            Assert.NotNull(result.Formatted);
            Assert.Equal("print('hello')", result.Formatted);
        }

        [Fact]
        public async Task FormatCodeAsync_UTC02_Abnormal_ShouldThrowHttpRequestException_WhenLanguageInvalid()
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest });

            var request = new FormatCodeRequest { Source = "print('hello')" };
            
            await Assert.ThrowsAsync<HttpRequestException>(() => _sut.FormatCodeAsync("nonexistent-lang", request));
        }

        [Fact]
        public async Task FormatCodeAsync_UTC03_Abnormal_ShouldThrowArgumentException_WhenLangIsEmpty()
        {
            var request = new FormatCodeRequest { Source = "print('hello')" };
            
            await Assert.ThrowsAsync<ArgumentException>(() => _sut.FormatCodeAsync("", request));
        }

        [Fact]
        public async Task FormatCodeAsync_UTC04_Abnormal_ShouldThrowArgumentException_WhenSourceIsEmpty()
        {
            var request = new FormatCodeRequest { Source = "" };
            
            await Assert.ThrowsAsync<ArgumentException>(() => _sut.FormatCodeAsync("python", request));
        }

        [Fact]
        public async Task FormatCodeAsync_UTC05_Abnormal_ShouldThrowInvalidOperationException_WhenResponseIsNull()
        {
            SetupResponse(HttpStatusCode.OK, null);

            var request = new FormatCodeRequest { Source = "print('hello')" };
            
            await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.FormatCodeAsync("python", request));
        }

        [Fact]
        public async Task FormatCodeAsync_UTC06_Normal_ShouldReturnFormattedCodeWithComments()
        {
            var formatted = "# comment\nprint('hello')";
            var resultBody = new FormatCodeResponse { Code = 0, Formatted = formatted };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new FormatCodeRequest { Source = "#comment\nprint('hello')" };
            var result = await _sut.FormatCodeAsync("python", request);

            Assert.Equal(formatted, result.Formatted);
        }
    }
}
