using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AcasService.Models;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Material;
using AcasService.Repositories.Problem;
using AcasService.Repositories.Subject;
using AcasService.Repositories.Submission;
using AcasService.Repositories.Slot;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Bogus;

namespace AcasService.Dev;

public class DynamoDbResetService : IDynamoDbResetService
{
    private const int BatchWriteLimit = 25;
    private const string PartitionKeyName = "id";
    private const string DefaultPassword = "123456";

    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DynamoDbResetService> _logger;

    public DynamoDbResetService(
        IAmazonDynamoDB dynamoDb,
        IConfiguration configuration,
        ILogger<DynamoDbResetService> logger)
    {
        _dynamoDb = dynamoDb;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ResetResult> ResetAndSeedAsync(CancellationToken cancellationToken = default)
    {
        var tables = DiscoverTableNames();
        if (tables.Count == 0)
        {
            _logger.LogWarning("No DynamoDB tables discovered for wipe");
            return new ResetResult(true, 0, 0);
        }

        var tablesToWipe = tables.Where(t => t.EntityType != typeof(ProgrammingLanguage)).ToList();

        // Also wipe the user table (managed by AuthService, but same DynamoDB)
        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";

        var totalWiped = 0;
        foreach (var (tableName, _) in tablesToWipe)
        {
            totalWiped += await SafeWipeTableAsync(tableName, cancellationToken);
        }
        totalWiped += await SafeWipeTableAsync(userTableName, cancellationToken);

        int seeded;
        try
        {
            seeded = await SeedDataAsync(tables, cancellationToken);
            _logger.LogInformation("Seeded {Count} items total", seeded);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Seed failed after wipe");
            return new ResetResult(false, totalWiped, 0, ex.Message);
        }

        return new ResetResult(true, tablesToWipe.Count + 1, seeded);
    }

    private async Task<int> SafeWipeTableAsync(string tableName, CancellationToken ct)
    {
        try
        {
            var wiped = await WipeTableAsync(tableName, ct);
            _logger.LogInformation("Wiped {Count} items from table {Table}", wiped, tableName);
            return wiped;
        }
        catch (ResourceNotFoundException)
        {
            _logger.LogWarning("Table {Table} not found; skipping wipe", tableName);
            return 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to wipe table {Table}", tableName);
            return 0;
        }
    }

    // ───────────────────────────── Discovery ─────────────────────────────

    private IReadOnlyList<(string TableName, Type EntityType)> DiscoverTableNames()
    {
        var results = new List<(string, Type)>();
        var modelsAssembly = typeof(Submission).Assembly;
        var modelTypes = modelsAssembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Namespace == "AcasService.Models");

        foreach (var type in modelTypes)
        {
            var attr = type.GetCustomAttribute<DynamoDBEntityAttribute>();
            if (attr == null) continue;

            var tableName = _configuration["DynamoDB:" + attr.ConfigKey];
            if (string.IsNullOrWhiteSpace(tableName))
            {
                _logger.LogWarning("No config for DynamoDB:{ConfigKey}; skipping {Type}", attr.ConfigKey, type.Name);
                continue;
            }

            results.Add((tableName, type));
        }

        return results;
    }

    // ───────────────────────────── Wipe ─────────────────────────────

