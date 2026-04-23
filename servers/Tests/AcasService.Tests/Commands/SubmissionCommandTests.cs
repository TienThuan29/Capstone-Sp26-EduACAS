using AcasService.Application.Commands.Notification;
using AcasService.Application.Commands.Submission;
using AcasService.Application.Mappers;
using AcasService.Application.ResponseDTOs;
using AcasService.Application.ResponseDTOs.External;
using AcasService.Models;
using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.StudentExamSession;
using AcasService.Repositories.Submission;
using AcasService.Web.Requests;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ProblemModel = AcasService.Models.Problem;
using ModelTestCase = AcasService.Models.TestCase;

namespace AcasService.Tests.Commands;

public class SubmissionCommandTests
{
    private readonly Mock<ISubmissionRepository> _mockSubmissionRepo;
    private readonly Mock<ISubmissionCache> _mockSubmissionCache;
    private readonly Mock<IExaminationRepository> _mockExamRepo;
    private readonly Mock<IStudentExamSessionRepository> _mockSessionRepo;
    private readonly Mock<IProblemRepository> _mockProblemRepo;
    private readonly Mock<IBusinessNotificationService> _mockNotificationService;
    private readonly Mock<ILogger<SubmissionCommand>> _mockLogger;
    private readonly FakeSubmissionCache _fakeCache;
    private readonly FakeTestcaseEvaluator _fakeTestcaseEvaluator;
    private readonly SubmissionMapper _mapper;
    private readonly SubmissionCommand _sut;

    public SubmissionCommandTests()
    {
        _mockSubmissionRepo = new Mock<ISubmissionRepository>();
        _mockSubmissionCache = new Mock<ISubmissionCache>();
        _mockExamRepo = new Mock<IExaminationRepository>();
        _mockSessionRepo = new Mock<IStudentExamSessionRepository>();
        _mockProblemRepo = new Mock<IProblemRepository>();
        _mockNotificationService = new Mock<IBusinessNotificationService>();
        _mockLogger = new Mock<ILogger<SubmissionCommand>>();
        _fakeCache = new FakeSubmissionCache();
        _fakeTestcaseEvaluator = new FakeTestcaseEvaluator();

        _sut = new SubmissionCommand(
            _mockSubmissionRepo.Object,
            _mapper = new SubmissionMapper(),
            _fakeCache,
            _mockLogger.Object,
            _mockProblemRepo.Object,
            _fakeTestcaseEvaluator,
            _mockExamRepo.Object,
            new TestResultMapper(),
            _mockNotificationService.Object,
            _mockSessionRepo.Object);
    }

    private static SubmitProblemRequest ValidRequest(string? studentId = "student-1",
        string? examId = "exam-1", string? problemId = "problem-1")
    {
        return new SubmitProblemRequest
        {
            StudentId = studentId ?? string.Empty,
            ExamId = examId ?? string.Empty,
            ProblemId = problemId ?? string.Empty,
            Source = "print('hello')",
            LanguageId = "python",
            CompilerId = "python3"
        };
    }

