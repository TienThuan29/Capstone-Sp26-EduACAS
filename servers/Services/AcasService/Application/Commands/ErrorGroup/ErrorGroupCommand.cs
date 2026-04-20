using AcasService.Repositories.Submission;
using AcasService.Repositories.ErrorGroup;
using AcasService.Models;

namespace AcasService.Application.Commands.ErrorGroup;

public interface IErrorGroupCommand
{
    Task<int> GroupSubmissionsByErrorsAsync(string examId, string problemId);
    Task CheckSimilarityForProblemAsync(string examId, string problemId);
    Task CheckSimilarityForGroupsAsync(List<string> groupIds);
}

public class ErrorGroupCommand : IErrorGroupCommand
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IErrorGroupRepository _errorGroupRepository;
    private readonly IJPlagCommand _jplagCommand;
    private readonly ILogger<ErrorGroupCommand> _logger;

    public ErrorGroupCommand(
        ISubmissionRepository submissionRepository,
        IErrorGroupRepository errorGroupRepository,
        IJPlagCommand jplagCommand,
        ILogger<ErrorGroupCommand> logger)
    {
        _submissionRepository = submissionRepository;
        _errorGroupRepository = errorGroupRepository;
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

    public async Task CheckSimilarityForProblemAsync(string examId, string problemId)
    {
        var groups = await _errorGroupRepository.GetByProblemIdPaginatedAsync(examId, problemId);
        if (groups == null || groups.Count == 0) return;

        await ProcessCheckSimilarityForGroups(groups);
    }

    public async Task CheckSimilarityForGroupsAsync(List<string> groupIds)
    {
        if (groupIds == null || groupIds.Count == 0) return;

        var groups = new List<Models.ErrorGroup>();
        foreach (var id in groupIds)
        {
            var group = await _errorGroupRepository.GetByIdAsync(id);
            if (group != null) groups.Add(group);
        }

        if (groups.Count == 0) return;
        await ProcessCheckSimilarityForGroups(groups);
    }

    private async Task ProcessCheckSimilarityForGroups(List<Models.ErrorGroup> groups)
    {
        foreach (var group in groups)
        {
            if (group.SubmissionIds == null || group.SubmissionIds.Count < 2) continue;

            _logger.LogInformation("Starting similarity check for group {GroupId}", group.Id);

            var submissions = new List<Models.Submission>();
            foreach (var sid in group.SubmissionIds)
            {
                var sub = await _submissionRepository.GetByIdAsync(sid);
                if (sub != null) submissions.Add(sub);
            }

            if (submissions.Count < 2) continue;

            group.JPlagStatus = JPlagStatus.RUNNING;
            await _errorGroupRepository.UpdateAsync(group);

            try
            {
                string language = submissions[0].LanguageId;
                var results = await _jplagCommand.RunSimilarityCheckAsync(language, submissions);

                group.JPlagResults = results;
                group.JPlagStatus = JPlagStatus.COMPLETED;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running JPlag for group {GroupId}", group.Id);
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
            .Select(tr => $"{tr.TestcaseId}|{tr.Status}|{(string.IsNullOrEmpty(tr.ActualOutput) ? "NoOutput" : tr.ActualOutput)}")
            .ToList();

        if (failedResults.Count == 0) return string.Empty;
        return string.Join("_", failedResults);
    }
}
