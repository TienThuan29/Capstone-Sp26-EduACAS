using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using AuthService.Application.Utils;

namespace AuthService.Tests.Utils;

public class ResponseUtilTests
{
    [Fact]
    public void Success_WithAnonymousObject_ReturnsOkResultWithCorrectStatus()
    {
        var dataResponse = new { Id = 1, Name = "Test" };

        var result = ResponseUtil.Success(dataResponse);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(200);
        var response = objectResult.Value;
        response.Should().NotBeNull();
        var success = response!.GetType().GetProperty("Success")?.GetValue(response);
        success.Should().Be(true);
    }

    [Fact]
    public void Success_WithStringData_ReturnsStringDataResponse()
    {
        var dataResponse = "simple string";

        var result = ResponseUtil.Success(dataResponse);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeAssignableTo<ApiResponse<string>>().Subject;
        response.DataResponse.Should().Be("simple string");
    }

    [Fact]
    public void Success_WithNullData_ReturnsNullDataResponse()
    {
        var result = ResponseUtil.Success<object>(null);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(200);
        var response = objectResult.Value.Should().BeAssignableTo<ApiResponse<object>>().Subject;
        response.DataResponse.Should().BeNull();
        response.Success.Should().BeTrue();
    }

    [Fact]
    public void Success_WithCustomMessageAndStatusCode_ReturnsCorrectMessageAndStatus()
    {
        var dataResponse = new { Value = 42 };
        var message = "Created successfully";

        var result = ResponseUtil.Success(dataResponse, message, 201);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);
        var response = objectResult.Value;
        response.Should().NotBeNull();
        var msg = response!.GetType().GetProperty("Message")?.GetValue(response);
        msg.Should().Be("Created successfully");
    }

    [Fact]
    public void Success_WithNestedData_PreservesNestedDataInResponse()
    {
        var dataResponse = new { Nested = new { Value = "x" }, List = new[] { 1, 2, 3 } };

        var result = ResponseUtil.Success(dataResponse);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value;
        response.Should().NotBeNull();
        var success = response!.GetType().GetProperty("Success")?.GetValue(response);
        success.Should().Be(true);
    }

    [Fact]
    public void Success_WithStatusCode204_Returns204StatusCode()
    {
        var dataResponse = "ok";

        var result = ResponseUtil.Success(dataResponse, "Success", 204);

        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(204);
    }

    [Fact]
    public void Error_DefaultParameters_ReturnsInternalServerError()
    {
        var result = ResponseUtil.Error<object>();

        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
        var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        response.Message.Should().Be("Internal Server Error");
        response.Success.Should().BeFalse();
    }

    [Fact]
    public void Error_NotFoundStatus_Returns404WithMessage()
    {
        var result = ResponseUtil.Error<object>("Not Found", 404);

        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(404);
        var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        response.Message.Should().Be("Not Found");
    }

    [Fact]
    public void Error_BadRequestStatus_Returns400WithMessage()
    {
        var result = ResponseUtil.Error<object>("Bad Request", 400);

        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(400);
        var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        response.Message.Should().Be("Bad Request");
    }

    [Fact]
    public void Error_WithDetailedError_ReturnsErrorField()
    {
        var result = ResponseUtil.Error<object>("Custom Error", 422, "Detailed validation error");

        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(422);
        var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        response.Error.Should().Be("Detailed validation error");
    }

    [Fact]
    public void Error_InDevelopmentEnvironment_IncludesStackTrace()
    {
        var originalEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

            var result = ResponseUtil.Error<object>("Error", 500, null, "at Method()");

            var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
            var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
            response.Stack.Should().Be("at Method()");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", originalEnv);
        }
    }

    [Fact]
    public void Error_NotInDevelopmentEnvironment_DoesNotIncludeStackTrace()
    {
        var originalEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");

            var result = ResponseUtil.Error<object>("Error", 500, null, "at Method()");

            var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
            var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
            response.Stack.Should().BeNull();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", originalEnv);
        }
    }

    [Fact]
    public void Error_ForbiddenStatus_Returns403()
    {
        var result = ResponseUtil.Error<object>("Forbidden", 403);

        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(403);
        var response = objectResult.Value.Should().BeOfType<ApiResponse<object>>().Subject;
        response.Message.Should().Be("Forbidden");
    }
}
