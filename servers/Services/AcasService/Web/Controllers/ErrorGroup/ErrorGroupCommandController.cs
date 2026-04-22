using AcasService.Application.Commands.ErrorGroup;
using AcasService.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcasService.Application.ResponseDTOs;
using AcasService.Web.Requests;
using AcasService.Application.Mappers;

namespace AcasService.Web.Controllers.ErrorGroup;

[ApiController]
[Route("api/v1/error-groups")]
[Authorize(Roles = "LECTURER")]
public class ErrorGroupCommandController : ControllerBase
{
    private readonly IErrorGroupCommand _errorGroupCommand;
    private readonly ErrorGroupMapper _errorGroupMapper;
    private readonly ILogger<ErrorGroupCommandController> _logger;

    public ErrorGroupCommandController(
        IErrorGroupCommand errorGroupCommand,
        ErrorGroupMapper errorGroupMapper,
        ILogger<ErrorGroupCommandController> logger)
    {
        _errorGroupCommand = errorGroupCommand;
        _errorGroupMapper = errorGroupMapper;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<int>>> GenerateGroups([FromBody] ErrorGroupRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.ExamId) || string.IsNullOrEmpty(request.ProblemId))
                return ResponseUtil.Error<int>("ExamId and ProblemId are required", 400);

            var count = await _errorGroupCommand.GroupSubmissionsByErrorsAsync(request.ExamId, request.ProblemId);
            return ResponseUtil.Success(count, $"Successfully generated {count} error groups", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating error groups for problem {ProblemId}", request.ProblemId);
            return ResponseUtil.Error<int>("Failed to generate error groups", 500);
        }
    }

    [HttpPost("check-similarity")]
    public async Task<ActionResult<ApiResponse<string>>> CheckSimilarity([FromBody] ErrorGroupRequest request)
    {
        try
        {
            if (request.GroupIds != null && request.GroupIds.Count > 0)
            {
                // await _errorGroupCommand.CheckSimilarityForGroupsAsync(request.GroupIds);
                await _errorGroupCommand.CheckSimilarityForGroupsWithExcludeCodeBaseAsync(request.GroupIds);
            }
            else if (!string.IsNullOrEmpty(request.ProblemId))
            {
                await _errorGroupCommand.CheckSimilarityForProblemWithExcludeCodeBaseAsync(request.ExamId, request.ProblemId);
            }
            else
            {
                return ResponseUtil.Error<string>("ProblemId or GroupIds are required", 400);
            }
            
            return ResponseUtil.Success("Similarity check completed.", "Success", 200);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking similarity for problem {ProblemId}", request.ProblemId);
            return ResponseUtil.Error<string>("Failed to check similarity", 500);
        }
    }
}
