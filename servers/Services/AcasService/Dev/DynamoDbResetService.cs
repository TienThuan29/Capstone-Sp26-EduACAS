using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AcasService.Models;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AcasService.Dev;

public class DynamoDbResetService : IDynamoDbResetService
{
    private const int BatchWriteLimit = 25;
    private const string PartitionKeyName = "id";
    private static readonly string SeedDataPath = Path.Combine(AppContext.BaseDirectory, "Dev", "seed-data");

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";

        var totalWiped = 0;
        foreach (var (tableName, _) in tablesToWipe)
            totalWiped += await SafeWipeTableAsync(tableName, cancellationToken);
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

    public async Task<ResetResult> ResetAndSeedQuizDataAsync(CancellationToken cancellationToken = default)
    {
        var tables = DiscoverTableNames();
        if (tables.Count == 0)
        {
            _logger.LogWarning("No DynamoDB tables discovered for quiz data reset");
            return new ResetResult(true, 0, 0);
        }

        var targetEntityTypes = new[] { typeof(Question), typeof(AnswerOption), typeof(Quiz) };
        var tablesToWipe = tables
            .Where(t => targetEntityTypes.Contains(t.EntityType))
            .ToList();

        if (tablesToWipe.Count == 0)
        {
            _logger.LogWarning("No target tables found for quiz-related reset");
            return new ResetResult(true, 0, 0);
        }

        var totalWiped = 0;
        foreach (var (tableName, _) in tablesToWipe)
            totalWiped += await SafeWipeTableAsync(tableName, cancellationToken);

        try
        {
            var tableMap = tables.ToDictionary(t => t.TableName, t => t.EntityType);
            var seedIdMap = await BuildQuizForeignKeyMapFromDynamoAsync(tableMap, cancellationToken);
            var seeded = await SeedQuizQuestionAnswerOptionAsync(
                tableMap, DateTime.UtcNow, seedIdMap, cancellationToken);
            _logger.LogInformation("Seeded quiz-related data with {Count} items", seeded);
            return new ResetResult(true, tablesToWipe.Count, seeded);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Quiz data seed failed after wipe");
            return new ResetResult(false, tablesToWipe.Count, 0, ex.Message);
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
        var now = DateTime.UtcNow;
        var seedIdMap = new Dictionary<string, string>(StringComparer.Ordinal);

        // Programming languages: read only from DynamoDB (table is not wiped by reset).
        var languages = await GetExistingLanguagesAsync(tableMap, ct);
        if (languages.Count == 0)
            _logger.LogWarning("No programming languages in DynamoDB; exam/submission language fields may be empty");
        var roundRobinIdx = 0;

        // 1) Users
        seeded += await SeedUsersAsync(seedIdMap, ct);

        // 2) Subjects
        var subjectDtos = LoadJson<SubjectDto>("subjects.json");
        var subjects = subjectDtos.Select(s => new Subject
        {
            Id = AllocateSeedId(seedIdMap, s.Id),
            SubjectCode = s.SubjectCode, SubjectName = s.SubjectName,
            Description = s.Description ?? string.Empty,
            CreatedBy = RemapSeedId(seedIdMap, s.CreatedBy, "subject.createdBy"),
            IsDeleted = false, CreatedDate = now.AddMonths(-6), UpdatedDate = now
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Subject)),
            subjects, Repositories.Subject.DynamoMapper.SubjectToDynamoItem, ct);

        seeded += await SeedQuizQuestionAnswerOptionAsync(tableMap, now, seedIdMap, ct);

        // 3) Problems
        var problemDtos = LoadJson<ProblemDto>("problems.json");
        var problems = problemDtos.Select(dto =>
        {
            var newProblemId = AllocateSeedId(seedIdMap, dto.Id);
            var difficulty = Enum.TryParse<Difficulty>(dto.Difficulty, true, out var d) ? d : Difficulty.EASY;
            return new Problem
            {
                Id = newProblemId,
                LecturerId = RemapSeedId(seedIdMap, dto.LecturerId, "problem.lecturerId"),
                Title = dto.Title,
                Content = dto.Content, FileName = null, Difficulty = difficulty,
                CodeTemplates = new Dictionary<string, string> { ["default"] = dto.CodeTemplate ?? "" },
                CreatedDate = now.AddMonths(-3), UpdatedDate = now,
                Tags = dto.Tags ?? Array.Empty<string>(), IsDeleted = false,
                TestCases = (dto.TestCases ?? new()).Select(tc => new TestCase
                {
                    Id = string.IsNullOrEmpty(tc.Id) ? Guid.NewGuid().ToString() : AllocateSeedId(seedIdMap, tc.Id!),
                    ProblemId = newProblemId,
                    InputData = tc.Input ?? "", ExpectedOutput = tc.ExpectedOutput ?? "",
                    IsPublic = tc.IsPublic, IsCaseInsensitive = tc.IsCaseInsensitive,
                    IsFloatingPoint = tc.IsFloatingPoint, FloatingPointTolerance = tc.FloatingPointTolerance,
                    DecimalPlaces = tc.DecimalPlaces, IsTokenComparision = tc.IsTokenComparision,
                    IsNotOrderedComparision = tc.IsNotOrderedComparision, IsDeleted = false
                }).ToList()
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Problem)),
            problems, Repositories.Problem.DynamoMapper.ProblemToDynamoItem, ct);

        // 4) Classrooms
        var classroomDtos = LoadJson<ClassroomDto>("classrooms.json");
        var classrooms = classroomDtos.Select(c => new Classroom
        {
            Id = AllocateSeedId(seedIdMap, c.Id),
            ClassCode = c.ClassCode, ClassName = c.ClassName,
            LecturerId = RemapSeedId(seedIdMap, c.LecturerId, "classroom.lecturerId"),
            SubjectId = RemapSeedId(seedIdMap, c.SubjectId, "classroom.subjectId"),
            SemesterName = c.SemesterName ?? "Spring 2026", EnrolKey = c.EnrolKey ?? "",
            MaxSlot = c.MaxSlot, CreatedDate = now.AddMonths(-2),
            UpdatedDate = now, EndDate = now.AddMonths(4), IsDeleted = false
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Classroom)),
            classrooms, Repositories.Classroom.DynamoMapper.ClassroomToDynamoItem, ct);

