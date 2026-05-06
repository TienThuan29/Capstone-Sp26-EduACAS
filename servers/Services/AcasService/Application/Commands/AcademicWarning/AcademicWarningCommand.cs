using System.Text;
using Hangfire;
using AcasService.Application.Jobs;
using AcasService.Application.Thirdparty;
using AcasService.Messaging.User;
using AcasService.Models;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;

namespace AcasService.Application.Commands.Examination;

public interface IAcademicWarningCommand
{
    Task<SendAcademicWarningResponse> SendBatchAcademicWarningsAsync(
        SendAcademicWarningBatchRequest request,
        CancellationToken cancellationToken = default);

    Task<SendAcademicWarningResponse> SendSingleAcademicWarningAsync(
        string studentId,
        SendAcademicWarningRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// V3: Fast-path version that immediately saves student contexts to DB and enqueues
    /// background processing for Gemini analysis + email sending. Returns instantly so the
    /// lecturer UI is never blocked by slow LLM calls.
    /// </summary>
    Task<string> SendBatchAcademicWarningsAsync_V3(
        SendAcademicWarningBatchRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// V3: Fast-path version for a single student that immediately saves to DB and
    /// enqueues background processing for Gemini analysis + email sending.
    /// </summary>
    Task<string> SendSingleAcademicWarningAsync_V3(
        string studentId,
        SendAcademicWarningRequest request,
        CancellationToken cancellationToken = default);
}

public class AcademicWarningCommand : IAcademicWarningCommand
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IExaminationRepository _examinationRepository;
    private readonly IProblemRepository _problemRepository;
    private readonly IClassroomEnrollmentRepository _classroomEnrollmentRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IAcademicWarningRepository _academicWarningRepository;
    private readonly IGeminiClient _geminiClient;
    private readonly IEmailService _emailService;
    private readonly UserRequestProducer _userRequestProducer;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<AcademicWarningCommand> _logger;

    public AcademicWarningCommand(
        ISubmissionRepository submissionRepository,
        IExaminationRepository examinationRepository,
        IProblemRepository problemRepository,
        IClassroomEnrollmentRepository classroomEnrollmentRepository,
        IAcademicWarningRepository academicWarningRepository,
        IClassroomRepository classroomRepository,
        IGeminiClient geminiClient,
        IEmailService emailService,
        UserRequestProducer userRequestProducer,
        IBackgroundJobClient backgroundJobClient,
        ILogger<AcademicWarningCommand> logger)
    {
        _submissionRepository = submissionRepository;
        _examinationRepository = examinationRepository;
        _problemRepository = problemRepository;
        _classroomEnrollmentRepository = classroomEnrollmentRepository;
        _academicWarningRepository = academicWarningRepository;
        _classroomRepository = classroomRepository;
        _geminiClient = geminiClient;
        _emailService = emailService;
        _userRequestProducer = userRequestProducer;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    /// <summary>
    /// Sends academic warnings to all eligible students in a classroom whose latest submission
    /// score falls below the configured threshold. Uses Gemini to generate per-student analysis.
    /// </summary>
    /// <remarks>
    /// Only considers submissions that are already GRADED or REGRADED to ensure meaningful
    /// analysis. Students without any graded submission in the exam are skipped.
    /// Gemini is called once per eligible student — consider adding batching for large classrooms.
    /// </remarks>
    public async Task<SendAcademicWarningResponse> SendBatchAcademicWarningsAsync(
        SendAcademicWarningBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = new SendAcademicWarningResponse();

        // Step 1: Lấy danh sách sinh viên đang tham gia lớp
        var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(request.ClassroomId);
        if (enrollments == null || enrollments.Count == 0)
        {
            _logger.LogWarning("No enrollments found for classroom {ClassroomId}", request.ClassroomId);
            return response;
        }

        var studentIds = enrollments
            .Where(e => e.IsJoining && !string.IsNullOrWhiteSpace(e.StudentId))
            .Select(e => e.StudentId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        // Step 2: Lấy tất cả submissions của exam này từ tất cả sinh viên
        var submissions = await _submissionRepository.GetByExamIdsAsync(new List<string> { request.ExamId });

        // Step 3: Nhóm theo sinh viên, lấy submission mới nhất (version cao nhất) của MỖI PROBLEM
        var latestSubmissionsByStudent = submissions
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.StudentId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .GroupBy(s => s.ProblemId)
                    .ToDictionary(
                        pg => pg.Key,
                        pg => pg.OrderByDescending(s => s.Version).First()
                    )
            );

        // Step 4: Lọc sinh viên có ít nhất 1 bài dưới ngưỡng
        var eligibleStudents = latestSubmissionsByStudent
            .Where(kv => kv.Value.Values.Any(s => s.FinalScore < request.MinScoreThreshold))
            .ToList();

        response.TotalStudents = eligibleStudents.Count;

        // Step 5: Xử lý từng sinh viên đủ điều kiện
        foreach (var (studentId, allProblemSubmissions) in eligibleStudents)
        {
            var result = await ProcessStudentAcademicWarningAsync(
                studentId,
                allProblemSubmissions,
                request.ExamId,
                request.WarningLevel,
                request.ClassroomId,
                cancellationToken);

            response.Results.Add(result);
            if (result.WarningCreated || result.EmailSent)
                response.ProcessedStudents++;
            else
                response.FailedCount++;
        }

        return response;
    }

    /// <summary>
    /// Sends an academic warning to a single student. The student must have at least one
    /// GRADED or REGRADED submission in the target exam, otherwise the operation is a no-op.
    /// </summary>
    public async Task<SendAcademicWarningResponse> SendSingleAcademicWarningAsync(
        string studentId,
        SendAcademicWarningRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = new SendAcademicWarningResponse();

        // Step 2: Lấy tất cả submissions của sinh viên này trong exam, chỉ xét đã chấm (GRADED/REGRADED)
        var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
        var examSubmissions = submissions
            .Where(s => s.ExamId == request.ExamId)
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.ProblemId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => s.Version).First()
            );

        if (examSubmissions.Count == 0)
        {
            _logger.LogWarning(
                "No graded submission found for student {StudentId} in exam {ExamId}",
                studentId, request.ExamId);
            response.TotalStudents = 1;
            response.FailedCount = 1;
            response.Results.Add(new StudentAcademicWarningResult
            {
                StudentId = studentId,
                ErrorMessage = "No graded submission found for this exam"
            });
            return response;
        }

        var exam = await _examinationRepository.GetByIdAsync(request.ExamId);
        var studentResult = await ProcessStudentAcademicWarningAsync(
            studentId,
            examSubmissions,
            request.ExamId,
            request.WarningLevel,
            exam?.ClassroomId ?? string.Empty,
            cancellationToken);

        response.Results.Add(studentResult);
        response.TotalStudents = 1;
        if (studentResult.WarningCreated || studentResult.EmailSent)
            response.ProcessedStudents = 1;
        else
            response.FailedCount = 1;

        return response;
    }

