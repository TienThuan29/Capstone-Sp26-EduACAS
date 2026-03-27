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

        // 0) Programming Languages
        seeded += await SeedProgrammingLanguagesAsync(tables, ct);
        var languages = await GetExistingLanguagesAsync(tableMap, ct);
        var roundRobinIdx = 0;

        // 1) Users
        seeded += await SeedUsersAsync(ct);

        // 2) Subjects
        var subjectDtos = LoadJson<SubjectDto>("subjects.json");
        var subjects = subjectDtos.Select(s => new Subject
        {
            Id = s.Id, SubjectCode = s.SubjectCode, SubjectName = s.SubjectName,
            Description = s.Description ?? string.Empty, CreatedBy = s.CreatedBy,
            IsDeleted = false, CreatedDate = now.AddMonths(-6), UpdatedDate = now
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Subject)),
            subjects, Repositories.Subject.DynamoMapper.SubjectToDynamoItem, ct);

        // 3) Problems
        var problemDtos = LoadJson<ProblemDto>("problems.json");
        var problems = problemDtos.Select(dto =>
        {
            var difficulty = Enum.TryParse<Difficulty>(dto.Difficulty, true, out var d) ? d : Difficulty.EASY;
            return new Problem
            {
                Id = dto.Id, LecturerId = dto.LecturerId, Title = dto.Title,
                Content = dto.Content, FileName = null, Difficulty = difficulty,
                CodeTemplates = new Dictionary<string, string> { ["default"] = dto.CodeTemplate ?? "" },
                CreatedDate = now.AddMonths(-3), UpdatedDate = now,
                Tags = dto.Tags ?? Array.Empty<string>(), IsDeleted = false,
                TestCases = (dto.TestCases ?? new()).Select(tc => new TestCase
                {
                    Id = tc.Id ?? Guid.NewGuid().ToString(), ProblemId = dto.Id,
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
            Id = c.Id, ClassCode = c.ClassCode, ClassName = c.ClassName,
            LecturerId = c.LecturerId, SubjectId = c.SubjectId,
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
            Id = e.Id, ClassId = e.ClassId, StudentId = e.StudentId,
            JoinedDate = now.AddDays(-30), MovedOutDate = null, IsJoining = true
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(ClassEnrollment)),
            enrollments, Repositories.ClassroomEnrollment.DynamoMapper.ToDynamoItem, ct);

        // 6) Examinations — inject programmingLanguageId at runtime
        var examDtos = LoadJson<ExaminationDto>("examinations.json");
        var examinations = new List<Examination>();
        foreach (var e in examDtos)
        {
            var langId = ResolveLangId(e.ProgrammingLanguageId, languages, ref roundRobinIdx);
            var status = Enum.TryParse<Status>(e.Status, true, out var st) ? st : Status.ONGOING;
            var mode = Enum.TryParse<Mode>(e.Mode, true, out var m) ? m : Mode.EXAMINATION;
            examinations.Add(new Examination
            {
                Id = e.Id, ExamName = e.ExamName, ProgrammingLanguageId = langId,
                ClassroomId = e.ClassroomId, Description = e.Description ?? "",
                TotalMark = e.TotalMark, Status = status, Mode = mode,
                IsPublicResult = true, IsDeleted = false,
                StartDatetime = now.AddDays(-7), EndDatetime = now.AddDays(30),
                CreatedDate = now.AddDays(-14), UpdatedDate = now,
                Problems = (e.Problems ?? new()).Select(p => new ExaminationProblem
                {
                    ProblemId = p.ProblemId, Mark = p.Mark
                }).ToList()
            });
        }
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Examination)),
            examinations, Repositories.Examination.DynamoMapper.ExaminationToDynamoItem, ct);

        // Build exam lookup for submission language injection
        var examLangMap = examinations.ToDictionary(e => e.Id, e => e.ProgrammingLanguageId);

        // 7) Submissions — inject languageId from its exam
        var submDtos = LoadJson<SubmissionDto>("submissions.json");
        submDtos.AddRange(LoadJson<SubmissionDto>("test-submissions.json"));
        submDtos.AddRange(LoadJson<SubmissionDto>("extra-submissions.json"));
        var submissions = submDtos.Select(s => new Submission
        {
            Id = s.Id, StudentId = s.StudentId, ExamId = s.ExamId,
            ProblemId = s.ProblemId,
            LanguageId = examLangMap.GetValueOrDefault(s.ExamId, languages.Count > 0 ? languages[0].Id : ""),
            CompilerId = "default", Source = s.Source ?? "", Version = s.Version > 0 ? s.Version : 1,
            SubmittedDate = now.AddHours(-2), FinalScore = s.FinalScore,
            Status = SubmissionStatus.GRADED, GradedDate = now.AddHours(-1),
            RegradingRequestId = "", LecturerFeedback = "", AiFeedback = "",
            UpdatedDate = now.AddHours(-2), 
            TestResults = (s.TestResults ?? new()).Select(tr => new TestResult
            {
                Id = tr.Id ?? Guid.NewGuid().ToString(),
                TestcaseId = tr.TestcaseId ?? "",
                Input = tr.Input ?? "",
                ActualOutput = tr.ActualOutput ?? "",
                ExpectedOutput = tr.ExpectedOutput ?? "",
                ExecutionTimeMs = tr.ExecutionTimeMs,
                Status = Enum.TryParse<TestcaseStatus>(tr.Status, true, out var ts) ? ts : TestcaseStatus.SUCCESS,
                CreatedDate = now.AddHours(-1)
            }).ToList()
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Submission)),
            submissions, Repositories.Submission.DynamoMapper.SubmissionToDynamoItem, ct);

        // 8) Slots
        var slotDtos = LoadJson<SlotDto>("slots.json");
        var slots = slotDtos.Select(s => new Slot
        {
            Id = s.Id, ClassroomId = s.ClassroomId, SlotNumber = s.SlotNumber ?? "1",
            Title = s.Title ?? "", Description = s.Description ?? "",
            CreatedDate = now.AddMonths(-1), UpdatedDate = now,
            ExaminationIds = s.ExaminationIds ?? new List<string>()
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(Slot)),
            slots, Repositories.Slot.DynamoMapper.SlotToDynamoItem, ct);

        // 9) Materials
        var materialDtos = LoadJson<MaterialDto>("materials.json");
        var materials = materialDtos.Select(m => new Material
        {
            Id = m.Id, LecturerId = m.LecturerId, ClassroomId = m.ClassroomId,
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
            return new DiscussionIssue
            {
                Id = d.Id, ClassroomId = d.ClassroomId, Title = d.Title ?? "",
                AuthorId = d.AuthorId, Content = d.Content ?? "",
                RefProblemId = d.RefProblemId ?? "", Status = status,
                ViewCount = d.ViewCount, IsDeleted = false,
                CreatedDate = now.AddDays(-10), UpdatedDate = now,
                Comments = MapComments(d.Comments, d.Id, now),
                Attachments = Array.Empty<string>()
            };
        }).ToList();
        seeded += await PutAllAsync(GetTableName(tableMap, nameof(DiscussionIssue)),
            discussions, Repositories.DiscussionIssue.DynamoMapper.DiscussionIssueToDynamoItem, ct);

        return seeded;
    }

    // ───────────────────────────── User seeding ─────────────────────────────

    private async Task<int> SeedProgrammingLanguagesAsync(
        IReadOnlyList<(string TableName, Type EntityType)> tables, 
        CancellationToken ct)
    {
        var tableMap = tables.ToDictionary(t => t.TableName, t => t.EntityType);
        var tableName = GetTableName(tableMap, nameof(ProgrammingLanguage));
        if (string.IsNullOrEmpty(tableName)) return 0;

        // 1. Tìm và xóa các record bắt đầu bằng __ và kết thúc bằng __
        var existing = await GetExistingLanguagesAsync(tableMap, ct);
        var underscoredIds = existing.Where(l => l.Id.StartsWith("__") && l.Id.EndsWith("__")).Select(l => l.Id).ToList();
        
        foreach (var id in underscoredIds)
        {
            await _dynamoDb.DeleteItemAsync(new DeleteItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue> { { PartitionKeyName, new AttributeValue { S = id } } }
            }, ct);
            _logger.LogInformation("Đã xóa ngôn ngữ rác: {Id}", id);
        }

        // 2. Chỉ nạp các ngôn ngữ chưa tồn tại
        var dtos = LoadJson<ProgrammingLanguageDto>("programming-languages.json");
        var languagesToSeed = dtos.Where(d => !existing.Any(e => e.Id == d.Id)).Select(d => new Models.ProgrammingLanguage
        {
            Id = d.Id,
            Name = d.Name,
            Monaco = d.Monaco,
            Extensions = d.Extensions,
            Status = Enum.TryParse<PLStatus>(d.Status, true, out var st) ? st : PLStatus.DISABLE,
            CreatedDate = DateTime.UtcNow.AddYears(-1),
            UpdatedDate = DateTime.UtcNow
        }).ToList();

        if (languagesToSeed.Count == 0) return 0;

        return await PutAllAsync(tableName, languagesToSeed, Repositories.ProgrammingLanguage.DynamoMapper.ProgrammingLanguageToDynamoItem, ct);
    }

    private async Task<int> SeedUsersAsync(CancellationToken ct)
    {
        var userTableName = _configuration["Dev:UserTableName"] ?? "acas-users";
        var secretKey = _configuration["Dev:HashingSecretKey"]
            ?? throw new InvalidOperationException("Dev:HashingSecretKey is not configured");

        var userDtos = LoadJson<UserDto>("users.json");
        var now = DateTime.UtcNow;

        foreach (var u in userDtos)
        {
            var hashedPassword = HashPassword(u.Password ?? "123456", secretKey);
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new() { S = u.Id },
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

    private string ResolveLangId(
        string? marker, List<(string Id, string Name)> languages, ref int roundRobinIdx)
    {
        if (languages.Count == 0) return "";

        if (string.IsNullOrEmpty(marker))
            return languages[roundRobinIdx++ % languages.Count].Id;

        if (marker.StartsWith("__") && marker.EndsWith("__"))
        {
            var hint = marker.Trim('_').ToLowerInvariant();
            var match = languages.FirstOrDefault(l => l.Name.ToLowerInvariant().Contains(hint));
            if (!string.IsNullOrEmpty(match.Id)) return match.Id;
            _logger.LogWarning("No language match for marker '{Marker}'; using round-robin", marker);
            return languages[roundRobinIdx++ % languages.Count].Id;
        }

        return marker;
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

    private static List<Comment> MapComments(List<CommentDto>? dtos, string issueId, DateTime baseTime)
    {
        if (dtos == null || dtos.Count == 0) return new List<Comment>();
        return dtos.Select((c, i) => new Comment
        {
            Id = c.Id, IssueId = issueId, AuthorId = c.AuthorId,
            Content = c.Content ?? "", Attachments = Array.Empty<string>(),
            UpVoteCount = c.UpVoteCount, IsDeleted = false,
            CreatedDate = baseTime.AddDays(-9).AddHours(i),
            UpdatedDate = baseTime.AddDays(-9).AddHours(i),
            Replies = MapComments(c.Replies, issueId, baseTime.AddDays(-8))
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

    private sealed class ProgrammingLanguageDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Monaco { get; set; } = "";
        public List<string> Extensions { get; set; } = new();
        public string Status { get; set; } = "DISABLE";
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
