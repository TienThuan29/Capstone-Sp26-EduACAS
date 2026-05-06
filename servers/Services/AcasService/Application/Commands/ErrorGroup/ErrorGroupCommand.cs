using AcasService.Repositories.Submission;
using AcasService.Repositories.ErrorGroup;
using AcasService.Repositories.Problem;
using AcasService.Models;
using AcasService.Application.Utils;

namespace AcasService.Application.Commands.ErrorGroup;

public interface IErrorGroupCommand
{
    Task<int> GroupSubmissionsByErrorsAsync(string examId, string problemId);
    Task CheckSimilarityForGroupsAsync(List<string> groupIds,
        int? minTokenMatch = null, double? minSimilarity = null, bool? excludeBaseCode = null);

    Task CheckSimilarityForProblemAsync(string examId, string problemId,
        int? minTokenMatch = null, double? minSimilarity = null, bool? excludeBaseCode = null);

    Task<int> CalculateRecommendedMinTokenMatchAsync(string examId, string problemId);
}

public class ErrorGroupCommand : IErrorGroupCommand
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IErrorGroupRepository _errorGroupRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly IJPlagCommand _jplagCommand;
    private readonly ILogger<ErrorGroupCommand> _logger;

    public ErrorGroupCommand(
        ISubmissionRepository submissionRepository,
        IErrorGroupRepository errorGroupRepository,
        IProblemRepository problemRepository,
        IJPlagCommand jplagCommand,
        ILogger<ErrorGroupCommand> logger)
    {
        _submissionRepository = submissionRepository;
        _errorGroupRepository = errorGroupRepository;
        _problemRepository = problemRepository;
        _jplagCommand = jplagCommand;
        _logger = logger;
    }

    public async Task<int> GroupSubmissionsByErrorsAsync(string examId, string problemId)
    {
        try
        {
            var submissions = await _submissionRepository.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId);
            var gradedSubmissions = submissions
                .Where(s => s.Status == SubmissionStatus.GRADED || s.Status == SubmissionStatus.REGRADED)
                .ToList();

            if (gradedSubmissions.Count == 0) return 0;

            var signatureGroups = gradedSubmissions
                .Select(s => new { Submission = s, Signature = GenerateErrorSignature(s) })
                .Where(x => !string.IsNullOrEmpty(x.Signature))
                .GroupBy(x => x.Signature)
                .Where(g => g.Count() >= 2)
                .ToList();

            await _errorGroupRepository.DeleteByProblemIdPaginatedAsync(examId, problemId);

            int createdCount = 0;
            foreach (var group in signatureGroups)
            {
                var errorGroup = new Models.ErrorGroup
                {
                    ProblemId = problemId,
                    ExamId = examId,
                    ErrorSignature = group.Key,
                    SubmissionIds = group.Select(x => x.Submission.Id).ToList(),
                    JPlagStatus = JPlagStatus.PENDING,
                    CreatedDate = DateTime.UtcNow
                };

                var created = await _errorGroupRepository.CreateAsync(errorGroup);
                if (created != null) createdCount++;
            }

            return createdCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to group submissions for problem {ProblemId}", problemId);
            throw;
        }
    }

    public async Task CheckSimilarityForProblemAsync(string examId, string problemId,
        int? minTokenMatch = null, double? minSimilarity = null, bool? excludeBaseCode = null)
    {
        var groups = await _errorGroupRepository.GetByProblemIdPaginatedAsync(examId, problemId);
        if (groups == null || groups.Count == 0) return;

        await ProcessCheckSimilarityForGroups(groups, minTokenMatch, minSimilarity, excludeBaseCode);
    }

    public async Task CheckSimilarityForGroupsAsync(List<string> groupIds,
        int? minTokenMatch = null, double? minSimilarity = null, bool? excludeBaseCode = null)
    {
        if (groupIds == null || groupIds.Count == 0) return;

        var groups = new List<Models.ErrorGroup>();
        foreach (var id in groupIds)
        {
            var group = await _errorGroupRepository.GetByIdAsync(id);
            if (group != null) groups.Add(group);
        }

        if (groups.Count == 0) return;
        await ProcessCheckSimilarityForGroups(groups, minTokenMatch, minSimilarity, excludeBaseCode);
    }

    public async Task<int> CalculateRecommendedMinTokenMatchAsync(string examId, string problemId)
    {
        var submissions = await _submissionRepository.GetLatestVersionSubmissionsOfProblemInExamPaginatedAsync(examId, problemId);
        var validSubmissions = submissions
            .Where(s => !string.IsNullOrWhiteSpace(s.Source))
            .ToList();

        if (validSubmissions.Count < 2) return 4;

        string? baseCode = null;
        var problem = await _problemRepository.GetByIdAsync(problemId);
        if (problem?.CodeTemplates != null)
        {
            var language = validSubmissions[0].LanguageId;
            if (!string.IsNullOrEmpty(language) && problem.CodeTemplates.TryGetValue(language, out var template))
            {
                baseCode = template;
            }
        }

        return _jplagCommand.CalculateRecommendedMinTokenMatch(validSubmissions, baseCode);
    }

    private async Task ProcessCheckSimilarityForGroups(List<Models.ErrorGroup> groups,
        int? minTokenMatch = null, double? minSimilarity = null, bool? excludeBaseCode = null)
    {
        bool shouldExcludeBaseCode = excludeBaseCode ?? true;

        foreach (var group in groups)
        {
            if (group.SubmissionIds == null || group.SubmissionIds.Count < 2) continue;

            _logger.LogInformation("Starting similarity check with base-code exclusion for group {GroupId}", group.Id);

            var submissions = new List<Models.Submission>();
            foreach (var sid in group.SubmissionIds)
            {
                var sub = await _submissionRepository.GetByIdAsync(sid);
                if (sub != null) submissions.Add(sub);
            }

            if (submissions.Count < 2) continue;

            var language = submissions[0].LanguageId;
            string? baseCode = null;
            string? baseCodeFileName = null;

            if (shouldExcludeBaseCode && !string.IsNullOrEmpty(group.ProblemId))
            {
                var problem = await _problemRepository.GetByIdAsync(group.ProblemId);
                if (problem?.CodeTemplates != null && problem.CodeTemplates.TryGetValue(language, out var template))
                {
                    baseCode = template;
                    baseCodeFileName = $"basecode.{LanguageUtils.GetExtensionForLanguage(language)}";
                    _logger.LogInformation("Found base-code template for problem {ProblemId}, language {Lang} (length: {Len})",
                        group.ProblemId, language, template.Length);
                }
                else
                {
                    _logger.LogInformation("No base-code template found for problem {ProblemId}, language {Lang}",
                        group.ProblemId, language);
                }
            }

            group.JPlagStatus = JPlagStatus.RUNNING;
            await _errorGroupRepository.UpdateAsync(group);

            try
            {
                var results = await _jplagCommand.RunSimilarityCheckAsync(
                    language,
                    submissions,
                    baseCode,
                    baseCodeFileName,
                    minTokenMatch,
                    minSimilarity);

                group.JPlagResults = results;
                group.JPlagStatus = JPlagStatus.COMPLETED;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running JPlag with base-code exclusion for group {GroupId}", group.Id);
                group.JPlagStatus = JPlagStatus.FAILED;
            }

            await _errorGroupRepository.UpdateAsync(group);
        }
    }



    private string GenerateErrorSignature(Models.Submission submission)
    {
        var failedResults = submission.TestResults
            .Where(tr => tr.Status != TestcaseStatus.SUCCESS)
            .OrderBy(tr => tr.TestcaseId)
            .Select(tr => {
                string category = tr.Status.ToString();
                string detail = "NoOutput";

                if (tr.Status == TestcaseStatus.TIMEOUT)
                {
                    detail = "TimeOut";
                }
                else if (tr.Status == TestcaseStatus.COMPILE_ERROR)
                {
                    detail = "CompileError";
                }
                else if (tr.Status == TestcaseStatus.RUNTIME_ERROR)
                {
                    string output = (tr.ActualOutput ?? "").ToLower();
                    if (output.Contains("dividebyzero") || output.Contains("/ by zero"))
                        detail = "DivideByZero";
                    else if (output.Contains("indexoutofrange") || output.Contains("indexoutofbounds") || output.Contains("out of range"))
                        detail = "OutOfRange";
                    else if (output.Contains("nullreference") || output.Contains("nullpointer"))
                        detail = "NullReference";
                    else if (output.Contains("stackoverflow"))
                        detail = "StackOverflow";
                    else if (output.Contains("memory") || output.Contains("out of memory"))
                        detail = "OutOfMemory";
                    else
                        detail = "OtherRuntimeError";
                }
                else if (!string.IsNullOrEmpty(tr.ActualOutput))
                {
                    detail = tr.ActualOutput.Trim()
                               .Replace("|", ":").Replace("_", "-")
                               .Replace("#", "")
                               .Replace("\r", "").Replace("\n", " ");
                    
                    if (detail.Length > 100) detail = detail.Substring(0, 97) + "...";
                }

                return $"{tr.TestcaseId}|{category}|{detail}";
            })
            .ToList();

        if (failedResults.Count == 0) return string.Empty;
        return string.Join("###", failedResults);
    }
}