    /// <summary>
    /// V2: Sends academic warnings to all eligible students in a classroom using parallel processing.
    /// All Gemini calls, user profile fetches, DB operations, and emails run concurrently
    /// for maximum throughput on large classrooms.
    /// </summary>
    public async Task<SendAcademicWarningResponse> SendBatchAcademicWarningsAsync_V2(
        SendAcademicWarningBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = new SendAcademicWarningResponse();

        var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(request.ClassroomId);
        if (enrollments == null || enrollments.Count == 0)
        {
            _logger.LogWarning("No enrollments found for classroom {ClassroomId}", request.ClassroomId);
            return response;
        }

        var studentIds = enrollments
            .Where(e => e.IsJoining && !string.IsNullOrWhiteSpace(e.StudentId))
            .Select(e => e.StudentId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var submissions = await _submissionRepository.GetByExamIdsAsync(new List<string> { request.ExamId });

        var latestSubmissionsByStudent = submissions
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.StudentId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .GroupBy(s => s.ProblemId)
                    .ToDictionary(
                        pg => pg.Key,
                        pg => pg.OrderByDescending(s => s.Version).First()
                    )
            );

        var eligibleStudents = latestSubmissionsByStudent
            .Where(kv => kv.Value.Values.Any(s => s.FinalScore < request.MinScoreThreshold))
            .ToList();

        response.TotalStudents = eligibleStudents.Count;

        var results = await ProcessBatchStudentsAsync_V2(
            eligibleStudents,
            request.ExamId,
            request.WarningLevel,
            request.ClassroomId,
            cancellationToken);

        foreach (var result in results)
        {
            response.Results.Add(result);
            if (result.WarningCreated || result.EmailSent)
                response.ProcessedStudents++;
            else
                response.FailedCount++;
        }

        return response;
    }

