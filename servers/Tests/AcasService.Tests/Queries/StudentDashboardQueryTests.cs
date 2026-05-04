using AcasService.Application.Queries.ClassroomDashboard;
using AcasService.Models;
using AcasService.Repositories.AcademicWarning;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Submission;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using SubStatus = AcasService.Models.SubmissionStatus;

namespace AcasService.Tests.Queries
{
    public class StudentDashboardQueryTests
    {
        private readonly Mock<ILogger<StudentDashboardQuery>> _loggerMock;
        private readonly Mock<ISubmissionRepository> _submissionRepoMock;
        private readonly Mock<IClassroomEnrollmentRepository> _enrollmentRepoMock;
        private readonly Mock<IClassroomRepository> _classroomRepoMock;
        private readonly Mock<IExaminationRepository> _examinationRepoMock;
        private readonly Mock<IAcademicWarningRepository> _warningRepoMock;
        private readonly StudentDashboardQuery _sut;

        public StudentDashboardQueryTests()
        {
            _loggerMock = new Mock<ILogger<StudentDashboardQuery>>();
            _submissionRepoMock = new Mock<ISubmissionRepository>();
            _enrollmentRepoMock = new Mock<IClassroomEnrollmentRepository>();
            _classroomRepoMock = new Mock<IClassroomRepository>();
            _examinationRepoMock = new Mock<IExaminationRepository>();
            _warningRepoMock = new Mock<IAcademicWarningRepository>();

            _sut = new StudentDashboardQuery(
                _loggerMock.Object,
                _submissionRepoMock.Object,
                _enrollmentRepoMock.Object,
                _classroomRepoMock.Object,
                _examinationRepoMock.Object,
                _warningRepoMock.Object);
        }

        // F087: GetOverviewAsync(string classroomId, string studentId)

        [Fact]
        public async Task GetOverviewAsync_UTC01_Normal_ShouldReturnFullOverview_WhenAllDataExists()
        {
            var classroomId = "c1";
            var studentId = "s1";
            var classroom = new Models.Classroom { Id = classroomId, ClassName = "Class 1" };
            var exams = new List<Examination> { new Examination { Id = "e1" } };
            var submissions = new List<Submission> 
            { 
                new Submission { Id = "sub1", StudentId = studentId, ExamId = "e1", Status = SubStatus.GRADED, FinalScore = 8, Version = 1 } 
            };
            var warnings = new List<AcademicWarning> 
            { 
                new AcademicWarning { Id = "w1", StudentId = studentId, ClassroomId = classroomId, IsRead = true } 
            };

            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(classroom);
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(submissions);
            _warningRepoMock.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(warnings);

            var result = await _sut.GetOverviewAsync(classroomId, studentId);

            Assert.NotNull(result);
            Assert.Equal("Class 1", result.ClassName);
            Assert.Equal(8, result.AverageScore);
            Assert.Equal(1, result.TotalWarnings);
        }

        [Fact]
        public async Task GetOverviewAsync_UTC02_Boundary_ShouldReturnZeroScores_WhenNoSubmissionsExist()
        {
            var classroomId = "c1";
            var studentId = "s1";
            var exams = new List<Examination> { new Examination { Id = "e1" } };
            
            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(new Models.Classroom { ClassName = "C1" });
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<Submission>());
            _warningRepoMock.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(new List<AcademicWarning>());

            var result = await _sut.GetOverviewAsync(classroomId, studentId);

            Assert.Equal(0, result.AverageScore);
            Assert.Equal(0, result.SubmittedExams);
            Assert.Equal(0, result.TotalWarnings);
        }

        [Fact]
        public async Task GetOverviewAsync_UTC03_Boundary_ShouldReturnEmptyOverview_WhenNoExamsExist()
        {
            var classroomId = "c1";
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(new List<Examination>());

            var result = await _sut.GetOverviewAsync(classroomId, "s1");

            Assert.Equal(0, result.TotalExams);
            Assert.Equal(0, result.AverageScore);
        }

        [Fact]
        public async Task GetOverviewAsync_UTC04_Abnormal_ShouldReturnUnknownClassName_WhenClassroomNotFound()
        {
            var classroomId = "nonexistent";
            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync((Models.Classroom)null);
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(new List<Examination>());

            var result = await _sut.GetOverviewAsync(classroomId, "s1");

            Assert.Equal("Unknown", result.ClassName);
        }