    private async Task<int> WipeTableAsync(string tableName, CancellationToken cancellationToken)
    {
        var keysToDelete = new List<Dictionary<string, AttributeValue>>();
        var request = new ScanRequest
        {
            TableName = tableName,
            ProjectionExpression = "#pk",
            ExpressionAttributeNames = new Dictionary<string, string> { ["#pk"] = PartitionKeyName }
        };

        ScanResponse response;
        do
        {
            response = await _dynamoDb.ScanAsync(request, cancellationToken);
            foreach (var item in response.Items)
            {
                keysToDelete.Add(new Dictionary<string, AttributeValue>
                {
                    [PartitionKeyName] = item[PartitionKeyName]
                });
            }
            request.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

        for (var i = 0; i < keysToDelete.Count; i += BatchWriteLimit)
        {
            var batch = keysToDelete.Skip(i).Take(BatchWriteLimit)
                .Select(k => new WriteRequest { DeleteRequest = new DeleteRequest { Key = k } })
                .ToList();

            await _dynamoDb.BatchWriteItemAsync(new BatchWriteItemRequest
            {
                RequestItems = new Dictionary<string, List<WriteRequest>> { [tableName] = batch }
            }, cancellationToken);
        }

        return keysToDelete.Count;
    }

    // ───────────────────────────── Seed orchestration ─────────────────────────────

    private async Task<int> SeedDataAsync(
        IReadOnlyList<(string TableName, Type EntityType)> tables,
        CancellationToken ct)
    {
        var tableMap = tables.ToDictionary(t => t.TableName, t => t.EntityType);
        var seeded = 0;

        // 0) Users
        var (lecturerIds, studentIds) = await SeedUsersAsync(ct);
        seeded += lecturerIds.Count + studentIds.Count + 1;

        // 1) Programming languages (existing — do not seed)
        var languageIds = await GetExistingIdsAsync(tableMap, nameof(ProgrammingLanguage), ct);
        if (languageIds.Count == 0)
            _logger.LogWarning("No programming languages found; exams/submissions will be skipped");

        // 2) Subjects (CreatedBy → lecturer)
        var subjects = SeedSubjects(lecturerIds);
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Subject)),
            subjects, Repositories.Subject.DynamoMapper.SubjectToDynamoItem, ct);

        // 3) Problems (loaded from problems.json, LecturerId → lecturer1)
        var problems = SeedProblemsFromJson(lecturerIds);
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Problem)),
            problems, Repositories.Problem.DynamoMapper.ProblemToDynamoItem, ct);

        // 4) Classrooms (LecturerId → lecturer, SubjectId → subject)
        var classrooms = subjects.Count > 0 ? SeedClassrooms(lecturerIds, subjects) : new List<Classroom>();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Classroom)),
            classrooms, Repositories.Classroom.DynamoMapper.ClassroomToDynamoItem, ct);

        // 5) Enrollments (ClassId → classroom, StudentId → student)
        //    Build a lookup: classroomId → list of enrolled studentIds
        var enrollments = classrooms.Count > 0
            ? SeedClassEnrollments(classrooms, studentIds)
            : new List<ClassEnrollment>();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(ClassEnrollment)),
            enrollments, Repositories.ClassroomEnrollment.DynamoMapper.ToDynamoItem, ct);

        var enrollmentsByClassroom = enrollments
            .GroupBy(e => e.ClassId)
            .ToDictionary(g => g.Key, g => g.Select(e => e.StudentId).ToList());

        // 6) Examinations (ClassroomId → classroom, ProgrammingLanguageId → lang, Problems → subset of problems)
        var examinations = (classrooms.Count > 0 && problems.Count > 0 && languageIds.Count > 0)
            ? SeedExaminations(classrooms, languageIds, problems)
            : new List<Examination>();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Examination)),
            examinations, Repositories.Examination.DynamoMapper.ExaminationToDynamoItem, ct);

        // Build lookup: classroomId → list of exams in that classroom
        var examsByClassroom = examinations
            .GroupBy(e => e.ClassroomId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 7) Submissions — student MUST be enrolled in exam's classroom,
        //    ProblemId MUST be from exam's problem list, LanguageId = exam's language
        if (examinations.Count > 0)
        {
            var submissions = SeedSubmissions(examinations, enrollmentsByClassroom);
            seeded += await PutAllAsync(GetTableName(tableMap, nameof(Submission)),
                submissions, Repositories.Submission.DynamoMapper.SubmissionToDynamoItem, ct);
        }

        // 8) Slots — ExaminationIds MUST be exams of the same classroom
        if (classrooms.Count > 0)
        {
            var slots = SeedSlots(classrooms, examsByClassroom);
            seeded += await PutAllAsync(GetTableName(tableMap, nameof(Slot)),
                slots, Repositories.Slot.DynamoMapper.SlotToDynamoItem, ct);
        }

        // 9) Materials — LecturerId MUST be the classroom's lecturer
        if (classrooms.Count > 0)
        {
            var materials = SeedMaterials(classrooms);
            seeded += await PutAllAsync(GetTableName(tableMap, nameof(Material)),
                materials, Repositories.Material.DynamoMapper.MaterialToDynamoItem, ct);
        }

        // 10) Discussion issues — Author enrolled in classroom OR classroom lecturer
        if (classrooms.Count > 0 && problems.Count > 0)
        {
            var issues = SeedDiscussionIssues(classrooms, enrollmentsByClassroom, examsByClassroom);
            seeded += await PutAllAsync(GetTableName(tableMap, nameof(DiscussionIssue)),
                issues, Repositories.DiscussionIssue.DynamoMapper.DiscussionIssueToDynamoItem, ct);
        }

        return seeded;
    }

    // ───────────────────────────── User seeding ─────────────────────────────

    private async Task<(List<string> LecturerIds, List<string> StudentIds)> SeedUsersAsync(CancellationToken ct)
    {
        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";
        var hashedPassword = HashPassword(DefaultPassword);
        var now = DateTime.UtcNow;

        var lecturerIds = new List<string>();
        var studentIds = new List<string>();

        // Admin
        var adminId = Guid.NewGuid().ToString();
        await PutUserAsync(userTableName, new UserSeed(adminId, "AD000001", "admin@edu-acas.com",
            hashedPassword, "System Admin", "ADMIN", now), ct);

        // 5 Lecturers
        for (var i = 1; i <= 5; i++)
        {
            var id = Guid.NewGuid().ToString();
            lecturerIds.Add(id);
            await PutUserAsync(userTableName, new UserSeed(id, $"LE{i:D6}",
                $"lecturer{i}@edu-acas.com", hashedPassword, $"Dr. Lecturer {i}", "LECTURER", now), ct);
        }

        // 20 Students
        for (var i = 1; i <= 20; i++)
        {
            var id = Guid.NewGuid().ToString();
            studentIds.Add(id);
            await PutUserAsync(userTableName, new UserSeed(id, $"SE{i:D6}",
                $"student{i}@edu-acas.com", hashedPassword, $"Student {i}", "STUDENT", now), ct);
        }

        _logger.LogInformation("Seeded 26 users (1 admin, 5 lecturers, 20 students) with password '{Password}'", DefaultPassword);
        return (lecturerIds, studentIds);
    }

    private record UserSeed(string Id, string RoleNumber, string Email, string Password,
        string Fullname, string Role, DateTime Created);

    private async Task PutUserAsync(string tableName, UserSeed u, CancellationToken ct)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["id"] = new AttributeValue { S = u.Id },
            ["roleNumber"] = new AttributeValue { S = u.RoleNumber },
            ["email"] = new AttributeValue { S = u.Email },
            ["password"] = new AttributeValue { S = u.Password },
            ["fullname"] = new AttributeValue { S = u.Fullname },
            ["avatarUrl"] = new AttributeValue { S = "" },
            ["googleId"] = new AttributeValue { S = "" },
            ["role"] = new AttributeValue { S = u.Role },
            ["isEnable"] = new AttributeValue { BOOL = true },
            ["firstLogin"] = new AttributeValue { BOOL = false },
            ["createdDate"] = new AttributeValue { S = u.Created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
            ["updatedDate"] = new AttributeValue { S = u.Created.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
        };
        await _dynamoDb.PutItemAsync(new PutItemRequest { TableName = tableName, Item = item }, ct);
    }

    private string HashPassword(string password)
    {
        var secretKey = _configuration["Dev:HashingSecretKey"]
            ?? throw new InvalidOperationException("Dev:HashingSecretKey is not configured");
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    // ───────────────────────────── Problem seeding (Gemini + fallback) ─────────────────────────────

    private List<Problem> SeedProblemsFromJson(List<string> lecturerIds)
    {
        var jsonPath = Path.Combine(AppContext.BaseDirectory, "Dev", "problems.json");
        if (!File.Exists(jsonPath))
        {
            _logger.LogError("problems.json not found at {Path}", jsonPath);
            return new List<Problem>();
        }

        var json = File.ReadAllText(jsonPath);
        var dtos = JsonSerializer.Deserialize<List<ProblemJsonDto>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (dtos == null || dtos.Count == 0)
        {
            _logger.LogError("problems.json is empty or invalid");
            return new List<Problem>();
        }

        var problems = new List<Problem>();
        for (var i = 0; i < dtos.Count; i++)
        {
            var dto = dtos[i];
            var problemId = Guid.NewGuid().ToString();

            var difficulty = Enum.TryParse<Difficulty>(dto.Difficulty, true, out var d) ? d : Difficulty.EASY;

            problems.Add(new Problem
            {
                Id = problemId,
                LecturerId = lecturerIds[0],
                Title = dto.Title,
                Content = dto.Content,
                FileName = null,
                Difficulty = difficulty,
                CodeTemplates = new Dictionary<string, string>
                {
                    ["default"] = dto.CodeTemplate ?? string.Empty
                },
                CreatedDate = DateTime.UtcNow.AddMonths(-3).AddDays(i),
                UpdatedDate = DateTime.UtcNow,
                Tags = dto.Tags ?? Array.Empty<string>(),
                IsDeleted = false,
                TestCases = (dto.TestCases ?? new List<TestCaseJsonDto>()).Select(tc => new TestCase
                {
                    Id = Guid.NewGuid().ToString(),
                    ProblemId = problemId,
                    InputData = tc.Input ?? string.Empty,
                    ExpectedOutput = tc.ExpectedOutput ?? string.Empty,
                    IsPublic = tc.IsPublic,
                    IsCaseInsensitive = tc.IsCaseInsensitive,
                    IsFloatingPoint = tc.IsFloatingPoint,
                    FloatingPointTolerance = tc.FloatingPointTolerance,
                    DecimalPlaces = tc.DecimalPlaces,
                    IsTokenComparision = tc.IsTokenComparision,
                    IsNotOrderedComparision = tc.IsNotOrderedComparision,
                    IsDeleted = false
                }).ToList()
            });
        }

        _logger.LogInformation("Loaded {Count} problems from problems.json", problems.Count);
        return problems;
    }

    private sealed class ProblemJsonDto
    {
        public string Title { get; set; } = string.Empty;
        public string Difficulty { get; set; } = "EASY";
        public string[]? Tags { get; set; }
        public string? CodeTemplate { get; set; }
        public string? Content { get; set; }
        public List<TestCaseJsonDto>? TestCases { get; set; }
    }

    private sealed class TestCaseJsonDto
    {
        public string? Input { get; set; }
        public string? ExpectedOutput { get; set; }
        public bool IsPublic { get; set; }
        public bool IsCaseInsensitive { get; set; }
        public bool IsFloatingPoint { get; set; }
        public double? FloatingPointTolerance { get; set; }
        public int? DecimalPlaces { get; set; }
        public bool IsTokenComparision { get; set; }
        public bool IsNotOrderedComparision { get; set; }
    }

    // ───────────────────────────── Other seed methods ─────────────────────────────

    private async Task<List<string>> GetExistingIdsAsync(
        Dictionary<string, Type> tableMap, string entityName, CancellationToken ct)
    {
        var tableName = GetTableName(tableMap, entityName);
        if (string.IsNullOrEmpty(tableName)) return new List<string>();

        var ids = new List<string>();
        var request = new ScanRequest
        {
            TableName = tableName,
            ProjectionExpression = "#pk",
            ExpressionAttributeNames = new Dictionary<string, string> { ["#pk"] = PartitionKeyName }
        };

        ScanResponse response;
        do
        {
            response = await _dynamoDb.ScanAsync(request, ct);
            foreach (var item in response.Items)
            {
                if (item.TryGetValue(PartitionKeyName, out var av) && !string.IsNullOrEmpty(av.S))
                    ids.Add(av.S);
            }
            request.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

        return ids;
    }

    private List<Subject> SeedSubjects(List<string> lecturerIds)
    {
        var faker = new Faker();
        var codes = new[] { "CS101", "CS201", "CS301", "MATH101", "ALG202" };
        var names = new[] { "Introduction to Programming", "Data Structures", "Algorithms", "Discrete Math", "Linear Algebra" };
        var subjects = new List<Subject>();
        for (var i = 0; i < codes.Length; i++)
        {
            subjects.Add(new Subject
            {
                Id = Guid.NewGuid().ToString(),
                SubjectCode = codes[i],
                SubjectName = names[i],
                Description = faker.Lorem.Paragraph(),
                CreatedBy = faker.PickRandom(lecturerIds),
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow.AddMonths(-6),
                UpdatedDate = DateTime.UtcNow
            });
        }
        return subjects;
    }

    private List<Classroom> SeedClassrooms(List<string> lecturerIds, List<Subject> subjects)
    {
        var faker = new Faker();
        var list = new List<Classroom>();
        for (var i = 0; i < 6; i++)
        {
            var subject = subjects[i % subjects.Count];
            list.Add(new Classroom
            {
                Id = Guid.NewGuid().ToString(),
                ClassCode = faker.Random.AlphaNumeric(6).ToUpperInvariant(),
                ClassName = $"{subject.SubjectName} - Group {i + 1}",
                LecturerId = faker.PickRandom(lecturerIds),
                SubjectId = subject.Id,
                SemesterName = "Spring 2026",
                EnrolKey = faker.Random.AlphaNumeric(8),
                MaxSlot = faker.Random.Int(2, 5),
                CreatedDate = DateTime.UtcNow.AddMonths(-2),
                UpdatedDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(4),
                IsDeleted = false
            });
        }
        return list;
    }

    /// <summary>
    /// Each classroom gets 5-8 enrolled students. Returns all enrollments.
    /// </summary>
    private List<ClassEnrollment> SeedClassEnrollments(List<Classroom> classrooms, List<string> studentIds)
    {
        var faker = new Faker();
        var list = new List<ClassEnrollment>();
        foreach (var classroom in classrooms)
        {
            var enrolled = faker.PickRandom(studentIds, faker.Random.Int(5, Math.Min(10, studentIds.Count))).ToList();
            foreach (var sid in enrolled)
            {
                list.Add(new ClassEnrollment
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassId = classroom.Id,
                    StudentId = sid,
                    JoinedDate = DateTime.UtcNow.AddDays(-faker.Random.Int(10, 60)),
                    MovedOutDate = null,
                    IsJoining = true
                });
            }
        }
        return list;
    }

    /// <summary>
    /// Each classroom gets 1-2 exams. Each exam's problems are a subset of the global problem pool.
    /// ProgrammingLanguageId comes from the actual language pool.
    /// </summary>
    private List<Examination> SeedExaminations(
        List<Classroom> classrooms, List<string> languageIds, List<Problem> problems)
    {
        var faker = new Faker();
        var list = new List<Examination>();
        var examNames = new[] { "Midterm Exam", "Final Exam", "Practice Quiz", "Lab Test" };

        foreach (var classroom in classrooms)
        {
            var lecturerProblems = problems.Where(p => p.LecturerId == classroom.LecturerId).ToList();
            if (lecturerProblems.Count == 0) continue;

            var numExams = faker.Random.Int(1, 2);
            for (var e = 0; e < numExams; e++)
            {
                var selectedProblems = faker.PickRandom(lecturerProblems, faker.Random.Int(1, Math.Min(3, lecturerProblems.Count))).ToList();
                var markPerProblem = 10f / selectedProblems.Count;

                var start = DateTime.UtcNow.AddDays(-faker.Random.Int(5, 30));
                var end = start.AddHours(2);

                list.Add(new Examination
                {
                    Id = Guid.NewGuid().ToString(),
                    ExamName = $"{examNames[e % examNames.Length]} - {classroom.ClassName}",
                    ProgrammingLanguageId = faker.PickRandom(languageIds),
                    ClassroomId = classroom.Id,
                    Problems = selectedProblems.Select(p => new ExaminationProblem
                    {
                        ProblemId = p.Id,
                        Mark = (float)Math.Round(markPerProblem, 1)
                    }).ToList(),
                    StartDatetime = start,
                    EndDatetime = end,
                    Description = faker.Lorem.Paragraph(),
                    IsPublicResult = true,
                    TotalMark = 10f,
                    Status = Status.ONGOING,
                    Mode = faker.PickRandom(Mode.PRACTICAL, Mode.EXAMINATION),
                    IsDeleted = false,
                    CreatedDate = start.AddDays(-7),
                    UpdatedDate = DateTime.UtcNow
                });
            }
        }
        return list;
    }

    /// <summary>
    /// For each exam: only enrolled students submit, only the exam's problems, using the exam's language.
    /// </summary>
    private List<Submission> SeedSubmissions(
        List<Examination> examinations,
        Dictionary<string, List<string>> enrollmentsByClassroom)
    {
        var faker = new Faker();
        var list = new List<Submission>();

        foreach (var exam in examinations)
        {
            if (!enrollmentsByClassroom.TryGetValue(exam.ClassroomId, out var enrolledStudents)
                || enrolledStudents.Count == 0 || exam.Problems.Count == 0)
                continue;

            var submittingStudents = faker.PickRandom(enrolledStudents,
                faker.Random.Int(2, Math.Min(5, enrolledStudents.Count))).ToList();

            foreach (var studentId in submittingStudents)
            {
                // Each student submits to 1-2 problems in this exam
                var problemsToSolve = faker.PickRandom(exam.Problems,
                    faker.Random.Int(1, Math.Min(2, exam.Problems.Count))).ToList();

                foreach (var examProblem in problemsToSolve)
                {
                    var submitted = DateTime.UtcNow.AddHours(-faker.Random.Int(1, 72));

                    list.Add(new Submission
                    {
                        Id = Guid.NewGuid().ToString(),
                        StudentId = studentId,
                        ExamId = exam.Id,
                        ProblemId = examProblem.ProblemId,
                        LanguageId = exam.ProgrammingLanguageId,
                        CompilerId = "default",
                        Source = "# Solution\nprint('Hello')\n",
                        Version = 1,
                        SubmittedDate = submitted,
                        FinalScore = 0f,
                        Status = SubmissionStatus.PENDING,
                        GradedDate = DateTime.MinValue,
                        RegradingRequestId = string.Empty,
                        LecturerFeedback = string.Empty,
                        AiFeedback = string.Empty,
                        UpdatedDate = submitted,
                        TestResults = new List<TestResult>()
                    });
                }
            }
        }
        return list;
    }

    /// <summary>
    /// Slots belong to a classroom. ExaminationIds only reference exams of that classroom.
    /// </summary>
    private List<Slot> SeedSlots(
        List<Classroom> classrooms,
        Dictionary<string, List<Examination>> examsByClassroom)
    {
        var faker = new Faker();
        var list = new List<Slot>();
        foreach (var classroom in classrooms)
        {
            var classExamIds = examsByClassroom.TryGetValue(classroom.Id, out var exams)
                ? exams.Select(e => e.Id).ToList()
                : new List<string>();

            for (var i = 1; i <= faker.Random.Int(2, 4); i++)
            {
                list.Add(new Slot
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomId = classroom.Id,
                    SlotNumber = i.ToString(),
                    Title = $"Week {i}",
                    Description = faker.Lorem.Sentence(),
                    CreatedDate = DateTime.UtcNow.AddMonths(-1),
                    UpdatedDate = DateTime.UtcNow,
                    ExaminationIds = i == 1 && classExamIds.Count > 0
                        ? classExamIds.Take(1).ToList()
                        : new List<string>()
                });
            }
        }
        return list;
    }

    /// <summary>
    /// Materials: LecturerId is the classroom's lecturer (owner).
    /// </summary>
    private List<Material> SeedMaterials(List<Classroom> classrooms)
    {
        var faker = new Faker();
        var list = new List<Material>();
        foreach (var classroom in classrooms)
        {
            var numMaterials = faker.Random.Int(1, 3);
            for (var i = 0; i < numMaterials; i++)
            {
                list.Add(new Material
                {
                    Id = Guid.NewGuid().ToString(),
                    LecturerId = classroom.LecturerId,
                    ClassroomId = classroom.Id,
                    Filename = faker.System.FileName("pdf"),
                    FileUrl = $"https://example.com/files/{faker.Random.Guid()}",
                    Description = faker.Lorem.Sentence(),
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-faker.Random.Int(1, 30))
                });
            }
        }
        return list;
    }

    /// <summary>
    /// Discussion issues: AuthorId is a student enrolled in the classroom OR the classroom's lecturer.
    /// RefProblemId references a problem used in that classroom's exams.
    /// </summary>
    private List<DiscussionIssue> SeedDiscussionIssues(
        List<Classroom> classrooms,
        Dictionary<string, List<string>> enrollmentsByClassroom,
        Dictionary<string, List<Examination>> examsByClassroom)
    {
        var faker = new Faker();
        var list = new List<DiscussionIssue>();
        foreach (var classroom in classrooms.Take(3))
        {
            var classMembers = new List<string> { classroom.LecturerId };
            if (enrollmentsByClassroom.TryGetValue(classroom.Id, out var enrolled))
                classMembers.AddRange(enrolled);

            var classProblemIds = new List<string>();
            if (examsByClassroom.TryGetValue(classroom.Id, out var exams))
                classProblemIds = exams.SelectMany(e => e.Problems).Select(p => p.ProblemId).Distinct().ToList();

            for (var i = 0; i < faker.Random.Int(2, 4); i++)
            {
                list.Add(new DiscussionIssue
                {
                    Id = Guid.NewGuid().ToString(),
                    ClassroomId = classroom.Id,
                    Title = faker.Lorem.Sentence(),
                    AuthorId = faker.PickRandom(classMembers),
                    Content = faker.Lorem.Paragraph(),
                    RefProblemId = classProblemIds.Count > 0 ? faker.PickRandom(classProblemIds) : string.Empty,
                    Status = faker.PickRandom(DiscussionIssueStatus.OPEN, DiscussionIssueStatus.CLOSED),
                    ViewCount = faker.Random.Int(0, 50),
                    IsDeleted = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-faker.Random.Int(1, 20)),
                    UpdatedDate = DateTime.UtcNow,
                    Comments = new List<Comment>(),
                    Attachments = Array.Empty<string>()
                });
            }
        }
        return list;
    }

    // ───────────────────────────── Helpers ─────────────────────────────

    private static string? GetTableName(Dictionary<string, Type> tableMap, string entityName)
    {
        var pair = tableMap.FirstOrDefault(kv => kv.Value.Name == entityName);
        return pair.Key;
    }

    private async Task<int> PutAllAsync<T>(
        string? tableName, List<T> items,
        Func<T, Dictionary<string, AttributeValue>> mapper,
        CancellationToken ct)
    {
        if (string.IsNullOrEmpty(tableName) || items.Count == 0) return 0;

        foreach (var entity in items)
        {
            await _dynamoDb.PutItemAsync(new PutItemRequest
            {
                TableName = tableName,
                Item = mapper(entity)
            }, ct);
        }

        return items.Count;
    }
}