    // ========================================================================
    // SUB-01 — PRACTICAL mode (Boundary)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenExamIsPractical_CreatesSubmissionWithVersionOne()
    {
        // Arrange
        var request = ValidRequest();
        var exam = new Examination { Id = request.ExamId, Mode = Mode.PRACTICAL, Status = Status.ONGOING };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync(exam);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-1"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(1);
        result.Status.Should().Be(SubmissionStatus.PENDING.ToString());
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.IsAny<Submission>()), Times.Once);
    }

    // ========================================================================
    // SUB-02 — EXAMINATION mode, active session (Boundary)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenExamIsExaminationAndSessionActive_CreatesSubmission()
    {
        // Arrange
        var request = ValidRequest();
        var exam = new Examination { Id = request.ExamId, Mode = Mode.EXAMINATION, Status = Status.ONGOING };
        var session = new StudentExamSession
        {
            StudentId = request.StudentId,
            ExamId = request.ExamId,
            Phase = StudentExamSessionPhase.Active
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync(exam);
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(request.StudentId, request.ExamId))
            .ReturnsAsync(session);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-1"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(1);
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.IsAny<Submission>()), Times.Once);
    }

    // ========================================================================
    // SUB-03 — EXAMINATION mode, no session (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenExamIsExaminationAndNoSession_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = ValidRequest();
        var exam = new Examination { Id = request.ExamId, Mode = Mode.EXAMINATION, Status = Status.ONGOING };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync(exam);
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(request.StudentId, request.ExamId))
            .ReturnsAsync((StudentExamSession?)null);

        // Act
        var act = async () => await _sut.SubmitProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*session*not active*");
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.IsAny<Submission>()), Times.Never);
    }

    // ========================================================================
    // SUB-04 — EXAMINATION mode, session not active (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenExamIsExaminationAndSessionNotActive_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = ValidRequest();
        var exam = new Examination { Id = request.ExamId, Mode = Mode.EXAMINATION, Status = Status.ONGOING };
        var session = new StudentExamSession
        {
            StudentId = request.StudentId,
            ExamId = request.ExamId,
            Phase = StudentExamSessionPhase.Completed
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync(exam);
        _mockSessionRepo
            .Setup(x => x.GetByStudentAndExamAsync(request.StudentId, request.ExamId))
            .ReturnsAsync(session);

        // Act
        var act = async () => await _sut.SubmitProblemAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*session*not active*");
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.IsAny<Submission>()), Times.Never);
    }

    // ========================================================================
    // SUB-05 — Re-submit same problem (Normal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenProblemAlreadySubmitted_IncrementsVersion()
    {
        // Arrange
        var request = ValidRequest();
        var existing = new Submission
        {
            Id = "sub-old",
            StudentId = request.StudentId,
            ExamId = request.ExamId,
            ProblemId = request.ProblemId,
            Version = 1
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-2"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission> { existing });

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(2);
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.IsAny<Submission>()), Times.Once);
    }

    // ========================================================================
    // SUB-06 — Multiple re-submits (Normal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenMultipleSubmissionsExist_IncrementsToMaxPlusOne()
    {
        // Arrange
        var request = ValidRequest();
        var existing = new List<Submission>
        {
            new() { Id = "sub-1", StudentId = request.StudentId, ExamId = request.ExamId, ProblemId = request.ProblemId, Version = 1 },
            new() { Id = "sub-2", StudentId = request.StudentId, ExamId = request.ExamId, ProblemId = request.ProblemId, Version = 2 },
            new() { Id = "sub-3", StudentId = request.StudentId, ExamId = request.ExamId, ProblemId = request.ProblemId, Version = 3 }
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-4"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(existing);

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(4);
    }

    // ========================================================================
    // SUB-07 — Submission cached (Normal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenCacheHit_UsesCachedSubmissionsToComputeVersion()
    {
        // Arrange
        var request = ValidRequest();
        var cachedSubmissions = new List<Submission>
        {
            new() { Id = "sub-1", StudentId = request.StudentId, ExamId = request.ExamId, ProblemId = request.ProblemId, Version = 1 }
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-2"; return s; });
        _fakeCache.SetOverride(request.StudentId, request.ExamId, request.ProblemId, cachedSubmissions);

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(2);
        _mockSubmissionRepo.Verify(x => x.GetByStudentIdAsync(It.IsAny<string>()), Times.Never);
    }

    // ========================================================================
    // SUB-08 — Cache miss (Normal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenCacheMiss_FallsBackToRepository()
    {
        // Arrange
        var request = ValidRequest();
        var repoSubmissions = new List<Submission>
        {
            new() { Id = "sub-1", StudentId = request.StudentId, ExamId = request.ExamId, ProblemId = request.ProblemId, Version = 1 }
        };

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-2"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(repoSubmissions);

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Version.Should().Be(2);
        _mockSubmissionRepo.Verify(x => x.GetByStudentIdAsync(request.StudentId), Times.Once);
    }

    // ========================================================================
    // SUB-09 — Repository returns null (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenCreateReturnsNull_ReturnsNull()
    {
        // Arrange
        var request = ValidRequest();

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission?)null);
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().BeNull();
    }

    // ========================================================================
    // SUB-10 — Exam not found (Boundary)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenExamNotFound_CreatesSubmissionWithoutSessionCheck()
    {
        // Arrange
        var request = ValidRequest();

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-1"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockSessionRepo.Verify(
            x => x.GetByStudentAndExamAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // ========================================================================
    // SUB-11 — Submission to non-existent exam (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenSubmissionToNonexistentExam_CreatesSubmissionWithoutSessionCheck()
    {
        // Arrange
        var request = ValidRequest();

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-1"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockSessionRepo.Verify(
            x => x.GetByStudentAndExamAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    // ========================================================================
    // SUB-12 — StudentId null/empty (Abnormal)
    // ========================================================================
    [Fact]
    public async Task SubmitProblemAsync_WhenStudentIdIsNullOrEmpty_StillCreatesSubmission()
    {
        // Arrange
        var request = ValidRequest(studentId: "");

        _mockExamRepo
            .Setup(x => x.GetByIdAsync(request.ExamId))
            .ReturnsAsync((Examination?)null);
        _mockSubmissionRepo
            .Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => { s.Id = "sub-1"; return s; });
        _mockSubmissionRepo
            .Setup(x => x.GetByStudentIdAsync(request.StudentId))
            .ReturnsAsync(new List<Submission>());

        // Act
        var result = await _sut.SubmitProblemAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockSubmissionRepo.Verify(x => x.CreateAsync(It.Is<Submission>(
            s => s.StudentId == string.Empty)), Times.Once);
    }

    // ========================================================================
    // SUB-27 — Submission not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenSubmissionNotFound_ReturnsFalse()
    {
        // Arrange
        var submissionId = "nonexistent";
        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync((Submission?)null);

        // Act
        var result = await _sut.OverrideSubmissionScoreAsync(submissionId, 8.0f, 10.0f);

        // Assert
        result.Should().BeFalse();
        _mockSubmissionRepo.Verify(x => x.UpdateAsync(It.IsAny<Submission>()), Times.Never);
    }

    // ========================================================================
    // SUB-28 — Score exceeds max mark (Abnormal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenScoreExceedsMax_ThrowsInvalidOperationException()
    {
        // Arrange
        var submissionId = "sub-1";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "problem-1",
            Status = SubmissionStatus.GRADED
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);

        // Act
        var act = async () => await _sut.OverrideSubmissionScoreAsync(submissionId, 15.0f, 10.0f);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*15*cannot exceed*10*");
        _mockSubmissionRepo.Verify(x => x.UpdateAsync(It.IsAny<Submission>()), Times.Never);
    }

    // ========================================================================
    // SUB-29 — Score equals max mark (Boundary)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenScoreEqualsMax_Succeeds()
    {
        // Arrange
        var submissionId = "sub-1";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "problem-1",
            FinalScore = 5.0f,
            Status = SubmissionStatus.GRADED
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);
        _mockSubmissionRepo
            .Setup(x => x.UpdateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => s);

        // Act
        var result = await _sut.OverrideSubmissionScoreAsync(submissionId, 10.0f, 10.0f);

        // Assert
        result.Should().BeTrue();
        _mockSubmissionRepo.Verify(x => x.UpdateAsync(It.Is<Submission>(
            s => s.FinalScore == 10.0f)), Times.Once);
    }

    // ========================================================================
    // SUB-30 — Override previously ungraded (Normal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenUngraded_SetsStatusToGraded()
    {
        // Arrange
        var submissionId = "sub-1";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "problem-1",
            FinalScore = 0f,
            Status = SubmissionStatus.PENDING
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);
        _mockSubmissionRepo
            .Setup(x => x.UpdateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => s);

        // Act
        var result = await _sut.OverrideSubmissionScoreAsync(submissionId, 7.5f, 10.0f);

        // Assert
        result.Should().BeTrue();
        _mockSubmissionRepo.Verify(x => x.UpdateAsync(It.Is<Submission>(
            s => s.FinalScore == 7.5f && s.Status == SubmissionStatus.GRADED)), Times.Once);
    }

    // ========================================================================
    // SUB-31 — Override already graded (Normal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenAlreadyGraded_UpdatesScore()
    {
        // Arrange
        var submissionId = "sub-1";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "problem-1",
            FinalScore = 3.0f,
            Status = SubmissionStatus.GRADED
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);
        _mockSubmissionRepo
            .Setup(x => x.UpdateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => s);

        // Act
        var result = await _sut.OverrideSubmissionScoreAsync(submissionId, 8.0f, 10.0f);

        // Assert
        result.Should().BeTrue();
        _mockSubmissionRepo.Verify(x => x.UpdateAsync(It.Is<Submission>(
            s => s.FinalScore == 8.0f && s.Status == SubmissionStatus.GRADED)), Times.Once);
    }

    // ========================================================================
    // SUB-32 — Update success (Normal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenUpdateSucceeds_ReturnsTrue()
    {
        // Arrange
        var submissionId = "sub-1";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = "student-1",
            ExamId = "exam-1",
            ProblemId = "problem-1",
            Status = SubmissionStatus.GRADED
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);
        _mockSubmissionRepo
            .Setup(x => x.UpdateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => s);

        // Act
        var result = await _sut.OverrideSubmissionScoreAsync(submissionId, 6.0f, 10.0f);

        // Assert
        result.Should().BeTrue();
    }

    // ========================================================================
    // SUB-33 — Notification sent (Normal)
    // ========================================================================
    [Fact]
    public async Task OverrideSubmissionScoreAsync_WhenSuccessful_SendsNotification()
    {
        // Arrange
        var submissionId = "sub-1";
        var studentId = "student-override";
        var examId = "exam-override";
        var problemId = "problem-override";
        var existing = new Submission
        {
            Id = submissionId,
            StudentId = studentId,
            ExamId = examId,
            ProblemId = problemId,
            Status = SubmissionStatus.GRADED
        };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(existing);
        _mockSubmissionRepo
            .Setup(x => x.UpdateAsync(It.IsAny<Submission>()))
            .ReturnsAsync((Submission s) => s);

        // Act
        await _sut.OverrideSubmissionScoreAsync(submissionId, 5.0f, 10.0f);

        // Assert
        _mockNotificationService.Verify(x => x.NotifyUsersAsync(
            It.Is<IEnumerable<string>>(ids => ids.Contains(studentId)),
            NotificationType.GRADE_RESULT,
            "Score manually overridden",
            It.Is<string>(body => body.Contains(problemId)),
            It.Is<Dictionary<string, object?>>(d =>
                d["submissionId"]!.ToString() == submissionId &&
                d["examId"]!.ToString() == examId &&
                d["problemId"]!.ToString() == problemId &&
                (float)d["finalScore"]! == 5.0f)),
            Times.Once);
    }

    // ========================================================================
    // SUB-13 — Problem not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenProblemNotFound_ReturnsEmptyResponse()
    {
        // Arrange
        var problemId = "nonexistent";
        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = "exam-1",
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = "sub-1", StudentId = "student-1", LanguageId = "python", CompilerId = "python3", ExamId = "exam-1", ProblemId = problemId, Source = "print(1)" }
            }
        };

        _mockProblemRepo
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync((ProblemModel?)null);

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.ProblemId.Should().Be(problemId);
        result.TotalSubmissions.Should().Be(1);
        result.GradedCount.Should().Be(0);
        result.FailedCount.Should().Be(0);
        result.Results.Should().BeEmpty();
    }

    // ========================================================================
    // SUB-14 — Problem has no hidden testcases (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenNoHiddenTestcases_ReturnsEmptyResponse()
    {
        // Arrange
        var problemId = "prob-public-only";
        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = "exam-1",
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = "sub-1", StudentId = "student-1", LanguageId = "python", CompilerId = "python3", ExamId = "exam-1", ProblemId = problemId, Source = "print(1)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            Title = "Public Only",
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = true, IsDeleted = false }
            }
        };

        _mockProblemRepo
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(problem);

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalSubmissions.Should().Be(1);
        result.GradedCount.Should().Be(0);
        result.FailedCount.Should().Be(0);
        result.Results.Should().BeEmpty();
    }

    // ========================================================================
    // SUB-15 — All submissions pass all tests (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenAllPass_ReturnsAllGraded()
    {
        // Arrange
        var problemId = "prob-all-pass";
        var examId = "exam-1";
        var submissionId = "sub-1";
        var studentId = "student-1";
        var hiddenTcId = "tc-hidden-1";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = submissionId, StudentId = studentId, LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(int(input())+int(input()))" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            Title = "Add Two Numbers",
            TestCases = new List<ModelTestCase>
            {
                new() { Id = hiddenTcId, ProblemId = problemId, InputData = "1\n2\n", ExpectedOutput = "3\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };

        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = hiddenTcId, Status = TestcaseStatus.SUCCESS.ToString(), ExecutionTimeMs = 50 }
        };

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalSubmissions.Should().Be(1);
        result.GradedCount.Should().Be(1);
        result.FailedCount.Should().Be(0);
        result.Results.Should().HaveCount(1);
        result.Results[0].Status.Should().Be(SubmissionStatus.GRADED.ToString());
        result.Results[0].PassedTestCases.Should().Be(1);
        result.Results[0].TotalTestCases.Should().Be(1);

        _mockNotificationService.Verify(x => x.NotifyUsersAsync(
            It.Is<IEnumerable<string>>(ids => ids.Contains(studentId)),
            NotificationType.GRADE_RESULT,
            "Grading result available",
            It.IsAny<string>(),
            It.IsAny<Dictionary<string, object?>>()), Times.Once);
    }

    // ========================================================================
    // SUB-16 — Partial pass (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenPartialPass_ReturnsCorrectScore()
    {
        // Arrange
        var problemId = "prob-partial";
        var examId = "exam-1";
        var submissionId = "sub-1";
        var studentId = "student-1";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = submissionId, StudentId = studentId, LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(1)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false },
                new() { Id = "tc-2", ProblemId = problemId, InputData = "2\n", ExpectedOutput = "3\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };
        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = "tc-1", Status = TestcaseStatus.SUCCESS.ToString(), ExecutionTimeMs = 10 },
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = "tc-2", Status = TestcaseStatus.FAIL.ToString(), ExecutionTimeMs = 10 }
        };

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.GradedCount.Should().Be(1);
        result.FailedCount.Should().Be(0);
        result.Results.Should().HaveCount(1);
        result.Results[0].PassedTestCases.Should().Be(1);
        result.Results[0].TotalTestCases.Should().Be(2);
        result.Results[0].FinalScore.Should().Be(5f);
    }

    // ========================================================================
    // SUB-17 — No test cases pass (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenNoTestsPass_ReturnsZeroScore()
    {
        // Arrange
        var problemId = "prob-all-fail";
        var examId = "exam-1";
        var submissionId = "sub-1";
        var studentId = "student-1";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = submissionId, StudentId = studentId, LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(0)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };
        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = "tc-1", Status = TestcaseStatus.FAIL.ToString(), ExecutionTimeMs = 10 }
        };

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.Results.Should().HaveCount(1);
        result.Results[0].PassedTestCases.Should().Be(0);
        result.Results[0].FinalScore.Should().Be(0f);
    }

    // ========================================================================
    // SUB-18 — TestcaseEvaluator throws (Abnormal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenEvaluatorThrows_ReturnsErrorResult()
    {
        // Arrange
        var problemId = "prob-eval-fail";
        var examId = "exam-1";
        var submissionId = "sub-1";
        var studentId = "student-1";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = submissionId, StudentId = studentId, LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(1)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };
        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);

        _fakeTestcaseEvaluator.ThrowException = new Exception("Code runner unavailable");

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.GradedCount.Should().Be(0);
        result.FailedCount.Should().Be(1);
        result.Results.Should().HaveCount(1);
        result.Results[0].ErrorMessage.Should().Be("Code runner unavailable");
        result.Results[0].FinalScore.Should().Be(0f);
    }

    // ========================================================================
    // SUB-19 — Multiple submissions (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenMultipleSubmissions_GradesAll()
    {
        // Arrange
        var problemId = "prob-multi";
        var examId = "exam-1";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = "sub-1", StudentId = "student-1", LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(1)" },
                new() { Id = "sub-2", StudentId = "student-2", LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(0)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-1")).ReturnsAsync(new Submission { Id = "sub-1", StudentId = "student-1", ProblemId = problemId, ExamId = examId });
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync("sub-2")).ReturnsAsync(new Submission { Id = "sub-2", StudentId = "student-2", ProblemId = problemId, ExamId = examId });
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        var callCount = 0;
        _fakeTestcaseEvaluator.OnExecute = _ =>
        {
            callCount++;
            return new List<TestResultResponse>
            {
                new() { Id = Guid.NewGuid().ToString(), TestcaseId = "tc-1", Status = callCount == 1 ? TestcaseStatus.SUCCESS.ToString() : TestcaseStatus.FAIL.ToString(), ExecutionTimeMs = 10 }
            };
        };

        // Act
        var result = await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalSubmissions.Should().Be(2);
        result.GradedCount.Should().Be(2);
        result.Results.Should().HaveCount(2);
    }

    // ========================================================================
    // SUB-20 — Notification sent after grading (Normal)
    // ========================================================================
    [Fact]
    public async Task AutoGradeAllSubmissionsOfProblemAsync_WhenGradingSucceeds_SendsNotification()
    {
        // Arrange
        var problemId = "prob-notify";
        var examId = "exam-1";
        var submissionId = "sub-1";
        var studentId = "student-notify";

        var request = new BulkSubmissionGradingRequest
        {
            ProblemId = problemId,
            ExamId = examId,
            Submissions = new List<SubmissionGradingRequest>
            {
                new() { Id = submissionId, StudentId = studentId, LanguageId = "python", CompilerId = "python3", ExamId = examId, ProblemId = problemId, Source = "print(1)" }
            }
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };
        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId };

        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = "tc-1", Status = TestcaseStatus.SUCCESS.ToString(), ExecutionTimeMs = 50 }
        };

        // Act
        await _sut.AutoGradeAllSubmissionsOfProblemAysnc(request);

        // Assert
        _mockNotificationService.Verify(x => x.NotifyUsersAsync(
            It.Is<IEnumerable<string>>(ids => ids.Contains(studentId)),
            NotificationType.GRADE_RESULT,
            "Grading result available",
            It.Is<string>(body => body.Contains(problemId)),
            It.Is<Dictionary<string, object?>>(d =>
                d["submissionId"]!.ToString() == submissionId &&
                d["examId"]!.ToString() == examId &&
                d["problemId"]!.ToString() == problemId)),
            Times.Once);
    }

    // ========================================================================
    // SUB-21 — Submission not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenSubmissionNotFound_ReturnsError()
    {
        // Arrange
        var submissionId = "nonexistent";
        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync((Submission?)null);

        // Act
        var result = await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        result.Should().NotBeNull();
        result.SubmissionId.Should().Be(submissionId);
        result.ErrorMessage.Should().Be("Submission not found");
    }

    // ========================================================================
    // SUB-22 — Problem not found (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenProblemNotFound_ReturnsError()
    {
        // Arrange
        var submissionId = "sub-1";
        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(new Submission { Id = submissionId, ProblemId = "nonexistent-problem", StudentId = "student-1" });

        _mockProblemRepo
            .Setup(x => x.GetByIdAsync("nonexistent-problem"))
            .ReturnsAsync((ProblemModel?)null);

        // Act
        var result = await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        result.Should().NotBeNull();
        result.SubmissionId.Should().Be(submissionId);
        result.ErrorMessage.Should().Be("Problem not found");
    }

    // ========================================================================
    // SUB-23 — No hidden testcases (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenNoHiddenTestcases_ReturnsError()
    {
        // Arrange
        var submissionId = "sub-1";
        var problemId = "prob-public";
        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        _mockSubmissionRepo
            .Setup(x => x.GetByIdAsync(submissionId))
            .ReturnsAsync(new Submission { Id = submissionId, ProblemId = problemId, StudentId = "student-1", ExamId = "exam-1" });

        _mockProblemRepo
            .Setup(x => x.GetByIdAsync(problemId))
            .ReturnsAsync(new ProblemModel
            {
                Id = problemId,
                TestCases = new List<ModelTestCase>
                {
                    new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = true, IsDeleted = false }
                }
            });

        // Act
        var result = await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        result.Should().NotBeNull();
        result.SubmissionId.Should().Be(submissionId);
        result.ErrorMessage.Should().Be("No hidden test cases");
        result.TotalTestCases.Should().Be(0);
    }

    // ========================================================================
    // SUB-24 — Regrade success (Normal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenSuccess_ReturnsGradedResult()
    {
        // Arrange
        var submissionId = "sub-1";
        var problemId = "prob-regrade";
        var examId = "exam-1";
        var studentId = "student-regrade";
        var tcId = "tc-hidden-1";

        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        var submissionEntity = new Submission
        {
            Id = submissionId,
            StudentId = studentId,
            ProblemId = problemId,
            ExamId = examId,
            Source = "print(1)"
        };

        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = tcId, ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        var exam = new Examination { Id = examId, Problems = new List<ExaminationProblem> { new() { ProblemId = problemId, Mark = 10f } } };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(exam);
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = tcId, Status = TestcaseStatus.SUCCESS.ToString(), ExecutionTimeMs = 50 }
        };

        // Act
        var result = await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        result.Should().NotBeNull();
        result.SubmissionId.Should().Be(submissionId);
        result.ErrorMessage.Should().BeNull();
        result.Status.Should().Be(SubmissionStatus.GRADED.ToString());
        result.PassedTestCases.Should().Be(1);
        result.TotalTestCases.Should().Be(1);
        result.FinalScore.Should().Be(10f);
    }

    // ========================================================================
    // SUB-25 — Regrade exception (Abnormal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenEvaluatorThrows_ReturnsError()
    {
        // Arrange
        var submissionId = "sub-regrade-fail";
        var problemId = "prob-rg-fail";
        var examId = "exam-1";
        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        var submissionEntity = new Submission { Id = submissionId, StudentId = "student-1", ProblemId = problemId, ExamId = examId, Source = "print(1)" };
        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = "tc-1", ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(new Examination { Id = examId });
        _fakeTestcaseEvaluator.ThrowException = new Exception("Regrade runner error");

        // Act
        var result = await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        result.Should().NotBeNull();
        result.SubmissionId.Should().Be(submissionId);
        result.ErrorMessage.Should().Be("Regrade runner error");
        result.TotalTestCases.Should().Be(1);
    }

    // ========================================================================
    // SUB-26 — Notification sent (Normal)
    // ========================================================================
    [Fact]
    public async Task RegradeSingleSubmissionAsync_WhenSuccess_SendsNotification()
    {
        // Arrange
        var submissionId = "sub-notify-rg";
        var problemId = "prob-notify-rg";
        var examId = "exam-1";
        var studentId = "student-rg-notify";
        var tcId = "tc-rg-1";

        var request = new SingleSubmissionRegradeRequest { CompilerId = "python3", LanguageId = "python" };

        var submissionEntity = new Submission { Id = submissionId, StudentId = studentId, ProblemId = problemId, ExamId = examId, Source = "print(1)" };
        var problem = new ProblemModel
        {
            Id = problemId,
            TestCases = new List<ModelTestCase>
            {
                new() { Id = tcId, ProblemId = problemId, InputData = "1\n", ExpectedOutput = "1\n", IsPublic = false, IsDeleted = false }
            }
        };

        _mockSubmissionRepo.Setup(x => x.GetByIdAsync(submissionId)).ReturnsAsync(submissionEntity);
        _mockProblemRepo.Setup(x => x.GetByIdAsync(problemId)).ReturnsAsync(problem);
        _mockExamRepo.Setup(x => x.GetByIdAsync(examId)).ReturnsAsync(new Examination { Id = examId });
        _mockSubmissionRepo.Setup(x => x.UpdateAsync(It.IsAny<Submission>())).ReturnsAsync((Submission s) => s);

        _fakeTestcaseEvaluator.NextResults = new List<TestResultResponse>
        {
            new() { Id = Guid.NewGuid().ToString(), TestcaseId = tcId, Status = TestcaseStatus.SUCCESS.ToString(), ExecutionTimeMs = 50 }
        };

        // Act
        await _sut.RegradeSingleSubmissionAsync(submissionId, request);

        // Assert
        _mockNotificationService.Verify(x => x.NotifyUsersAsync(
            It.Is<IEnumerable<string>>(ids => ids.Contains(studentId)),
            NotificationType.GRADE_RESULT,
            "Grading result available",
            It.Is<string>(body => body.Contains("re-graded")),
            It.Is<Dictionary<string, object?>>(d =>
                d["submissionId"]!.ToString() == submissionId &&
                d["examId"]!.ToString() == examId &&
                d["problemId"]!.ToString() == problemId)),
            Times.Once);
    }

    // ========================================================================
    // Fake ITestcaseEvaluator — intercepts ExecuteTestcasesAsync calls.
    // ========================================================================
    private class FakeTestcaseEvaluator : ITestcaseEvaluator
    {
        public List<TestResultResponse> NextResults { get; set; } = new();
        public Exception? ThrowException { get; set; }
        public Func<string, List<TestResultResponse>>? OnExecute { get; set; }

        public Task<CompilationResult> ExecuteCustomTestcaseAsync(
            string compilerId, CompileRequest compileRequest, string lang)
            => Task.FromResult(new CompilationResult());

        public Task<List<TestResultResponse>> ExecuteTestcasesAsync(
            string compilerId, RumBatchRequest runBatchRequest, string lang)
        {
            if (ThrowException != null)
                throw ThrowException;

            var results = OnExecute != null
                ? OnExecute(compilerId)
                : NextResults;

            return Task.FromResult(results);
        }
    }

    // ========================================================================
    // Fake ISubmissionCache — records SetAsync calls; allows pre-seeding for cache-hit tests.
    // ========================================================================
    private class FakeSubmissionCache : ISubmissionCache
    {
        private readonly Dictionary<string, object?> _store = new();
        private string? _overrideKey;
        private object? _overrideValue;

        public void SetOverride(string studentId, string examId, string problemId, object? value)
        {
            var key = GetSubmissionsListKey(studentId, examId, problemId);
            _overrideKey = key;
            _overrideValue = value;
        }

        public string GetSubmissionsListKey(string studentId, string examId, string problemId) =>
            $"submission:student:{studentId}:exam:{examId}:problem:{problemId}";

        public Task<TValue?> GetAsync<TValue>(string key) where TValue : class
        {
            if (_overrideKey == key && _overrideValue != null)
                return Task.FromResult((TValue?)_overrideValue);
            _store.TryGetValue(key, out var val);
            return Task.FromResult(val as TValue);
        }

        public Task SetAsync<TValue>(string key, TValue data) where TValue : class
        {
            _store[key] = data;
            return Task.CompletedTask;
        }

        public Task SetAsync<TValue>(string key, TValue data, TimeSpan expireTime) where TValue : class
        {
            _store[key] = data;
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string key)
        {
            _store.Remove(key);
            return Task.CompletedTask;
        }

        public Task<TValue?> GetOrSetAsync<TValue>(string key, Func<Task<TValue?>> factory, TimeSpan? expireTime = null)
            where TValue : class => throw new NotImplementedException();
    }
}
