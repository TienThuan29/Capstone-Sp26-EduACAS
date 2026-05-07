using System.Text;
using Hangfire;
using AcasService.Application.Commands.Notification;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.Thirdparty;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;

namespace AcasService.Application.Jobs;

/// <summary>
/// Hangfire background job for processing academic warnings asynchronously.
/// This decouples the slow Gemini analysis and email sending from the API request,
/// allowing the controller to return immediately with 202 Accepted.
/// </summary>
public class AcademicWarningJob
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly IAcademicWarningRepository _academicWarningRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IGeminiClient _geminiClient;
    private readonly IEmailService _emailService;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly IBusinessNotificationService _businessNotificationService;
    private readonly ILogger<AcademicWarningJob> _logger;

    public AcademicWarningJob(
        ISubmissionRepository submissionRepository,
        IExaminationRepository examinationRepository,
        IProblemRepository problemRepository,
        IAcademicWarningRepository academicWarningRepository,
        IClassroomRepository classroomRepository,
        IGeminiClient geminiClient,
        IEmailService emailService,
        UserRequestProducer userRequestProducer,
        IBusinessNotificationService businessNotificationService,
        ILogger<AcademicWarningJob> logger)
    {
        _submissionRepository = submissionRepository;
        _examinationRepository = examinationRepository;
        _problemRepository = problemRepository;
        _academicWarningRepository = academicWarningRepository;
        _classroomRepository = classroomRepository;
        _geminiClient = geminiClient;
        _emailService = emailService;
        _userRequestProducer = userRequestProducer;
        _businessNotificationService = businessNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// Hangfire job entry point: processes all eligible students in a batch.
    /// Runs fully in background with parallel Gemini calls, DB writes, and email sends.
    /// </summary>
    public async Task ProcessBatchAsync(
        string jobId,
        List<EligibleStudentContext> eligibleStudents,
        string examId,
        int warningLevel,
        string classroomId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Academic Warning Job [{JobId}] started: {Count} students, Exam={ExamId}, Level={Level}",
            jobId, eligibleStudents.Count, examId, warningLevel);

        try
        {
            var allProblemIds = eligibleStudents
                .SelectMany(s => s.ProblemSubmissions.Keys)
                .Distinct(StringComparer.Ordinal)
                .ToList();
            var allStudentIds = eligibleStudents.Select(s => s.StudentId).ToList();

            // Parallel: fetch problems + user profiles + exam info
            var problemTask = _problemRepository.GetByIdsAsync(allProblemIds);
            var userProfilesTask = _userRequestProducer.GetUsersByIdsAsync(allStudentIds, cancellationToken);
            var examTask = _examinationRepository.GetByIdAsync(examId);

            await Task.WhenAll(problemTask, userProfilesTask, examTask);

            var problemsById = (await problemTask)
                .Where(p => p != null)
                .ToDictionary(p => p!.Id, StringComparer.Ordinal);
            var userProfileMap = (await userProfilesTask)
                .ToDictionary(u => u.Id, StringComparer.Ordinal);
            var exam = await examTask;

            // Parallel Gemini calls across ALL (student, problem) pairs
            var geminiTasks = new List<Task<(string StudentId, string ProblemId, string Response)>>();
            foreach (var student in eligibleStudents)
            {
                foreach (var (problemId, submission) in student.ProblemSubmissions)
                {
                    var capturedStudentId = student.StudentId;
                    var capturedProblemId = problemId;
                    var capturedSubmission = submission;

                    geminiTasks.Add(Task.Run(async () =>
                    {
                        var problem = problemsById.GetValueOrDefault(capturedProblemId);
                        var prompt = BuildLlmAnalysisPrompt(capturedSubmission, exam, problem, warningLevel);
                        var geminiResponse = await _geminiClient.GenerateContentAsync(prompt, cancellationToken);
                        return (capturedStudentId, capturedProblemId, geminiResponse);
                    }, cancellationToken));
                }
            }

            var geminiResults = await Task.WhenAll(geminiTasks);
            var geminiByStudent = geminiResults
                .GroupBy(r => r.StudentId)
                .ToDictionary(g => g.Key,
                    g => g.ToDictionary(r => r.ProblemId, r => r.Response, StringComparer.Ordinal));

            // Build warnings + update feedback in parallel
            var submissionUpdateTasks = new List<Task>();
            var warningCreateTasks = new List<Task<AcademicWarning?>>();
            var studentResults = new List<StudentAcademicWarningResult>();

            foreach (var student in eligibleStudents)
            {
                var studentGemini = geminiByStudent.GetValueOrDefault(student.StudentId)
                    ?? new Dictionary<string, string>(StringComparer.Ordinal);

                var allAnalysisEntries = studentGemini
                    .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                    .ToDictionary(
                        kv => kv.Key,
                        kv => new AcademicWarningAnalysisEntry
                        {
                            SubmissionId = student.ProblemSubmissions[kv.Key].Id,
                            Analysis = ExtractAnalysisFromResponse(kv.Value),
                            Recomendation = ExtractRecommendationFromResponse(kv.Value)
                        },
                        StringComparer.Ordinal);

                // Update AI feedback
                if (warningLevel == 1 && !string.IsNullOrWhiteSpace(studentGemini.Values.FirstOrDefault()))
                {
                    var combined = string.Join("\n\n---\n\n",
                        studentGemini.Select(kv =>
                            $"## Problem: {problemsById.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

                    foreach (var submission in student.ProblemSubmissions.Values)
                    {
                        submission.AiFeedback = studentGemini.GetValueOrDefault(submission.ProblemId) ?? combined;
                        submission.UpdatedDate = DateTime.UtcNow;
                        submissionUpdateTasks.Add(_submissionRepository.UpdateAsync(submission));
                    }
                }

                var totalScore = student.ProblemSubmissions.Values.Sum(s => s.FinalScore);
                var firstProblemId = student.ProblemSubmissions.Keys.FirstOrDefault() ?? string.Empty;

                var warning = new AcademicWarning
                {
                    Id = student.WarningId ?? Guid.NewGuid().ToString(),
                    ClassroomId = classroomId,
                    StudentId = student.StudentId,
                    ExamId = examId,
                    ProblemId = firstProblemId,
                    WarningLevel = warningLevel,
                    TriggerType = AcademicWarningTriggerType.SINGLE_EXAM_LOW_SCORE,
                    InvolvedExams = new InvolvedExamsInfo
                    {
                        ExamScores = new Dictionary<string, float> { [examId] = totalScore },
                        AverageScore = totalScore
                    },
                    LlmAnalysis = allAnalysisEntries,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };
                warningCreateTasks.Add(_academicWarningRepository.CreateAsync(warning));

                var profile = userProfileMap.GetValueOrDefault(student.StudentId);
                studentResults.Add(new StudentAcademicWarningResult
                {
                    StudentId = student.StudentId,
                    StudentEmail = profile?.Email ?? string.Empty,
                    StudentName = profile?.Fullname ?? student.StudentId,
                    ExamScore = totalScore,
                    WarningCreated = true
                });
            }

            await Task.WhenAll(submissionUpdateTasks);
            var warningResults = await Task.WhenAll(warningCreateTasks);

            // Send emails in parallel
            var emailTasks = new List<Task>();
            for (int i = 0; i < studentResults.Count; i++)
            {
                var result = studentResults[i];
                var warning = warningResults[i];
                if (warning == null) continue;

                var problemSubs = eligibleStudents[i].ProblemSubmissions;
                var studentGemini = geminiByStudent.GetValueOrDefault(result.StudentId)
                    ?? new Dictionary<string, string>(StringComparer.Ordinal);
                var combined = string.Join("\n\n---\n\n",
                    studentGemini.Select(kv =>
                        $"## Problem: {problemsById.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

                var emailBody = BuildAcademicWarningEmailHtml(
                    result.StudentName,
                    exam?.ExamName ?? examId,
                    problemSubs.Values.Select(s => s.FinalScore).ToList(),
                    warningLevel,
                    combined,
                    problemsById.ToDictionary(kv => kv.Key, kv => (Problem?)kv.Value),
                    problemSubs);

                emailTasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendEmailAsync(
                            result.StudentEmail,
                            $"[EduACAS] Academic Warning - Level {warningLevel}",
                            emailBody,
                            cancellationToken);
                        result.EmailSent = true;
                        _logger.LogInformation(
                            "Email sent for job [{JobId}]: Student={StudentId}, Exam={ExamId}",
                            jobId, result.StudentId, examId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Email failed for student {StudentId} in job [{JobId}]",
                            result.StudentId, jobId);
                        result.ErrorMessage = ex.Message;
                    }
                }, cancellationToken));
            }

            await Task.WhenAll(emailTasks);

            // Level 2 auto-check
            if (warningLevel == 1 && !string.IsNullOrWhiteSpace(classroomId))
            {
                var level2Tasks = studentResults
                    .Select(r => CheckAndSendLevel2Async(r.StudentId, classroomId, examId, cancellationToken))
                    .ToList();
                await Task.WhenAll(level2Tasks);
            }

            // Send job completion notification to the lecturer
            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (classroom != null && !string.IsNullOrWhiteSpace(classroom.LecturerId))
            {
                var emailedCount = studentResults.Count(r => r.EmailSent);
                var totalCount = studentResults.Count;
                var examName = exam?.ExamName ?? examId;
                var title = $"Academic Warning Job Completed - {examName}";
                var body = emailedCount == totalCount
                    ? $"All {totalCount} academic warning email(s) for {examName} have been sent successfully."
                    : $"{emailedCount}/{totalCount} academic warning email(s) for {examName} were sent. Some may have failed.";

                await _businessNotificationService.NotifySingleUserAsync(
                    classroom.LecturerId,
                    NotificationType.ACADEMIC_WARNING_JOB_COMPLETED,
                    title,
                    body,
                    new Dictionary<string, object?>
                    {
                        ["jobId"] = jobId,
                        ["examId"] = examId,
                        ["examName"] = examName,
                        ["classroomId"] = classroomId,
                        ["totalProcessed"] = totalCount,
                        ["emailsSent"] = emailedCount,
                        ["warningLevel"] = warningLevel
                    });
            }

            _logger.LogInformation(
                "Academic Warning Job [{JobId}] completed: {Processed}/{Total} students emailed",
                jobId,
                studentResults.Count(r => r.EmailSent),
                studentResults.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Academic Warning Job [{JobId}] failed: Exam={ExamId}, Level={Level}",
                jobId, examId, warningLevel);
            throw;
        }
    }

    /// <summary>
    /// Processes a single student's academic warning in the background.
    /// </summary>
    public async Task ProcessSingleAsync(
        string jobId,
        string studentId,
        string examId,
        int warningLevel,
        string classroomId,
        List<(string ProblemId, Submission Submission)> problemSubmissions,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Academic Warning Job [{JobId}] single started: Student={StudentId}, Exam={ExamId}, Level={Level}",
            jobId, studentId, examId, warningLevel);

        try
        {
            var problemIds = problemSubmissions.Select(p => p.ProblemId).ToList();
            var submissions = problemSubmissions.ToDictionary(p => p.ProblemId, p => p.Submission);

            var problemTask = _problemRepository.GetByIdsAsync(problemIds);
            var userProfileTask = _userRequestProducer.GetUsersByIdsAsync(new List<string> { studentId }, cancellationToken);
            var examTask = _examinationRepository.GetByIdAsync(examId);

            await Task.WhenAll(problemTask, userProfileTask, examTask);

            var problemsById = (await problemTask)
                .Where(p => p != null)
                .ToDictionary(p => p!.Id, StringComparer.Ordinal);
            var profile = (await userProfileTask).FirstOrDefault();
            var exam = await examTask;

            // Parallel Gemini calls
            var geminiTasks = problemSubmissions.Select(ps =>
            {
                var problem = problemsById.GetValueOrDefault(ps.ProblemId);
                var prompt = BuildLlmAnalysisPrompt(ps.Submission, exam, problem, warningLevel);
                return _geminiClient.GenerateContentAsync(prompt, cancellationToken)
                    .ContinueWith(t => (ps.ProblemId, Response: t.Result));
            }).ToList();

            await Task.WhenAll(geminiTasks);

            var geminiByProblem = geminiTasks.ToDictionary(
                t => t.Result.ProblemId,
                t => t.Result.Response,
                StringComparer.Ordinal);

            // Update feedback
            var combined = string.Join("\n\n---\n\n",
                geminiByProblem.Select(kv =>
                    $"## Problem: {problemsById.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

            var updateTasks = problemSubmissions.Select(ps =>
            {
                ps.Submission.AiFeedback = geminiByProblem.GetValueOrDefault(ps.ProblemId) ?? combined;
                ps.Submission.UpdatedDate = DateTime.UtcNow;
                return _submissionRepository.UpdateAsync(ps.Submission);
            }).ToList();
            await Task.WhenAll(updateTasks);

            // Create warning
            var totalScore = submissions.Values.Sum(s => s.FinalScore);
            var firstProblemId = problemSubmissions.FirstOrDefault().ProblemId ?? string.Empty;
            var allAnalysisEntries = geminiByProblem
                .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .ToDictionary(
                    kv => kv.Key,
                    kv => new AcademicWarningAnalysisEntry
                    {
                        SubmissionId = submissions[kv.Key].Id,
                        Analysis = ExtractAnalysisFromResponse(kv.Value),
                        Recomendation = ExtractRecommendationFromResponse(kv.Value)
                    },
                    StringComparer.Ordinal);

            var warning = new AcademicWarning
            {
                Id = Guid.NewGuid().ToString(),
                ClassroomId = classroomId,
                StudentId = studentId,
                ExamId = examId,
                ProblemId = firstProblemId,
                WarningLevel = warningLevel,
                TriggerType = AcademicWarningTriggerType.SINGLE_EXAM_LOW_SCORE,
                InvolvedExams = new InvolvedExamsInfo
                {
                    ExamScores = new Dictionary<string, float> { [examId] = totalScore },
                    AverageScore = totalScore
                },
                LlmAnalysis = allAnalysisEntries,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };
            await _academicWarningRepository.CreateAsync(warning);

            // Send email
            var emailBody = BuildAcademicWarningEmailHtml(
                profile?.Fullname ?? studentId,
                exam?.ExamName ?? examId,
                submissions.Values.Select(s => s.FinalScore).ToList(),
                warningLevel,
                combined,
                problemsById.ToDictionary(kv => kv.Key, kv => (Problem?)kv.Value),
                submissions);

            await _emailService.SendEmailAsync(
                profile?.Email ?? string.Empty,
                $"[EduACAS] Academic Warning - Level {warningLevel}",
                emailBody,
                cancellationToken);

            // Level 2 check
            if (warningLevel == 1 && !string.IsNullOrWhiteSpace(classroomId))
            {
                await CheckAndSendLevel2Async(studentId, classroomId, examId, cancellationToken);
            }

            _logger.LogInformation(
                "Academic Warning Job [{JobId}] single completed: Student={StudentId}, Exam={ExamId}",
                jobId, studentId, examId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Academic Warning Job [{JobId}] single failed: Student={StudentId}",
                jobId, studentId);
            throw;
        }
    }

    /// <summary>
    /// Public Hangfire-compatible wrapper for Level 2 check.
    /// </summary>
    public async Task CheckAndSendLevel2ViaJobAsync(
        string studentId,
        string classroomId,
        string currentExamId,
        CancellationToken cancellationToken = default)
    {
        await CheckAndSendLevel2Async(studentId, classroomId, currentExamId, cancellationToken);
    }

    /// <summary>
    /// Public overload that accepts a Dictionary — avoids tuple expression tree issues in Hangfire Enqueue.
    /// </summary>
    public async Task ProcessSingleFromDictAsync(
        string jobId,
        string studentId,
        string examId,
        int warningLevel,
        string classroomId,
        Dictionary<string, Submission> problemSubmissions,
        CancellationToken cancellationToken = default)
    {
        await ProcessSingleAsync(
            jobId,
            studentId,
            examId,
            warningLevel,
            classroomId,
            problemSubmissions.Select(kv => (kv.Key, kv.Value)).ToList(),
            cancellationToken);
    }

    private async Task CheckAndSendLevel2Async(
        string studentId,
        string classroomId,
        string currentExamId,
        CancellationToken cancellationToken)
    {
        try
        {
            var classroom = await _classroomRepository.FindByIdAsync(classroomId);
            if (classroom == null) return;

            var settings = classroom.GradingSettings;
            if (settings == null || settings.MinExamCount <= 0 || settings.AvgScoreThreshold <= 0) return;

            var existingWarnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);
            if (existingWarnings.Any(w => w.ClassroomId == classroomId && w.WarningLevel == 2)) return;

            var allSubmissions = await _submissionRepository.GetByStudentIdAsync(studentId);
            var graded = allSubmissions
                .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
                .ToList();

            var classroomExams = await _examinationRepository.GetByClassIdAsync(classroomId);
            var classroomExamIds = classroomExams.Select(e => e.Id).ToHashSet(StringComparer.Ordinal);
            var relevant = graded.Where(s => classroomExamIds.Contains(s.ExamId)).ToList();

            if (relevant.Count < settings.MinExamCount) return;

            var avg = relevant.Average(s => s.FinalScore);
            if (avg >= settings.AvgScoreThreshold) return;

            // Trigger Level 2 by calling ProcessSingleAsync recursively
            var level2Submissions = relevant
                .GroupBy(s => s.ProblemId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.Version).First());

            await ProcessSingleAsync(
                $"level2-{Guid.NewGuid():N}",
                studentId,
                currentExamId,
                2,
                classroomId,
                level2Submissions.Select(kv => (kv.Key, kv.Value)).ToList(),
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Level 2 check failed for student {StudentId}", studentId);
        }
    }

    private string BuildLlmAnalysisPrompt(
        Submission submission,
        Examination? exam,
        Problem? problem,
        int warningLevel)
    {
        var sb = new StringBuilder();
        if (warningLevel == 1)
        {
            sb.AppendLine("You are a supportive AI teaching assistant focused on explaining specific mistakes in the student's programming submission.");
            sb.AppendLine("Analyze the errors and provide clear, detailed explanations so the student can understand and fix their mistakes.");
        }
        else
        {
            sb.AppendLine("You are a supportive AI teaching assistant providing learning guidance when a student's average score drops to a concerning level.");
            sb.AppendLine("Based on the exam problems and the student's performance, suggest knowledge areas to review and effective study strategies.");
        }

        sb.AppendLine();
        sb.AppendLine("=== EXAM INFORMATION ===");
        if (exam != null)
        {
            sb.AppendLine($"Exam Name: {exam.ExamName}");
            sb.AppendLine($"Description: {exam.Description}");
        }
        sb.AppendLine($"Student Score: {submission.FinalScore}");

        sb.AppendLine();
        sb.AppendLine("=== PROBLEM STATEMENT ===");
        sb.AppendLine(problem?.Content ?? "(No problem content available)");

        sb.AppendLine();
        sb.AppendLine("=== TESTCASES ===");
        if (submission.TestResults.Count > 0)
        {
            foreach (var tc in submission.TestResults)
            {
                sb.AppendLine($"- Testcase: {tc.TestcaseId}");
                sb.AppendLine($"  Status: {tc.Status}");
                sb.AppendLine($"  Input: {tc.Input}");
                sb.AppendLine($"  Expected Output: {tc.ExpectedOutput}");
                sb.AppendLine($"  Actual Output: {tc.ActualOutput}");
                if (tc.Status != Models.TestcaseStatus.SUCCESS)
                    sb.AppendLine($"  Time: {tc.ExecutionTimeMs}ms");
                sb.AppendLine();
            }
        }
        else
        {
            sb.AppendLine("(No test case results available)");
        }

        sb.AppendLine();
        sb.AppendLine("=== STUDENT'S SOLUTION ===");
        sb.AppendLine(submission.Source ?? "(No source code provided)");

        sb.AppendLine();
        sb.AppendLine("=== OUTPUT REQUIREMENTS ===");
        if (warningLevel == 1)
        {
            sb.AppendLine("1. Explain each mistake the student made in detail.");
            sb.AppendLine("2. Identify the root cause of each error where possible.");
            sb.AppendLine("3. Suggest specific fixes with code examples.");
            sb.AppendLine("4. Provide additional practice problems if relevant.");
        }
        else
        {
            sb.AppendLine("1. Summarize the key mistakes and knowledge gaps.");
            sb.AppendLine("2. Identify specific topics the student should review.");
            sb.AppendLine("3. Recommend study resources and practice strategies.");
            sb.AppendLine("4. Suggest targeted exercises to improve.");
        }

        sb.AppendLine();
        sb.AppendLine("Respond in English using Markdown format.");
        return sb.ToString();
    }

    private string ExtractAnalysisFromResponse(string response)
    {
        var lines = response.Split('\n');
        var analysisLines = new List<string>();
        bool inSection = false;
        foreach (var line in lines)
        {
            if (line.Contains("analysis", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("mistake", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("error", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("explanation", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("issue", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("summary", StringComparison.OrdinalIgnoreCase))
                inSection = true;
            if (inSection)
            {
                analysisLines.Add(line);
                if (analysisLines.Count > 30) break;
            }
        }
        return string.Join("\n", analysisLines.Take(30)).Trim();
    }

    private string ExtractRecommendationFromResponse(string response)
    {
        var lines = response.Split('\n');
        var recLines = new List<string>();
        bool inSection = false;
        var markers = new[] { "recommend", "suggest", "should review", "study", "practice",
            "topics to review", "resources", "exercises", "next steps", "improve", "focus on" };
        foreach (var line in lines)
        {
            if (markers.Any(m => line.Contains(m, StringComparison.OrdinalIgnoreCase)))
                inSection = true;
            if (inSection)
                recLines.Add(line);
        }
        return string.Join("\n", recLines.Take(30)).Trim();
    }

    private string BuildAcademicWarningEmailHtml(
        string studentName, string examName, List<float> scores,
        int warningLevel, string llmAnalysis,
        Dictionary<string, Problem?> problems,
        Dictionary<string, Submission> allProblemSubmissions)
    {
        var levelTitle = warningLevel == 1
            ? "Reminder: Specific Mistakes Identified"
            : "Academic Warning: Performance Concern";
        var levelColor = warningLevel == 1 ? "#FF9800" : "#F44336";
        var levelIcon = warningLevel == 1 ? "&#9888;" : "&#128546;";
        var totalScore = scores.Count > 0 ? scores.Sum() : 0f;

        var escapedAnalysis = string.IsNullOrWhiteSpace(llmAnalysis)
            ? "<p><em>No specific analysis available.</em></p>"
            : $"<div style=\"background:#f5f5f5;padding:15px;border-radius:8px;white-space:pre-wrap;font-family:monospace;font-size:13px;max-height:400px;overflow-y:auto;\">{System.Net.WebUtility.HtmlEncode(llmAnalysis)}</div>";

        var problemRows = string.Join("", allProblemSubmissions.Select(kv =>
        {
            var problem = problems.GetValueOrDefault(kv.Key);
            var title = System.Net.WebUtility.HtmlEncode(problem?.Title ?? $"Problem {kv.Key}");
            var score = kv.Value.FinalScore;
            var barWidth = Math.Max(0, Math.Min(100, score));
            var barColor = score < 50 ? "#F44336" : score < 70 ? "#FF9800" : "#4CAF50";
            return $@"<tr>
                <td style=""padding:10px;border-bottom:1px solid #eee;font-size:14px;color:#333;"">{title}</td>
                <td style=""padding:10px;border-bottom:1px solid #eee;text-align:center;"">
                    <span style=""font-weight:bold;color:#1976D2;font-size:15px;"">{score:F1}</span>
                </td>
                <td style=""padding:10px;border-bottom:1px solid #eee;width:120px;"">
                    <div style=""background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;"">
                        <div style=""width:{barWidth}%;background:{barColor};height:8px;border-radius:4px;""></div>
                    </div>
                </td>
            </tr>";
        }));

        var problemTable = $@"<table style=""width:100%;border-collapse:collapse;margin-bottom:20px;"">
            <thead><tr style=""background:#f5f5f5;"">
                <th style=""padding:10px;text-align:left;font-size:13px;color:#666;"">Problem</th>
                <th style=""padding:10px;text-align:center;font-size:13px;color:#666;"">Score</th>
                <th style=""padding:10px;text-align:center;font-size:13px;color:#666;"">Progress</th>
            </tr></thead>
            <tbody>{problemRows}</tbody>
        </table>";

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1.0"">
<title>Academic Warning - EduACAS</title></head>
<body style=""margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;"">
    <div style=""max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);"">
        <div style=""background:linear-gradient(135deg,#1976D2,#2196F3);padding:30px;text-align:center;"">
            <h1 style=""color:#ffffff;margin:0;font-size:24px;"">&#127891; EduACAS</h1>
            <p style=""color:#e3f2fd;margin:8px 0 0;font-size:14px;"">Examination Management System</p>
        </div>
        <div style=""padding:30px;"">
            <div style=""background:{levelColor}11;border-left:4px solid {levelColor};padding:15px;border-radius:6px;margin-bottom:25px;"">
                <div style=""font-size:36px;margin-bottom:8px;"">{levelIcon}</div>
                <h2 style=""color:{levelColor};margin:0;font-size:18px;"">Academic Warning - Level {warningLevel}</h2>
                <p style=""color:#666;margin:5px 0 0;font-size:13px;"">{levelTitle}</p>
            </div>
            <p style=""font-size:15px;line-height:1.6;color:#333;"">
                Dear <strong>{System.Net.WebUtility.HtmlEncode(studentName)}</strong>,
            </p>
            <p style=""font-size:15px;line-height:1.6;color:#333;"">
                Based on your recent performance in the exam <strong>""{System.Net.WebUtility.HtmlEncode(examName)}""</strong>,
                we noticed that your results require attention:
            </p>
            {problemTable}
            <div style=""background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:20px 0;"">
                <p style=""margin:0;font-size:13px;color:#666;"">Total Score</p>
                <p style=""margin:5px 0 0;font-size:40px;font-weight:bold;color:#1976D2;"">{totalScore:F1}</p>
            </div>
            <h3 style=""color:#333;font-size:16px;border-bottom:2px solid #1976D2;padding-bottom:8px;"">&#128161; AI-Powered Analysis &amp; Recommendations</h3>
            {escapedAnalysis}
            <div style=""margin-top:30px;padding:15px;background:#e3f2fd;border-radius:8px;"">
                <h4 style=""margin:0 0 10px;color:#1565C0;font-size:14px;"">&#128194; Recommended Actions</h4>
                <ul style=""margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.8;"">
                    <li>Review the mistakes and study the recommended topics above</li>
                    <li>Contact your lecturer if you need additional support</li>
                    <li>Visit <a href=""#"" style=""color:#1976D2;"">EduACAS</a> to view detailed results</li>
                </ul>
            </div>
            <p style=""font-size:13px;color:#999;margin-top:30px;text-align:center;"">
                This email was automatically generated by the EduACAS system.<br>Please do not reply directly to this message.
            </p>
        </div>
        <div style=""background:#f4f4f4;padding:15px;text-align:center;border-top:1px solid #e0e0e0;"">
            <p style=""margin:0;font-size:12px;color:#999;"">&copy; {DateTime.UtcNow.Year} EduACAS - Examination Management System</p>
        </div>
    </div>
</body>
</html>";
    }
}

/// <summary>
/// Context for a single eligible student passed to the background job.
/// Holds all information needed to process the student without DB calls in the job.
/// </summary>
public class EligibleStudentContext
{
    public string StudentId { get; set; } = string.Empty;
    public string? WarningId { get; set; }
    public Dictionary<string, Submission> ProblemSubmissions { get; set; } = new();
}
