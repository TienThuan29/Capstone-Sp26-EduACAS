using AcasService.Application.Queries.S3;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcasService.Application.Utils;

namespace AcasService.Web.Controllers.S3;

[ApiController]
[Route("api/v1/private-s3")]
[Authorize(Roles = "STUDENT, LECTURER, ADMIN")]
public class PrivateS3QueryController
{
      private readonly ILogger<PrivateS3QueryController> _logger;

      private readonly IPrivateS3Query _privateS3Query;

      public PrivateS3QueryController(ILogger<PrivateS3QueryController> logger, IPrivateS3Query privateS3Query)
      {
            _logger = logger;
            _privateS3Query = privateS3Query;
      }

      [HttpGet("file/{filename}")]
      public async Task<ActionResult<ApiResponse<object>>> GetFileUrl([FromRoute]string filename)
      {
            try
            {
                  var url = await _privateS3Query.GetFileUrlAsync(filename);
                  return ResponseUtil.Success(new { url = url }, "File URL generated successfully.");
            }
            catch (Exception ex)
            {
                  _logger.LogError(ex, "Failed to generate URL for {FileName}", filename);
                  return ResponseUtil.Error<object>("Failed to generate file URL.", error: ex.Message, stack: ex.StackTrace);
            }
      }

}