using System.Net;
using System.Text;
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
    public class CompilationApiTests
    {
        private readonly Mock<HttpMessageHandler> _handlerMock;
        private readonly HttpClient _httpClient;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<ILogger<CompilationApi>> _loggerMock;
        private readonly CompilationApi _sut;

        public CompilationApiTests()
        {
            _handlerMock = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_handlerMock.Object);
            _configMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<CompilationApi>>();

            _configMock.Setup(c => c["CodeRunner:BaseUrl"]).Returns("http://localhost:5000");

            _sut = new CompilationApi(_httpClient, _configMock.Object, _loggerMock.Object);
        }

        private void SetupResponse(HttpStatusCode code, object body)
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

        // F039: CompileAsync(string runnerId, CompileRequest request, string? lang)

        [Fact]
        public async Task CompileAsync_UTC01_Abnormal_ShouldReturnSuccess_WhenEverythingIsCorrect()
        {
            var resultBody = new CompilationResult { Code = 0, ExecutableFilename = "test.exe" };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new CompileRequest { Source = "print('hello')", Lang = "python" };
            var result = await _sut.CompileAsync("python3", request, null);

            Assert.Equal(0, result.Code);
            Assert.NotNull(result.ExecutableFilename);
        }

        [Fact]
        public async Task CompileAsync_UTC02_Abnormal_ShouldReturnError_WhenSyntaxErrorExists()
        {
            var resultBody = new CompilationResult 
            { 
                Code = 1, 
                Stderr = new List<ResultLine> { new ResultLine { Text = "SyntaxError" } } 
            };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new CompileRequest { Source = "print('hello'\"", Lang = "python" };
            var result = await _sut.CompileAsync("python3", request, null);

            Assert.NotEqual(0, result.Code);
            Assert.NotEmpty(result.Stderr);
        }

        [Fact]
        public async Task CompileAsync_UTC03_Abnormal_ShouldThrowHttpRequestException_WhenCompilerNotFound()
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.NotFound });

            var request = new CompileRequest { Source = "print('hello')", Lang = "python" };
            
            await Assert.ThrowsAsync<HttpRequestException>(() => _sut.CompileAsync("nonexistent-compiler", request, null));
        }

        [Fact]
        public async Task CompileAsync_UTC04_Abnormal_ShouldThrowArgumentException_WhenLanguageIsNull()
        {
            var request = new CompileRequest { Source = "print('hello')", Lang = null };
            
            await Assert.ThrowsAsync<ArgumentException>(() => _sut.CompileAsync("python3", request, null));
        }

        [Fact]
        public async Task CompileAsync_UTC05_Abnormal_ShouldUseLangFromBodyAsFallback()
        {
            SetupResponse(HttpStatusCode.OK, new CompilationResult { Code = 0 });

            var request = new CompileRequest { Source = "print('hello')", Lang = "python" };
            var result = await _sut.CompileAsync("python3", request, null);

            Assert.NotNull(result);
        }

        [Fact]
        public async Task CompileAsync_UTC06_Normal_ShouldUseLangFromQueryParam()
        {
            SetupResponse(HttpStatusCode.OK, new CompilationResult { Code = 0 });

            var request = new CompileRequest { Source = "print('hello')", Lang = "wrong-lang" };
            var result = await _sut.CompileAsync("python3", request, "python");

            Assert.NotNull(result);
        }

        [Fact]
        public async Task CompileAsync_UTC07_Abnormal_ShouldHandleLargeCodeSnippet()
        {
            SetupResponse(HttpStatusCode.OK, new CompilationResult { Code = 0 });

            var largeCode = new string('x', 100000);
            var request = new CompileRequest { Source = largeCode, Lang = "python" };
            var result = await _sut.CompileAsync("python3", request, "python");

            Assert.NotNull(result);
        }

        // F093: RunBatchAsync(string compilerId, RumBatchRequest runBatchRequest, string? lang)

        [Fact]
        public async Task RunBatchAsync_UTC01_Abnormal_ShouldReturnResults_WhenEverythingIsCorrect()
        {
            var resultBody = new RunBatchResponse 
            { 
                Code = 0, 
                ExecResults = new List<CompilationResult> { new CompilationResult { Code = 0 } } 
            };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new RumBatchRequest 
            { 
                Source = "print(input())", 
                Lang = "python", 
                StdinList = new List<string> { "test" } 
            };
            var result = await _sut.RunBatchAsync("python3", request, null);

            Assert.NotNull(result.ExecResults);
            Assert.NotEmpty(result.ExecResults);
        }

        [Fact]
        public async Task RunBatchAsync_UTC02_Abnormal_ShouldThrowHttpRequestException_WhenCompilerNotFound()
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.NotFound });

            var request = new RumBatchRequest { Source = "print('hi')", Lang = "python", StdinList = new List<string> { "1" } };
            
            await Assert.ThrowsAsync<HttpRequestException>(() => _sut.RunBatchAsync("nonexistent", request, null));
        }

        [Fact]
        public async Task RunBatchAsync_UTC03_Abnormal_ShouldThrowArgumentException_WhenStdinListIsEmpty()
        {
            var request = new RumBatchRequest { Source = "print('hi')", Lang = "python", StdinList = new List<string>() };
            
            await Assert.ThrowsAsync<ArgumentException>(() => _sut.RunBatchAsync("python3", request, null));
        }

        [Fact]
        public async Task RunBatchAsync_UTC04_Abnormal_ShouldThrowArgumentException_WhenLanguageIsNull()
        {
            var request = new RumBatchRequest { Source = "print('hi')", Lang = null, StdinList = new List<string> { "1" } };
            
            await Assert.ThrowsAsync<ArgumentException>(() => _sut.RunBatchAsync("python3", request, null));
        }

        [Fact]
        public async Task RunBatchAsync_UTC05_Normal_ShouldReturnTimedOut_WhenExecutionTimesOut()
        {
            var resultBody = new RunBatchResponse { Code = 0, TimedOut = true };
            SetupResponse(HttpStatusCode.OK, resultBody);

            var request = new RumBatchRequest { Source = "while True: pass", Lang = "python", StdinList = new List<string> { "1" } };
            var result = await _sut.RunBatchAsync("python3", request, "python");

            Assert.True(result.TimedOut);
        }

        [Fact]
        public async Task RunBatchAsync_UTC06_Boundary_ShouldHandleLargeCodeSnippet()
        {
            SetupResponse(HttpStatusCode.OK, new RunBatchResponse { Code = 0, ExecResults = new List<CompilationResult>() });

            var largeCode = new string('x', 100000);
            var request = new RumBatchRequest { Source = largeCode, Lang = "python", StdinList = new List<string> { "a" } };
            var result = await _sut.RunBatchAsync("python3", request, "python");

            Assert.NotNull(result);
        }

        // F-diagnostics-color flag tests

        [Fact]
        public async Task CompileAsync_ShouldAppendFDiagnosticsColorNever_WhenCppLanguage()
        {
            CompileRequest? capturedRequest = null;
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
                {
                    using var reader = new StreamReader(req.Content!.ReadAsStream());
                    var body = reader.ReadToEnd();
                    capturedRequest = JsonSerializer.Deserialize<CompileRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                })
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"code\":0}") });

            var request = new CompileRequest
            {
                Source = "#include <stdio.h>",
                Lang = "cpp",
                Options = new CompileOptions { UserArguments = "-std=c++17 -O2" }
            };
            await _sut.CompileAsync("cpp17", request, null);

            Assert.NotNull(capturedRequest);
            Assert.Contains("-fdiagnostics-color=never", capturedRequest!.Options.UserArguments);
        }

        [Fact]
        public async Task CompileAsync_ShouldNotDuplicateFDiagnosticsColor_WhenAlreadyPresent()
        {
            CompileRequest? capturedRequest = null;
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
                {
                    using var reader = new StreamReader(req.Content!.ReadAsStream());
                    var body = reader.ReadToEnd();
                    capturedRequest = JsonSerializer.Deserialize<CompileRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                })
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"code\":0}") });

            var request = new CompileRequest
            {
                Source = "#include <stdio.h>",
                Lang = "c++",
                Options = new CompileOptions { UserArguments = "-std=c++17 -fdiagnostics-color=always" }
            };
            await _sut.CompileAsync("cpp17", request, null);

            Assert.NotNull(capturedRequest);
            Assert.Equal("-std=c++17 -fdiagnostics-color=always", capturedRequest!.Options.UserArguments);
        }

        [Fact]
        public async Task CompileAsync_ShouldNotAddFDiagnosticsColor_WhenNotCppLanguage()
        {
            CompileRequest? capturedRequest = null;
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
                {
                    using var reader = new StreamReader(req.Content!.ReadAsStream());
                    var body = reader.ReadToEnd();
                    capturedRequest = JsonSerializer.Deserialize<CompileRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                })
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"code\":0}") });

            var request = new CompileRequest
            {
                Source = "print('hello')",
                Lang = "python",
                Options = new CompileOptions { UserArguments = "" }
            };
            await _sut.CompileAsync("python3", request, null);

            Assert.NotNull(capturedRequest);
            Assert.DoesNotContain("-fdiagnostics-color", capturedRequest!.Options.UserArguments ?? "");
        }

        [Fact]
        public async Task CompileAsync_ShouldSetFDiagnosticsColorNever_WhenCppLanguageWithNoExistingArgs()
        {
            CompileRequest? capturedRequest = null;
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
                {
                    using var reader = new StreamReader(req.Content!.ReadAsStream());
                    var body = reader.ReadToEnd();
                    capturedRequest = JsonSerializer.Deserialize<CompileRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                })
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"code\":0}") });

            var request = new CompileRequest
            {
                Source = "#include <stdio.h>",
                Lang = "c",
                Options = new CompileOptions { UserArguments = null }
            };
            await _sut.CompileAsync("c", request, null);

            Assert.NotNull(capturedRequest);
            Assert.Equal("-fdiagnostics-color=never", capturedRequest!.Options.UserArguments);
        }

        [Fact]
        public async Task RunBatchAsync_ShouldAppendFDiagnosticsColorNever_WhenCppLanguage()
        {
            RumBatchRequest? capturedRequest = null;
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
                {
                    using var reader = new StreamReader(req.Content!.ReadAsStream());
                    var body = reader.ReadToEnd();
                    capturedRequest = JsonSerializer.Deserialize<RumBatchRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                })
                .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"code\":0,\"execResults\":[]}") });

            var request = new RumBatchRequest
            {
                Source = "#include <stdio.h>",
                Lang = "cpp",
                StdinList = new List<string> { "1" },
                Options = new CompileOptions { UserArguments = "-O2" }
            };
            await _sut.RunBatchAsync("cpp17", request, null);

            Assert.NotNull(capturedRequest);
            Assert.Contains("-fdiagnostics-color=never", capturedRequest!.Options.UserArguments);
        }
    }
}
