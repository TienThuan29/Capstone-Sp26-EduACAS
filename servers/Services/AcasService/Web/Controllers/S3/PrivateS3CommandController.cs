using AcasService.Application.Commands.S3;
using AcasService.Application.Utils;
using AcasService.Web.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AcasService.Web.Controllers.S3;

[ApiController]
[Route("api/v1/private-s3")]
[Authorize]  // Allow any authenticated user
public class PrivateS3CommandController : ControllerBase
{
    private readonly ILogger<PrivateS3CommandController> _logger;

    private readonly IPrivateS3Command _privateS3Command;

    public PrivateS3CommandController(ILogger<PrivateS3CommandController> logger, IPrivateS3Command privateS3Command)
    {
        _logger = logger;
        _privateS3Command = privateS3Command;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "STUDENT, LECTURER, ADMIN")]  // Allow students to upload files
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> UploadFile([FromForm] UploadFileRequest request)
    {
        var file = request.File;
        if (file == null || file.Length == 0)
            return ResponseUtil.Error<object>("No file uploaded.", statusCode: 400);

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        try
        {
            var url = await _privateS3Command.UploadFilesAsync(
                ms.ToArray(),
                Path.GetFileName(file.FileName),
                file.ContentType
            );

            return ResponseUtil.Success(new { url = url }, "File uploaded successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload {File}", file.FileName);
            return ResponseUtil.Error<object>("Failed to upload file.", error: ex.Message, stack: ex.StackTrace);
        }
    }


    [HttpDelete("delete/{filename}")]
    [Authorize(Roles = "LECTURER, ADMIN")]  // Only lecturers and admins can delete files
    public async Task<ActionResult<ApiResponse<object>>> DeleteFile([FromRoute] string filename)
    {
        try
        {
            var result = await _privateS3Command.DeleteFilesAsync(filename);
            return ResponseUtil.Success(new { message = result }, "File deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete {FileName}", filename);
            return ResponseUtil.Error<object>("Failed to delete file.", error: ex.Message, stack: ex.StackTrace);
        }
    }
}