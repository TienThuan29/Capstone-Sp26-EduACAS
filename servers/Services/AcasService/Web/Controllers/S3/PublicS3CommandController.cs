using AcasService.Application.Commands.S3;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.S3;

[ApiController]
[Route("api/v1/public-s3")]
[Authorize]
public class PublicS3CommandController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private readonly ILogger<PublicS3CommandController> _logger;
    private readonly IPublicS3Command _publicS3Command;

    public PublicS3CommandController(
        ILogger<PublicS3CommandController> logger,
        IPublicS3Command publicS3Command)
    {
        _logger = logger;
        _publicS3Command = publicS3Command;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> UploadFile([FromForm] UploadFileRequest request)
    {
        var file = request.File;
        if (file == null || file.Length == 0)
            return ResponseUtil.Error<object>("No file uploaded.", statusCode: 400);

        if (!AllowedImageContentTypes.Contains(file.ContentType))
            return ResponseUtil.Error<object>(
                "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.",
                statusCode: 400);

        const int maxSizeBytes = 5 * 1024 * 1024; // 5 MB
        if (file.Length > maxSizeBytes)
            return ResponseUtil.Error<object>("File size must be 5 MB or less.", statusCode: 400);

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        try
        {
            var url = await _publicS3Command.UploadFileAsync(
                ms.ToArray(),
                Path.GetFileName(file.FileName),
                file.ContentType);

            return ResponseUtil.Success(new { url }, "File uploaded successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload {File}", file.FileName);
            return ResponseUtil.Error<object>("Failed to upload file.", error: ex.Message, stack: ex.StackTrace);
        }
    }
}