        // 5) Enrollments
        var enrollmentDtos = LoadJson<EnrollmentDto>("enrollments.json");
        var enrollments = enrollmentDtos.Select(e => new ClassEnrollment
        {
            Id = AllocateSeedId(seedIdMap, e.Id),
            ClassId = RemapSeedId(seedIdMap, e.ClassId, "enrollment.classId"),
            StudentId = RemapSeedId(seedIdMap, e.StudentId, "enrollment.studentId"),
            JoinedDate = now.AddDays(-30), MovedOutDate = null, IsJoining = true
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(ClassEnrollment)),
            enrollments, Repositories.ClassroomEnrollment.DynamoMapper.ToDynamoItem, ct);

        // 6) Examinations — programmingLanguageId only from DynamoDB rows
        var examDtos = LoadJson<ExaminationDto>("examinations.json");
        var examinations = new List<Examination>();
        foreach (var e in examDtos)
        {
            var langId = ResolveLangId(e.ProgrammingLanguageId, languages, ref roundRobinIdx);
            var status = Enum.TryParse<Status>(e.Status, true, out var st) ? st : Status.ONGOING;
            var mode = Enum.TryParse<Mode>(e.Mode, true, out var m) ? m : Mode.EXAMINATION;
            examinations.Add(new Examination
            {
                Id = AllocateSeedId(seedIdMap, e.Id),
                ExamName = e.ExamName, ProgrammingLanguageId = langId,
                ClassroomId = RemapSeedId(seedIdMap, e.ClassroomId, "examination.classroomId"),
                Description = e.Description ?? "",
                TotalMark = e.TotalMark, Status = status, Mode = mode,
                IsPublicResult = true, IsDeleted = false,
                MaxAttempts = null,
                StartDatetime = now.AddDays(-7), EndDatetime = now.AddDays(30),
                CreatedDate = now.AddDays(-14), UpdatedDate = now,
                Problems = (e.Problems ?? new()).Select(p => new ExaminationProblem
                {
                    ProblemId = RemapSeedId(seedIdMap, p.ProblemId, "examination.problemId"),
                    Mark = p.Mark
                }).ToList()
            });
        }
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Examination)),
            examinations, Repositories.Examination.DynamoMapper.ExaminationToDynamoItem, ct);

        var examLangMap = examinations.ToDictionary(e => e.Id, e => e.ProgrammingLanguageId);

        // 7) Submissions — languageId from resolved exam language (DynamoDB-only)
        var submDtos = LoadJson<SubmissionDto>("submissions.json");
        submDtos.AddRange(LoadJson<SubmissionDto>("test-submissions.json"));
        submDtos.AddRange(LoadJson<SubmissionDto>("extra-submissions.json"));
        var submissions = submDtos.Select(s =>
        {
            var examId = RemapSeedId(seedIdMap, s.ExamId, "submission.examId");
            var defaultLang = languages.Count > 0 ? languages[0].Id : "";
            return new Submission
            {
                Id = AllocateSeedId(seedIdMap, s.Id),
                StudentId = RemapSeedId(seedIdMap, s.StudentId, "submission.studentId"),
                ExamId = examId,
                ProblemId = RemapSeedId(seedIdMap, s.ProblemId, "submission.problemId"),
                LanguageId = examLangMap.GetValueOrDefault(examId, defaultLang),
                CompilerId = "default", Source = s.Source ?? "", Version = s.Version > 0 ? s.Version : 1,
                SubmittedDate = now.AddHours(-2), FinalScore = s.FinalScore,
                Status = SubmissionStatus.GRADED, GradedDate = now.AddHours(-1),
                RegradingRequestId = "", LecturerFeedback = "", AiFeedback = "",
                UpdatedDate = now.AddHours(-2),
                TestResults = (s.TestResults ?? new()).Select(tr => new TestResult
                {
                    Id = Guid.NewGuid().ToString(),
                    TestcaseId = string.IsNullOrEmpty(tr.TestcaseId)
                        ? ""
                        : RemapSeedId(seedIdMap, tr.TestcaseId, "submission.testcaseId"),
                    Input = tr.Input ?? "",
                    ActualOutput = tr.ActualOutput ?? "",
                    ExpectedOutput = tr.ExpectedOutput ?? "",
                    ExecutionTimeMs = tr.ExecutionTimeMs,
                    Status = Enum.TryParse<TestcaseStatus>(tr.Status, true, out var ts) ? ts : TestcaseStatus.SUCCESS,
                    CreatedDate = now.AddHours(-1)
                }).ToList()
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Submission)),
            submissions, Repositories.Submission.DynamoMapper.SubmissionToDynamoItem, ct);

        // 8) Slots
        var slotDtos = LoadJson<SlotDto>("slots.json");
        var slots = slotDtos.Select(s => new Slot
        {
            Id = AllocateSeedId(seedIdMap, s.Id),
            ClassroomId = RemapSeedId(seedIdMap, s.ClassroomId, "slot.classroomId"),
            SlotNumber = s.SlotNumber ?? "1",
            Title = s.Title ?? "", Description = s.Description ?? "",
            CreatedDate = now.AddMonths(-1), UpdatedDate = now,
            ExaminationIds = (s.ExaminationIds ?? new List<string>())
                .Select(eid => RemapSeedId(seedIdMap, eid, "slot.examinationId"))
                .ToList()
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Slot)),
            slots, Repositories.Slot.DynamoMapper.SlotToDynamoItem, ct);

        // 9) Materials
        var materialDtos = LoadJson<MaterialDto>("materials.json");
        var materials = materialDtos.Select(m => new Material
        {
            Id = AllocateSeedId(seedIdMap, m.Id),
            LecturerId = RemapSeedId(seedIdMap, m.LecturerId, "material.lecturerId"),
            ClassroomId = RemapSeedId(seedIdMap, m.ClassroomId, "material.classroomId"),
            Filename = m.Filename ?? "", FileUrl = m.FileUrl ?? "",
            Description = m.Description ?? "", IsDeleted = false,
            CreatedDate = now.AddDays(-14)
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Material)),
            materials, Repositories.Material.DynamoMapper.MaterialToDynamoItem, ct);

        // 10) Discussion Issues
        var discDtos = LoadJson<DiscussionDto>("discussions.json");
        var discussions = discDtos.Select(d =>
        {
            var status = Enum.TryParse<DiscussionIssueStatus>(d.Status, true, out var s)
                ? s : DiscussionIssueStatus.OPEN;
            var newIssueId = AllocateSeedId(seedIdMap, d.Id);
            return new DiscussionIssue
            {
                Id = newIssueId,
                ClassroomId = RemapSeedId(seedIdMap, d.ClassroomId, "discussion.classroomId"),
                Title = d.Title ?? "",
                AuthorId = RemapSeedId(seedIdMap, d.AuthorId, "discussion.authorId"),
                Content = d.Content ?? "",
                RefProblemId = string.IsNullOrEmpty(d.RefProblemId)
                    ? ""
                    : RemapSeedId(seedIdMap, d.RefProblemId, "discussion.refProblemId"),
                Status = status,
                ViewCount = d.ViewCount, IsDeleted = false,
                CreatedDate = now.AddDays(-10), UpdatedDate = now,
                Comments = MapComments(d.Comments, newIssueId, seedIdMap, now),
                Attachments = Array.Empty<string>()
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(DiscussionIssue)),
            discussions, Repositories.DiscussionIssue.DynamoMapper.DiscussionIssueToDynamoItem, ct);

        // 11) Academic Warnings
        var warningDtos = LoadJson<AcademicWarningDto>("academic-warnings.json");
        var warnings = warningDtos.Select(w =>
        {
            var triggerType = Enum.TryParse<AcademicWarningTriggerType>(w.TriggerType, true, out var t)
                ? t : AcademicWarningTriggerType.SINGLE_EXAM_LOW_SCORE;
            return new AcademicWarning
            {
                Id = AllocateSeedId(seedIdMap, w.Id),
                ClassroomId = RemapSeedId(seedIdMap, w.ClassroomId, "warning.classroomId"),
                StudentId = RemapSeedId(seedIdMap, w.StudentId, "warning.studentId"),
                WarningLevel = w.WarningLevel,
                TriggerType = triggerType,
                SentDate = w.SentDate,
                IsRead = w.IsRead,
                CreatedDate = now,
                UpdatedDate = now,
                InvolvedExams = new InvolvedExamsInfo(),
                LlmAnalysis = new Dictionary<string, AcademicWarningAnalysisEntry>(),
                LecturerAnalysis = new Dictionary<string, AcademicWarningAnalysisEntry>()
            };
        }).ToList();
        var academicWarningTable = tables.FirstOrDefault(t => t.EntityType == typeof(AcademicWarning)).TableName;
        if (!string.IsNullOrEmpty(academicWarningTable))
        {
            seeded += await PutAllAsync(academicWarningTable,
                warnings, Repositories.AcademicWarning.DynamoMapper.AcademicWarningToDynamoItem, ct);
        }

        return seeded;
    }

    // ───────────────────────────── User seeding ─────────────────────────────
    private async Task<int> SeedUsersAsync(Dictionary<string, string> seedIdMap, CancellationToken ct)
    {
        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";
        var secretKey = _configuration["Dev:HashingSecretKey"]
            ?? throw new InvalidOperationException("Dev:HashingSecretKey is not configured");

        var userDtos = LoadJson<UserDto>("users.json");
        var now = DateTime.UtcNow;

        foreach (var u in userDtos)
        {
            var userId = AllocateSeedId(seedIdMap, u.Id);
            var hashedPassword = HashPassword(u.Password ?? "123456", secretKey);
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new() { S = userId },
                ["roleNumber"] = new() { S = u.RoleNumber ?? "" },
                ["email"] = new() { S = u.Email ?? "" },
                ["password"] = new() { S = hashedPassword },
                ["fullname"] = new() { S = u.Fullname ?? "" },
                ["avatarUrl"] = new() { S = "" },
                ["googleId"] = new() { S = "" },
                ["role"] = new() { S = u.Role ?? "STUDENT" },
                ["isEnable"] = new() { BOOL = true },
                ["firstLogin"] = new() { BOOL = false },
                ["createdDate"] = new() { S = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") },
                ["updatedDate"] = new() { S = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
            };
            await _dynamoDb.PutItemAsync(new PutItemRequest { TableName = userTableName, Item = item }, ct);
        }

        _logger.LogInformation("Seeded {Count} users from users.json", userDtos.Count);
        return userDtos.Count;
    }

    private static string HashPassword(string password, string secretKey)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    // ───────────────────────────── JSON loader ─────────────────────────────

    private List<T> LoadJson<T>(string filename)
    {
        var path = Path.Combine(SeedDataPath, filename);
        if (!File.Exists(path))
        {
            _logger.LogWarning("Seed file {File} not found at {Path}; skipping", filename, path);
            return new List<T>();
        }

        var json = File.ReadAllText(path);
        var items = JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
        if (items == null || items.Count == 0)
        {
            _logger.LogWarning("Seed file {File} is empty or invalid", filename);
            return new List<T>();
        }

        _logger.LogInformation("Loaded {Count} items from {File}", items.Count, filename);
        return items;
    }

    // ───────────────────────────── Helpers ─────────────────────────────

    private async Task<List<(string Id, string Name)>> GetExistingLanguagesAsync(
        Dictionary<string, Type> tableMap, CancellationToken ct)
    {
        var tableName = GetTableName(tableMap, nameof(ProgrammingLanguage));
        if (string.IsNullOrEmpty(tableName)) return new List<(string, string)>();

        var results = new List<(string Id, string Name)>();
        var request = new ScanRequest
        {
            TableName = tableName,
            ProjectionExpression = "#pk, #nm",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#pk"] = PartitionKeyName,
                ["#nm"] = "name"
            }
        };

        ScanResponse response;
        do
        {
            response = await _dynamoDb.ScanAsync(request, ct);
            foreach (var item in response.Items)
            {
                var id = item.TryGetValue(PartitionKeyName, out var idAv) ? idAv.S : "";
                var name = item.TryGetValue("name", out var nameAv) ? nameAv.S : "";
                if (!string.IsNullOrEmpty(id))
                    results.Add((id, name));
            }
            request.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

        _logger.LogInformation("Found {Count} programming languages: {Names}",
            results.Count, string.Join(", ", results.Select(l => l.Name)));
        return results;
    }

    /// <summary>
    /// Maps seed JSON ids for users/subjects to current DynamoDB partition keys so quiz-only reset
    /// still points at existing rows after a full seed assigned random UUIDs.
    /// </summary>
    private async Task<Dictionary<string, string>> BuildQuizForeignKeyMapFromDynamoAsync(
        Dictionary<string, Type> tableMap, CancellationToken ct)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);

        var subjectTable = GetTableName(tableMap, nameof(Subject));
        if (!string.IsNullOrEmpty(subjectTable))
        {
            var codeToId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var request = new ScanRequest
            {
                TableName = subjectTable,
                ProjectionExpression = "#pk, #sc",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#pk"] = PartitionKeyName,
                    ["#sc"] = "subjectCode"
                }
            };

            ScanResponse response;
            do
            {
                response = await _dynamoDb.ScanAsync(request, ct);
                foreach (var item in response.Items)
                {
                    var id = item.TryGetValue(PartitionKeyName, out var idAv) ? idAv.S : "";
                    var code = item.TryGetValue("subjectCode", out var cAv) ? cAv.S : "";
                    if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(code))
                        codeToId[code] = id;
                }
                request.ExclusiveStartKey = response.LastEvaluatedKey;
            } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

            foreach (var s in LoadJson<SubjectDto>("subjects.json"))
            {
                if (codeToId.TryGetValue(s.SubjectCode, out var dynamoId))
                    map[s.Id] = dynamoId;
            }
        }

        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";
        var emailToId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var userScan = new ScanRequest
        {
            TableName = userTableName,
            ProjectionExpression = "#pk, #em",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#pk"] = PartitionKeyName,
                ["#em"] = "email"
            }
        };

        ScanResponse userResponse;
        do
        {
            userResponse = await _dynamoDb.ScanAsync(userScan, ct);
            foreach (var item in userResponse.Items)
            {
                var id = item.TryGetValue(PartitionKeyName, out var idAv) ? idAv.S : "";
                var email = item.TryGetValue("email", out var eAv) ? eAv.S : "";
                if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(email))
                    emailToId[email] = id;
            }
            userScan.ExclusiveStartKey = userResponse.LastEvaluatedKey;
        } while (userResponse.LastEvaluatedKey != null && userResponse.LastEvaluatedKey.Count > 0);

        foreach (var u in LoadJson<UserDto>("users.json"))
        {
            if (!string.IsNullOrEmpty(u.Email) && emailToId.TryGetValue(u.Email, out var dynamoId))
                map[u.Id] = dynamoId;
        }

        return map;
    }

    private string ResolveLangId(
        string? marker, List<(string Id, string Name)> languages, ref int roundRobinIdx)
    {
        if (languages.Count == 0) return "";

        if (string.IsNullOrWhiteSpace(marker))
            return languages[roundRobinIdx++ % languages.Count].Id;

        var byId = languages.FirstOrDefault(l => l.Id == marker);
        if (!string.IsNullOrEmpty(byId.Id)) return byId.Id;

        if (marker.StartsWith("__") && marker.EndsWith("__"))
        {
            var hint = marker.Trim('_').ToLowerInvariant();
            var match = languages.FirstOrDefault(l => l.Name.ToLowerInvariant().Contains(hint));
            if (!string.IsNullOrEmpty(match.Id)) return match.Id;
            _logger.LogWarning("No DynamoDB language match for marker '{Marker}'; using round-robin", marker);
            return languages[roundRobinIdx++ % languages.Count].Id;
        }

        var m = marker.Trim();
        var byName = languages.FirstOrDefault(l =>
            l.Name.Contains(m, StringComparison.OrdinalIgnoreCase)
            || LanguageHintMatchesStoredName(l.Name, m));
        if (!string.IsNullOrEmpty(byName.Id)) return byName.Id;

        _logger.LogWarning("No DynamoDB language match for '{Marker}'; using round-robin", marker);
        return languages[roundRobinIdx++ % languages.Count].Id;
    }

    /// <summary>Maps seed hints like "csharp" to DynamoDB language display names (e.g. C#).</summary>
    private static bool LanguageHintMatchesStoredName(string storedName, string seedHint)
    {
        var n = storedName.ToLowerInvariant().Replace(" ", "");
        var h = seedHint.ToLowerInvariant().Replace(" ", "").Replace("#", "sharp");
        if (h.Length == 0) return false;
        if (n.Contains(h, StringComparison.Ordinal) || h.Contains(n, StringComparison.Ordinal)) return true;
        if ((h is "csharp" or "c#") && (n.Contains("c#", StringComparison.Ordinal) || n.Contains("csharp", StringComparison.Ordinal)))
            return true;
        return false;
    }

    private static string AllocateSeedId(Dictionary<string, string> seedIdMap, string seedKey)
    {
        if (string.IsNullOrEmpty(seedKey))
            return Guid.NewGuid().ToString();

        // Keep original seed ID from JSON to ensure consistency across resets
        // This allows frontend and backend to use the same predictable IDs
        if (!seedIdMap.ContainsKey(seedKey))
        {
            seedIdMap[seedKey] = seedKey;
        }
        return seedIdMap[seedKey];
    }

    private string RemapSeedId(Dictionary<string, string> seedIdMap, string? refKey, string context)
    {
        if (string.IsNullOrEmpty(refKey)) return "";
        if (seedIdMap.TryGetValue(refKey, out var mapped)) return mapped;
        _logger.LogWarning("Seed reference '{RefKey}' has no allocated id ({Context})", refKey, context);
        return refKey;
    }

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

    private async Task<int> SeedQuizQuestionAnswerOptionAsync(
        Dictionary<string, Type> tableMap,
        DateTime now,
        Dictionary<string, string> seedIdMap,
        CancellationToken ct)
    {
        var seeded = 0;

        var questionDtos = LoadJson<QuestionDto>("questions.json");
        var questions = questionDtos.Select(q =>
        {
            var questionType = Enum.TryParse<QuestionType>(q.Type, true, out var parsedType)
                ? parsedType
                : QuestionType.SINGLE_CHOICE;

            return new Question
            {
                Id = AllocateSeedId(seedIdMap, q.Id),
                Content = q.Content,
                ImageUrl = q.ImageUrl,
                Type = questionType,
                TextAnswer = q.TextAnswer,
                IsDeleted = false,
                CreatedBy = RemapSeedId(seedIdMap, q.CreatedBy, "question.createdBy"),
                CreatedAt = now.AddMonths(-2),
                UpdatedAt = now
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Question)),
            questions, Repositories.Question.DynamoMapper.QuestionToDynamoItem, ct);

        var answerOptionDtos = LoadJson<AnswerOptionDto>("answer-options.json");
        var answerOptions = answerOptionDtos.Select(a => new AnswerOption
        {
            Id = AllocateSeedId(seedIdMap, a.Id),
            QuestionId = RemapSeedId(seedIdMap, a.QuestionId, "answerOption.questionId"),
            Content = a.Content,
            IsCorrect = a.IsCorrect,
            CreatedAt = now.AddMonths(-2),
            UpdatedAt = now
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(AnswerOption)),
            answerOptions, Repositories.AnswerOption.DynamoMapper.AnswerOptionToDynamoItem, ct);

        var quizDtos = LoadJson<QuizDto>("quizzes.json");
        var quizzes = quizDtos.Select(q =>
        {
            var newQuizId = AllocateSeedId(seedIdMap, q.Id);
            var quizQuestions = (q.Questions ?? new List<QuizQuestionDto>())
                .Select(item => new QuizQuestion
                {
                    QuizId = newQuizId,
                    QuestionId = RemapSeedId(seedIdMap, item.QuestionId, "quiz.questionId"),
                    Marks = item.Marks,
                    DisplayOrder = item.DisplayOrder
                })
                .OrderBy(item => item.DisplayOrder)
                .ToList();

            return new Quiz
            {
                Id = newQuizId,
                SubjectId = RemapSeedId(seedIdMap, q.SubjectId, "quiz.subjectId"),
                Title = q.Title,
                Duration = q.Duration,
                TotalQuestions = quizQuestions.Count,
                IsDeleted = false,
                CreatedBy = RemapSeedId(seedIdMap, q.CreatedBy, "quiz.createdBy"),
                CreatedAt = now.AddMonths(-1),
                UpdatedAt = now,
                Questions = quizQuestions
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Quiz)),
            quizzes, Repositories.Quiz.DynamoMapper.QuizToDynamoItem, ct);

        return seeded;
    }

    private List<Comment> MapComments(
        List<CommentDto>? dtos, string remappedIssueId, Dictionary<string, string> seedIdMap, DateTime baseTime)
    {
        if (dtos == null || dtos.Count == 0) return new List<Comment>();
        return dtos.Select((c, i) => new Comment
        {
            Id = AllocateSeedId(seedIdMap, c.Id),
            IssueId = remappedIssueId,
            AuthorId = RemapSeedId(seedIdMap, c.AuthorId, "comment.authorId"),
            Content = c.Content ?? "", Attachments = Array.Empty<string>(),
            UpVoteCount = c.UpVoteCount, IsDeleted = false,
            CreatedDate = baseTime.AddDays(-9).AddHours(i),
            UpdatedDate = baseTime.AddDays(-9).AddHours(i),
            Replies = MapComments(c.Replies, remappedIssueId, seedIdMap, baseTime.AddDays(-8))
        }).ToList();
    }

    // ───────────────────────────── JSON DTOs ─────────────────────────────

    private sealed class UserDto
    {
        public string Id { get; set; } = "";
        public string? RoleNumber { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Fullname { get; set; }
        public string? Role { get; set; }
    }

    private sealed class SubjectDto
    {
        public string Id { get; set; } = "";
        public string SubjectCode { get; set; } = "";
        public string SubjectName { get; set; } = "";
        public string? Description { get; set; }
        public string CreatedBy { get; set; } = "";
    }

    private sealed class ProblemDto
    {
        public string Id { get; set; } = "";
        public string LecturerId { get; set; } = "";
        public string Title { get; set; } = "";
        public string? Difficulty { get; set; }
        public string[]? Tags { get; set; }
        public string? CodeTemplate { get; set; }
        public string? Content { get; set; }
        public List<TestCaseDto>? TestCases { get; set; }
    }

    private sealed class QuestionDto
    {
        public string Id { get; set; } = "";
        public string Content { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string Type { get; set; } = "SINGLE_CHOICE";
        public string? TextAnswer { get; set; }
        public string CreatedBy { get; set; } = "";
    }

    private sealed class AnswerOptionDto
    {
        public string Id { get; set; } = "";
        public string QuestionId { get; set; } = "";
        public string Content { get; set; } = "";
        public bool IsCorrect { get; set; }
    }

    private sealed class QuizDto
    {
        public string Id { get; set; } = "";
        public string SubjectId { get; set; } = "";
        public string Title { get; set; } = "";
        public int Duration { get; set; }
        public string CreatedBy { get; set; } = "";
        public List<QuizQuestionDto>? Questions { get; set; }
    }

    private sealed class QuizQuestionDto
    {
        public string QuestionId { get; set; } = "";
        public double Marks { get; set; }
        public int DisplayOrder { get; set; }
    }

    private sealed class TestCaseDto
    {
        public string? Id { get; set; }
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

    private sealed class ClassroomDto
    {
        public string Id { get; set; } = "";
        public string ClassCode { get; set; } = "";
        public string ClassName { get; set; } = "";
        public string LecturerId { get; set; } = "";
        public string SubjectId { get; set; } = "";
        public string? SemesterName { get; set; }
        public string? EnrolKey { get; set; }
        public int MaxSlot { get; set; }
    }

    private sealed class EnrollmentDto
    {
        public string Id { get; set; } = "";
        public string ClassId { get; set; } = "";
        public string StudentId { get; set; } = "";
    }

    private sealed class ExaminationDto
    {
        public string Id { get; set; } = "";
        public string ExamName { get; set; } = "";
        public string? ProgrammingLanguageId { get; set; }
        public string ClassroomId { get; set; } = "";
        public string? Description { get; set; }
        public float TotalMark { get; set; }
        public string? Status { get; set; }
        public string? Mode { get; set; }
        public int? MaxAttempts { get; set; }
        public List<ExamProblemDto>? Problems { get; set; }
    }

    private sealed class ExamProblemDto
    {
        public string ProblemId { get; set; } = "";
        public float Mark { get; set; }
    }

    private sealed class SubmissionDto
    {
        public string Id { get; set; } = "";
        public string StudentId { get; set; } = "";
        public string ExamId { get; set; } = "";
        public string ProblemId { get; set; } = "";
        public string? Source { get; set; }
        public string? LanguageId { get; set; }
        public int Version { get; set; }
        public float FinalScore { get; set; }
        public List<TestResultDto>? TestResults { get; set; }
    }

    private sealed class TestResultDto
    {
        public string? Id { get; set; }
        public string? TestcaseId { get; set; }
        public string? Input { get; set; }
        public string? ActualOutput { get; set; }
        public string? ExpectedOutput { get; set; }
        public int ExecutionTimeMs { get; set; }
        public string? Status { get; set; }
    }

    private sealed class SlotDto
    {
        public string Id { get; set; } = "";
        public string ClassroomId { get; set; } = "";
        public string? SlotNumber { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public List<string>? ExaminationIds { get; set; }
    }

    private sealed class MaterialDto
    {
        public string Id { get; set; } = "";
        public string LecturerId { get; set; } = "";
        public string ClassroomId { get; set; } = "";
        public string? Filename { get; set; }
        public string? FileUrl { get; set; }
        public string? Description { get; set; }
    }

    private sealed class DiscussionDto
    {
        public string Id { get; set; } = "";
        public string ClassroomId { get; set; } = "";
        public string? Title { get; set; }
        public string AuthorId { get; set; } = "";
        public string? Content { get; set; }
        public string? RefProblemId { get; set; }
        public string? Status { get; set; }
        public int ViewCount { get; set; }
        public List<CommentDto>? Comments { get; set; }
    }

    private sealed class AcademicWarningDto
    {
        public string Id { get; set; } = "";
        public string ClassroomId { get; set; } = "";
        public string StudentId { get; set; } = "";
        public int WarningLevel { get; set; }
        public string TriggerType { get; set; } = "";
        public bool IsRead { get; set; }
        public DateTime SentDate { get; set; }
    }

    private sealed class CommentDto
    {
        public string Id { get; set; } = "";
        public string IssueId { get; set; } = "";
        public string AuthorId { get; set; } = "";
        public string? Content { get; set; }
        public int UpVoteCount { get; set; }
        public List<CommentDto>? Replies { get; set; }
    }
}