        [Fact]
        public async Task GetOverviewAsync_UTC05_Normal_ShouldReturnCorrectWarningCount()
        {
            var classroomId = "c1";
            var studentId = "s1";
            var exams = new List<Examination> { new Examination { Id = "e1" } };
            var warnings = new List<AcademicWarning> 
            { 
                new AcademicWarning { Id = "w1", ClassroomId = classroomId, StudentId = studentId, IsRead = true },
                new AcademicWarning { Id = "w2", ClassroomId = classroomId, StudentId = studentId, IsRead = false }
            };

            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(new Models.Classroom());
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<Submission>());
            _warningRepoMock.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(warnings);

            var result = await _sut.GetOverviewAsync(classroomId, studentId);

            Assert.Equal(2, result.TotalWarnings);
            Assert.Equal(1, result.UnreadWarnings);
        }

        // F088: GetExamScoresAsync(string classroomId, string studentId)

        [Fact]
        public async Task GetExamScoresAsync_UTC01_Boundary_ShouldReturnScores_WhenSubmissionsExist()
        {
            var classroomId = "c1"; var studentId = "s1";
            var exams = new List<Examination> { new Examination { Id = "e1", ExamName = "Exam 1", Mode = 0, TotalMark = 10 } };
            var submissions = new List<Submission> { new Submission { ExamId = "e1", StudentId = studentId, Status = SubStatus.GRADED, FinalScore = 9, Version = 1 } };

            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(submissions);

            var result = await _sut.GetExamScoresAsync(classroomId, studentId);

            Assert.NotEmpty(result);
            Assert.Equal(9, result[0].Score);
            Assert.Equal("GRADED", result[0].Status);
        }

        [Fact]
        public async Task GetExamScoresAsync_UTC02_Abnormal_ShouldReturnEmptyList_WhenNoExamsFound()
        {
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync("c1")).ReturnsAsync(new List<Examination>());

            var result = await _sut.GetExamScoresAsync("c1", "s1");

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetExamScoresAsync_UTC03_Boundary_ShouldReturnNotSubmitted_WhenNoSubmissionFound()
        {
            var classroomId = "c1"; var studentId = "s1";
            var exams = new List<Examination> { new Examination { Id = "e1", ExamName = "Exam 1", Mode = 0, TotalMark = 10 } };

            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(new List<Submission>());

            var result = await _sut.GetExamScoresAsync(classroomId, studentId);

            Assert.Single(result);
            Assert.Equal(0, result[0].Score);
            Assert.Equal("NOT_SUBMITTED", result[0].Status);
        }

        // F089: GetWarningsAsync(string studentId, int limit = 10)

        [Fact]
        public async Task GetWarningsAsync_UTC01_Boundary_ShouldReturnWarnings_OrderedByDateDesc()
        {
            var studentId = "s1";
            var warnings = new List<AcademicWarning>
            {
                new AcademicWarning { Id = "w1", SentDate = DateTime.Now.AddDays(-2), InvolvedExams = new InvolvedExamsInfo { AverageScore = 5 } },
                new AcademicWarning { Id = "w2", SentDate = DateTime.Now.AddDays(-1), InvolvedExams = new InvolvedExamsInfo { AverageScore = 6 } }
            };

            _warningRepoMock.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(warnings);

            var result = await _sut.GetWarningsAsync(studentId, 10);

            Assert.Equal(2, result.Count);
            Assert.Equal("w2", result[0].WarningId); // Mới nhất lên đầu
        }

        [Fact]
        public async Task GetWarningsAsync_UTC02_Normal_ShouldLimitResults()
        {
            var studentId = "s1";
            var warnings = Enumerable.Range(1, 10).Select(i => new AcademicWarning 
            { 
                Id = i.ToString(), 
                SentDate = DateTime.Now.AddDays(i),
                InvolvedExams = new InvolvedExamsInfo { AverageScore = 5 } 
            }).ToList();

            _warningRepoMock.Setup(r => r.FindByStudentIdAsync(studentId)).ReturnsAsync(warnings);

            var result = await _sut.GetWarningsAsync(studentId, 5);

            Assert.Equal(5, result.Count);
        }

        [Fact]
        public async Task GetWarningsAsync_UTC03_Abnormal_ShouldReturnEmptyList_WhenNoWarningsFound()
        {
            _warningRepoMock.Setup(r => r.FindByStudentIdAsync("s1")).ReturnsAsync(new List<AcademicWarning>());

            var result = await _sut.GetWarningsAsync("s1");

            Assert.Empty(result);
        }

        // F090: GetScoreTrendAsync(string classroomId, string studentId)

        [Fact]
        public async Task GetScoreTrendAsync_UTC01_Normal_ShouldReturnTrend_OrderedByDate()
        {
            var classroomId = "c1"; var studentId = "s1";
            var exams = new List<Examination> { 
                new Examination { Id = "e1", ExamName = "Ex 1" },
                new Examination { Id = "e2", ExamName = "Ex 2" }
            };
            var submissions = new List<Submission> { 
                new Submission { ExamId = "e1", StudentId = studentId, Status = SubStatus.GRADED, FinalScore = 5, SubmittedDate = DateTime.Now.AddDays(-2) },
                new Submission { ExamId = "e2", StudentId = studentId, Status = SubStatus.GRADED, FinalScore = 8, SubmittedDate = DateTime.Now.AddDays(-1) }
            };

            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(submissions);

            var result = await _sut.GetScoreTrendAsync(classroomId, studentId);

            Assert.Equal(2, result.Count);
            Assert.Equal("e1", result[0].ExamId); 
            Assert.Equal("e2", result[1].ExamId); 
        }

        [Fact]
        public async Task GetScoreTrendAsync_UTC02_Abnormal_ShouldReturnEmptyList_WhenNoExamsFound()
        {
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync("c1")).ReturnsAsync(new List<Examination>());

            var result = await _sut.GetScoreTrendAsync("c1", "s1");

            Assert.Empty(result);
        }

        // F091: GetSubmissionStatsAsync(string classroomId, string studentId)

        [Fact]
        public async Task GetSubmissionStatsAsync_UTC01_Boundary_ShouldReturnStats_WhenSubmissionIsOnTime()
        {
            var classroomId = "c1"; var studentId = "s1";
            var classroom = new Models.Classroom { Id = classroomId, ClassName = "Class 1" };
            var exams = new List<Examination> { 
                new Examination { Id = "e1", EndDatetime = DateTime.Now.AddDays(1) }, 
                new Examination { Id = "e2", EndDatetime = DateTime.Now.AddDays(1) }
            };
            var submissions = new List<Submission> { 
                new Submission { ExamId = "e1", StudentId = studentId, Status = SubStatus.GRADED, SubmittedDate = DateTime.Now, Version = 1 } 
            };

            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(classroom);
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(submissions);

            var result = await _sut.GetSubmissionStatsAsync(classroomId, studentId);

            Assert.NotNull(result);
            Assert.Equal(1, result.SubmittedExams);
            Assert.Equal(50.0, result.SubmissionRate);
            Assert.False(result.IsLate);
        }

        [Fact]
        public async Task GetSubmissionStatsAsync_UTC02_Boundary_ShouldReturnEmptyStats_WhenNoExamsFound()
        {
            var classroomId = "c1";
            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(new Models.Classroom { ClassName = "C1" });
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(new List<Examination>());

            var result = await _sut.GetSubmissionStatsAsync(classroomId, "s1");

            Assert.Equal(0, result.TotalExams);
            Assert.Equal(0, result.SubmissionRate);
        }

        [Fact]
        public async Task GetSubmissionStatsAsync_UTC03_Normal_ShouldReturnIsLateTrue_WhenSubmissionIsLate()
        {
            var classroomId = "c1"; var studentId = "s1";
            var exams = new List<Examination> { 
                new Examination { Id = "e1", EndDatetime = DateTime.Now.AddDays(-1) } 
            };
            var submissions = new List<Submission> { 
                new Submission { ExamId = "e1", StudentId = studentId, Status = SubStatus.GRADED, SubmittedDate = DateTime.Now, Version = 1 } // Nộp hôm nay -> Trễ
            };

            _classroomRepoMock.Setup(r => r.FindByIdAsync(classroomId)).ReturnsAsync(new Models.Classroom());
            _examinationRepoMock.Setup(r => r.GetByClassIdAsync(classroomId)).ReturnsAsync(exams);
            _submissionRepoMock.Setup(r => r.GetByExamIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(submissions);

            var result = await _sut.GetSubmissionStatsAsync(classroomId, studentId);

            Assert.True(result.IsLate);
        }
    }
}