    /// <summary>
    /// V2: Sends an academic warning to a single student using parallel operations.
    /// </summary>
    public async Task<SendAcademicWarningResponse> SendSingleAcademicWarningAsync_V2(
        string studentId,
        SendAcademicWarningRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = new SendAcademicWarningResponse();

        var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
        var examSubmissions = submissions
            .Where(s => s.ExamId == request.ExamId)
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.ProblemId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => s.Version).First()
            );

        if (examSubmissions.Count == 0)
        {
            _logger.LogWarning(
                "No graded submission found for student {StudentId} in exam {ExamId}",
                studentId, request.ExamId);
            response.TotalStudents = 1;
            response.FailedCount = 1;
            response.Results.Add(new StudentAcademicWarningResult
            {
                StudentId = studentId,
                ErrorMessage = "No graded submission found for this exam"
            });
            return response;
        }

        var exam = await _examinationRepository.GetByIdAsync(request.ExamId);
        var results = await ProcessBatchStudentsAsync_V2(
            new List<KeyValuePair<string, Dictionary<string, Models.Submission>>>
            {
                new(studentId, examSubmissions)
            },
            request.ExamId,
            request.WarningLevel,
            exam?.ClassroomId ?? string.Empty,
            cancellationToken);

        response.Results.Add(results.FirstOrDefault() ?? new StudentAcademicWarningResult { StudentId = studentId });
        response.TotalStudents = 1;
        if (response.Results[0].WarningCreated || response.Results[0].EmailSent)
            response.ProcessedStudents = 1;
        else
            response.FailedCount = 1;

        return response;
    }

    /// <summary>
    /// V2: Processes multiple students concurrently. All heavy I/O operations are parallelized:
    /// - User profile fetching (batch via RabbitMQ)
    /// - Problem metadata loading (batch DB call)
    /// - Gemini analysis per problem (fully parallel per student, then across students)
    /// - Submission feedback updates (parallel writes)
    /// - AcademicWarning record creation (parallel writes)
    /// - Email sending (parallel sends)
    /// </summary>
    private async Task<List<StudentAcademicWarningResult>> ProcessBatchStudentsAsync_V2(
        List<KeyValuePair<string, Dictionary<string, Models.Submission>>> eligibleStudents,
        string examId,
        int warningLevel,
        string classroomId,
        CancellationToken cancellationToken)
    {
        // Fetch all unique problem IDs across all students
        var allProblemIds = eligibleStudents
            .SelectMany(kv => kv.Value.Keys)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var allStudentIds = eligibleStudents.Select(kv => kv.Key).ToList();

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

        // Step 1: Parallel Gemini calls across ALL (student, problem) pairs
        var allStudentGeminiTasks = new List<Task<(string StudentId, string ProblemId, string Response)>>();

        foreach (var (studentId, problemSubmissions) in eligibleStudents)
        {
            foreach (var (problemId, submission) in problemSubmissions)
            {
                var capturedStudentId = studentId;
                var capturedProblemId = problemId;
                var capturedSubmission = submission;

                allStudentGeminiTasks.Add(
                    Task.Run(async () =>
                    {
                        var problem = problemsById.GetValueOrDefault(capturedProblemId);
                        var prompt = BuildLlmAnalysisPrompt(capturedSubmission, exam, problem, warningLevel);
                        var geminiResponse = await _geminiClient.GenerateContentAsync(prompt, cancellationToken);
                        return (capturedStudentId, capturedProblemId, geminiResponse);
                    }, cancellationToken)
                );
            }
        }

        var geminiResults = await Task.WhenAll(allStudentGeminiTasks);

        // Group Gemini results by student
        var geminiByStudent = geminiResults
            .GroupBy(r => r.StudentId)
            .ToDictionary(g => g.Key, g => g.ToDictionary(r => r.ProblemId, r => r.Response, StringComparer.Ordinal));

        // Step 2: Build combined feedback and create AcademicWarning records in parallel
        var submissionUpdateTasks = new List<Task>();
        var warningCreateTasks = new List<Task<AcademicWarning?>>();
        var studentResults = new List<StudentAcademicWarningResult>();

        foreach (var (studentId, problemSubmissions) in eligibleStudents)
        {
            var studentGemini = geminiByStudent.GetValueOrDefault(studentId) ?? new Dictionary<string, string>(StringComparer.Ordinal);

            var combinedLlmResponse = string.Join("\n\n---\n\n",
                studentGemini.Select(kv =>
                    $"## Problem: {problemsById.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

            var allAnalysisEntries = studentGemini
                .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .ToDictionary(
                    kv => kv.Key,
                    kv => new AcademicWarningAnalysisEntry
                    {
                        SubmissionId = problemSubmissions[kv.Key].Id,
                        Analysis = ExtractAnalysisFromResponse(kv.Value),
                        Recomendation = ExtractRecommendationFromResponse(kv.Value)
                    },
                    StringComparer.Ordinal
                );

            // Parallel: update submissions feedback
            if (warningLevel == 1 && !string.IsNullOrWhiteSpace(combinedLlmResponse))
            {
                foreach (var submission in problemSubmissions.Values)
                {
                    var individualFeedback = studentGemini.GetValueOrDefault(submission.ProblemId) ?? combinedLlmResponse;
                    submission.AiFeedback = individualFeedback;
                    submission.UpdatedDate = DateTime.UtcNow;
                    submissionUpdateTasks.Add(
                        _submissionRepository.UpdateAsync(submission)
                    );
                }
            }

            var totalScore = problemSubmissions.Values.Sum(s => s.FinalScore);
            var firstProblemId = problemSubmissions.Keys.FirstOrDefault() ?? string.Empty;
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
            warningCreateTasks.Add(_academicWarningRepository.CreateAsync(warning));

            var profile = userProfileMap.GetValueOrDefault(studentId);
            studentResults.Add(new StudentAcademicWarningResult
            {
                StudentId = studentId,
                StudentEmail = profile?.Email ?? string.Empty,
                StudentName = profile?.Fullname ?? studentId,
                ExamScore = totalScore
            });
        }

        await Task.WhenAll(submissionUpdateTasks);
        var warningResults = await Task.WhenAll(warningCreateTasks);

        // Step 3: Send emails in parallel
        var emailTasks = new List<Task>();
        for (int i = 0; i < studentResults.Count; i++)
        {
            var result = studentResults[i];
            var warning = warningResults[i];
            var problemSubmissions = eligibleStudents[i].Value;
            var studentGemini = geminiByStudent.GetValueOrDefault(result.StudentId) ?? new Dictionary<string, string>(StringComparer.Ordinal);
            var combinedLlmResponse = string.Join("\n\n---\n\n",
                studentGemini.Select(kv =>
                    $"## Problem: {problemsById.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

            var emailBody = BuildAcademicWarningEmailHtml(
                result.StudentName,
                exam?.ExamName ?? examId,
                problemSubmissions.Values.Select(s => s.FinalScore).ToList(),
                warningLevel,
                combinedLlmResponse,
                problemsById.ToDictionary(kv => kv.Key, kv => (Models.Problem?)kv.Value),
                problemSubmissions);

            var capturedResult = result;
            emailTasks.Add(
                Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendEmailAsync(
                            capturedResult.StudentEmail,
                            $"[EduACAS] Academic Warning - Level {warningLevel}",
                            emailBody,
                            cancellationToken);

                        capturedResult.EmailSent = true;

                        _logger.LogInformation(
                            "Academic warning sent V2: Student={StudentId}, Exam={ExamId}, TotalScore={TotalScore:F1}, Level={Level}",
                            capturedResult.StudentId, examId,
                            problemSubmissions.Values.Sum(s => s.FinalScore), warningLevel);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Error sending email for student {StudentId} in exam {ExamId}",
                            capturedResult.StudentId, examId);
                        capturedResult.ErrorMessage = ex.Message;
                    }
                }, cancellationToken)
            );
        }

        await Task.WhenAll(emailTasks);

        // Mark warnings as created
        for (int i = 0; i < studentResults.Count; i++)
        {
            if (warningResults[i] != null)
                studentResults[i].WarningCreated = true;
        }

        // Step 4: Level 2 auto-check for Level 1 warnings — enqueued as background job
        if (warningLevel == 1 && !string.IsNullOrWhiteSpace(classroomId))
        {
            foreach (var result in studentResults)
            {
                _backgroundJobClient.Enqueue<AcademicWarningJob>(job =>
                    job.CheckAndSendLevel2ViaJobAsync(result.StudentId, classroomId, examId, CancellationToken.None));
            }
        }

        return studentResults;
    }

    /// <summary>
    /// Core per-student processing: fetches user profile, calls Gemini for analysis for EACH problem,
    /// persists an AcademicWarning record with all problem analyses, then sends a styled HTML email.
    /// Each step is wrapped in a single try-catch so a failure for one student
    /// does not abort the batch for others.
    /// </summary>
    private async Task<StudentAcademicWarningResult> ProcessStudentAcademicWarningAsync(
        string studentId,
        Dictionary<string, Models.Submission> allProblemSubmissions,
        string examId,
        int warningLevel,
        string classroomId,
        CancellationToken cancellationToken)
    {
        var result = new StudentAcademicWarningResult
        {
            StudentId = studentId,
            ExamScore = allProblemSubmissions.Values.Sum(s => s.FinalScore)
        };

        try
        {
            // Step 1: Lấy thông tin profile của sinh viên (email, fullname) qua RabbitMQ
            var studentProfile = await _userRequestProducer.GetUserByIdAsync(studentId, cancellationToken);
            result.StudentEmail = studentProfile?.Email ?? string.Empty;
            result.StudentName = studentProfile?.Fullname ?? studentId;

            // Step 2: Lấy thông tin exam
            var exam = await _examinationRepository.GetByIdAsync(examId);

            // Step 3: Lấy problem details cho TẤT CẢ problems mà student đã nộp
            var problemIds = allProblemSubmissions.Keys.ToList();
            var problems = new Dictionary<string, Models.Problem?>();
            foreach (var pid in problemIds)
            {
                problems[pid] = await _problemRepository.GetByIdAsync(pid);
            }

            // Step 4: Gọi Gemini cho TỪNG problem và thu thập kết quả
            var allLlmResponses = new Dictionary<string, string>();
            var allAnalysisEntries = new Dictionary<string, AcademicWarningAnalysisEntry>();

            foreach (var (problemId, submission) in allProblemSubmissions)
            {
                var problem = problems.GetValueOrDefault(problemId);
                var prompt = BuildLlmAnalysisPrompt(submission, exam, problem, warningLevel);
                var llmResponse = await _geminiClient.GenerateContentAsync(prompt, cancellationToken);
                allLlmResponses[problemId] = llmResponse;

                if (!string.IsNullOrWhiteSpace(llmResponse))
                {
                    allAnalysisEntries[problemId] = new AcademicWarningAnalysisEntry
                    {
                        SubmissionId = submission.Id,
                        Analysis = ExtractAnalysisFromResponse(llmResponse),
                        Recomendation = ExtractRecommendationFromResponse(llmResponse)
                    };
                }
            }

            // Step 5: Tổng hợp tất cả Gemini responses thành 1 combined feedback
            var combinedLlmResponse = string.Join("\n\n---\n\n",
                allLlmResponses.Select(kv =>
                    $"## Problem: {problems.GetValueOrDefault(kv.Key)?.Title ?? kv.Key}\n\n{kv.Value}"));

            // Step 6: Cập nhật AiFeedback cho TẤT CẢ submissions
            if (warningLevel == 1 && !string.IsNullOrWhiteSpace(combinedLlmResponse))
            {
                foreach (var submission in allProblemSubmissions.Values)
                {
                    var individualFeedback = allLlmResponses.GetValueOrDefault(submission.ProblemId) ?? combinedLlmResponse;
                    submission.AiFeedback = individualFeedback;
                    submission.UpdatedDate = DateTime.UtcNow;
                    await _submissionRepository.UpdateAsync(submission);
                }
            }

            // Step 7: Tạo AcademicWarning record với analysis cho TẤT CẢ problems
            var firstProblemId = allProblemSubmissions.Keys.FirstOrDefault() ?? string.Empty;
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
                    ExamScores = new Dictionary<string, float> { [examId] = allProblemSubmissions.Values.Sum(s => s.FinalScore) },
                    AverageScore = allProblemSubmissions.Values.Sum(s => s.FinalScore)
                },
                LlmAnalysis = allAnalysisEntries,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            await _academicWarningRepository.CreateAsync(warning);
            result.WarningCreated = true;

            // Step 8: Build email body HTML với tất cả problem analyses
            var emailBody = BuildAcademicWarningEmailHtml(
                result.StudentName,
                exam?.ExamName ?? examId,
                allProblemSubmissions.Values.Select(s => s.FinalScore).ToList(),
                warningLevel,
                combinedLlmResponse,
                problems,
                allProblemSubmissions);

            await _emailService.SendEmailAsync(
                result.StudentEmail,
                $"[EduACAS] Academic Warning - Level {warningLevel}",
                emailBody,
                cancellationToken);

            result.EmailSent = true;

            _logger.LogInformation(
                "Academic warning sent: Student={StudentId}, Exam={ExamId}, Problems={ProblemCount}, TotalScore={TotalScore:F1}, Level={Level}",
                studentId, examId, allProblemSubmissions.Count,
                allProblemSubmissions.Values.Sum(s => s.FinalScore), warningLevel);

            // Step 9: Nếu là Level 1, kiểm tra tự động có cần gửi Level 2 không
            if (warningLevel == 1 && !string.IsNullOrWhiteSpace(classroomId))
            {
                await CheckAndSendLevel2WarningAsync(studentId, classroomId, examId, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing academic warning for student {StudentId} in exam {ExamId}",
                studentId, examId);
            result.ErrorMessage = ex.Message;
        }

        return result;
    }

    /// <summary>
    /// V3: Fast-path that immediately saves eligible students to DB and enqueues
    /// background Hangfire job for Gemini + email processing. Returns job ID instantly.
    /// </summary>
    public async Task<string> SendBatchAcademicWarningsAsync_V3(
        SendAcademicWarningBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var jobId = $"aw-batch-{Guid.NewGuid():N}";

        var enrollments = await _classroomEnrollmentRepository.FindByClassIdAsync(request.ClassroomId);
        if (enrollments == null || enrollments.Count == 0)
        {
            _logger.LogWarning("No enrollments for classroom {ClassroomId}", request.ClassroomId);
            return jobId;
        }

        var studentIds = enrollments
            .Where(e => e.IsJoining && !string.IsNullOrWhiteSpace(e.StudentId))
            .Select(e => e.StudentId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var submissions = await _submissionRepository.GetByExamIdsAsync(new List<string> { request.ExamId });

        var latestSubmissionsByStudent = submissions
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.StudentId)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(s => s.ProblemId)
                      .ToDictionary(pg => pg.Key, pg => pg.OrderByDescending(s => s.Version).First()));

        var eligibleStudents = latestSubmissionsByStudent
            .Where(kv => kv.Value.Values.Any(s => s.FinalScore < request.MinScoreThreshold))
            .Select(kv => new EligibleStudentContext
            {
                StudentId = kv.Key,
                ProblemSubmissions = kv.Value
            })
            .ToList();

        _logger.LogInformation(
            "V3 batch accepted: JobId={JobId}, Classroom={ClassroomId}, Exam={ExamId}, EligibleStudents={Count}",
            jobId, request.ClassroomId, request.ExamId, eligibleStudents.Count);

        _backgroundJobClient.Enqueue<AcademicWarningJob>(job =>
            job.ProcessBatchAsync(jobId, eligibleStudents, request.ExamId, request.WarningLevel, request.ClassroomId, CancellationToken.None));

        return jobId;
    }

    /// <summary>
    /// V3: Fast-path for single student. Saves to DB and enqueues background job.
    /// </summary>
    public async Task<string> SendSingleAcademicWarningAsync_V3(
        string studentId,
        SendAcademicWarningRequest request,
        CancellationToken cancellationToken = default)
    {
        var jobId = $"aw-single-{Guid.NewGuid():N}";

        var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
        var examSubmissions = submissions
            .Where(s => s.ExamId == request.ExamId)
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .GroupBy(s => s.ProblemId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.Version).First());

        if (examSubmissions.Count == 0)
        {
            _logger.LogWarning("No graded submission for student {StudentId} in exam {ExamId}", studentId, request.ExamId);
            return jobId;
        }

        var exam = await _examinationRepository.GetByIdAsync(request.ExamId);
        var classroomId = exam?.ClassroomId ?? string.Empty;

        _logger.LogInformation(
            "V3 single accepted: JobId={JobId}, Student={StudentId}, Exam={ExamId}",
            jobId, studentId, request.ExamId);

        _backgroundJobClient.Enqueue<AcademicWarningJob>(job =>
            job.ProcessSingleFromDictAsync(
                jobId,
                studentId,
                request.ExamId,
                request.WarningLevel,
                classroomId,
                examSubmissions,
                CancellationToken.None));

        return jobId;
    }

    /// <summary>
    /// Checks if a student qualifies for Level 2 warning based on Classroom.GradingSettings
    /// and automatically sends Level 2 warning if conditions are met.
    /// Called automatically after a Level 1 warning is processed.
    /// </summary>
    public async Task<bool> CheckAndSendLevel2WarningAsync(
        string studentId,
        string classroomId,
        string currentExamId,
        CancellationToken cancellationToken = default)
    {
        var classroom = await _classroomRepository.FindByIdAsync(classroomId);
        if (classroom == null)
        {
            _logger.LogWarning(
                "Classroom {ClassroomId} not found for Level 2 check, student {StudentId}",
                classroomId, studentId);
            return false;
        }

        var settings = classroom.GradingSettings;
        if (settings == null || settings.MinExamCount <= 0 || settings.AvgScoreThreshold <= 0)
        {
            _logger.LogDebug(
                "GradingSettings not configured for classroom {ClassroomId}, skipping Level 2 check",
                classroomId);
            return false;
        }

        var existingWarnings = await _academicWarningRepository.FindByStudentIdAsync(studentId);
        bool alreadySentLevel2 = existingWarnings.Any(w =>
            w.ClassroomId == classroomId && w.WarningLevel == 2);
        if (alreadySentLevel2)
        {
            _logger.LogInformation(
                "Level 2 warning already sent for student {StudentId} in classroom {ClassroomId}",
                studentId, classroomId);
            return false;
        }

        var allSubmissions = await _submissionRepository.GetByStudentIdAsync(studentId);
        var gradedSubmissions = allSubmissions
            .Where(s => s.Status == Models.SubmissionStatus.GRADED || s.Status == Models.SubmissionStatus.REGRADED)
            .ToList();

        if (gradedSubmissions.Count < settings.MinExamCount)
        {
            _logger.LogDebug(
                "Student {StudentId} has {Count} graded submissions, requires {Required} for Level 2. Skipping.",
                studentId, gradedSubmissions.Count, settings.MinExamCount);
            return false;
        }

        var classroomExams = await _examinationRepository.GetByClassIdAsync(classroomId);
        var classroomExamIds = classroomExams.Select(e => e.Id).ToHashSet(StringComparer.Ordinal);
        var relevantSubmissions = gradedSubmissions
            .Where(s => classroomExamIds.Contains(s.ExamId))
            .ToList();

        if (relevantSubmissions.Count < settings.MinExamCount)
        {
            _logger.LogDebug(
                "Student {StudentId} has only {Count} graded submissions in classroom {ClassroomId}, requires {Required}",
                studentId, relevantSubmissions.Count, classroomId, settings.MinExamCount);
            return false;
        }

        var averageScore = relevantSubmissions.Average(s => s.FinalScore);

        if (averageScore >= settings.AvgScoreThreshold)
        {
            _logger.LogDebug(
                "Student {StudentId} average score {Avg:F2} >= threshold {Threshold}. Skipping Level 2.",
                studentId, averageScore, settings.AvgScoreThreshold);
            return false;
        }

        _logger.LogInformation(
            "Student {StudentId} qualifies for Level 2 warning: Avg={Avg:F2}, Threshold={Threshold}, Count={Count}",
            studentId, averageScore, settings.AvgScoreThreshold, relevantSubmissions.Count);

        var level2Request = new SendAcademicWarningRequest
        {
            ExamId = currentExamId,
            WarningLevel = 2
        };

        await SendSingleAcademicWarningAsync_V3(studentId, level2Request, cancellationToken);
        return true;
    }

    /// <summary>
    /// Builds an English prompt for Gemini tailored to the warning level.
    /// Level 1 focuses on explaining specific mistakes; Level 2 provides
    /// learning recommendations based on cumulative performance.
    /// </summary>
    /// <param name="submission">The student's latest graded submission</param>
    /// <param name="exam">Exam metadata (name, description)</param>
    /// <param name="problem">Problem statement and testcases</param>
    /// <param name="warningLevel">1 for reminder, 2 for academic warning</param>
    /// <returns>Complete prompt string for Gemini API</returns>
    private string BuildLlmAnalysisPrompt(
        Models.Submission submission,
        Models.Examination? exam,
        Models.Problem? problem,
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
                {
                    sb.AppendLine($"  Time: {tc.ExecutionTimeMs}ms");
                }
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

    /// <summary>
    /// Extracts the analysis section from the Gemini response by detecting
    /// English keywords like "analysis", "mistakes", "errors", "explanation", etc.
    /// </summary>
    /// <param name="response">Raw text response from Gemini</param>
    /// <returns>Extracted analysis text (up to 30 lines)</returns>
    private string ExtractAnalysisFromResponse(string response)
    {
        var lines = response.Split('\n');
        var analysisLines = new List<string>();
        bool inAnalysisSection = false;

        foreach (var line in lines)
        {
            if (line.Contains("analysis", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("mistake", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("error", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("explanation", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("issue", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("summary", StringComparison.OrdinalIgnoreCase))
            {
                inAnalysisSection = true;
            }

            if (inAnalysisSection)
            {
                analysisLines.Add(line);
                if (analysisLines.Count > 30)
                    break;
            }
        }

        return string.Join("\n", analysisLines.Take(30)).Trim();
    }

    /// <summary>
    /// Extracts the recommendation section from the Gemini response by detecting
    /// English keywords like "recommend", "suggest", "review", "study", etc.
    /// Once a marker is found, all subsequent lines are included.
    /// </summary>
    /// <param name="response">Raw text response from Gemini</param>
    /// <returns>Extracted recommendation text (up to 30 lines)</returns>
    private string ExtractRecommendationFromResponse(string response)
    {
        var lines = response.Split('\n');
        var recLines = new List<string>();
        bool inRecSection = false;

        var recMarkers = new[]
        {
            "recommend", "suggest", "should review", "study", "practice",
            "topics to review", "resources", "exercises", "next steps",
            "improve", "focus on"
        };

        foreach (var line in lines)
        {
            if (recMarkers.Any(m => line.Contains(m, StringComparison.OrdinalIgnoreCase)))
            {
                inRecSection = true;
            }

            if (inRecSection)
            {
                recLines.Add(line);
            }
        }

        return string.Join("\n", recLines.Take(30)).Trim();
    }

    /// <summary>
    /// Builds a responsive HTML email in English with the student's name, exam score,
    /// AI-generated analysis, and action steps. All user-provided fields
    /// are HTML-escaped to prevent XSS.
    /// </summary>
    /// <param name="studentName">Student's full name</param>
    /// <param name="examName">Exam title</param>
    /// <param name="score">Student's score</param>
    /// <param name="warningLevel">1 or 2</param>
    /// <param name="llmAnalysis">Raw analysis from Gemini</param>
    /// <returns>HTML email body</returns>
    private string BuildAcademicWarningEmailHtml(
        string studentName,
        string examName,
        List<float> scores,
        int warningLevel,
        string llmAnalysis,
        Dictionary<string, Models.Problem?> problems,
        Dictionary<string, Models.Submission> allProblemSubmissions)
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
            <thead>
                <tr style=""background:#f5f5f5;"">
                    <th style=""padding:10px;text-align:left;font-size:13px;color:#666;"">Problem</th>
                    <th style=""padding:10px;text-align:center;font-size:13px;color:#666;"">Score</th>
                    <th style=""padding:10px;text-align:center;font-size:13px;color:#666;"">Progress</th>
                </tr>
            </thead>
            <tbody>
                {problemRows}
            </tbody>
        </table>";

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Academic Warning - EduACAS</title>
</head>
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
                This email was automatically generated by the EduACAS system.<br>
                Please do not reply directly to this message.
            </p>
        </div>

        <div style=""background:#f4f4f4;padding:15px;text-align:center;border-top:1px solid #e0e0e0;"">
            <p style=""margin:0;font-size:12px;color:#999;"">
                &copy; {DateTime.UtcNow.Year} EduACAS - Examination Management System
            </p>
        </div>
    </div>
</body>
</html>";
    }
}
