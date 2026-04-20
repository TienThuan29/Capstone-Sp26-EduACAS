# BÁO CÁO YÊU CẦU UNIT TEST — DỰ ÁN EDUACAS

> Phiên bản: 1.0
> Ngày: 17/04/2026
> Mục đích: Tài liệu mô tả toàn bộ case cần test cho các module backend (C#/.NET) và frontend (Next.js/Flutter)

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [AcasService — Utils](#2-acaservice--utils)
3. [AcasService — Jobs](#3-acaservice--jobs)
4. [AcasService — Commands](#4-acaservice--commands)
5. [AcasService — Queries](#5-acaservice--queries)
6. [AcasService — Mappers](#6-acaservice--mappers)
7. [AcasService — Controllers](#7-acaservice--controllers)
8. [AuthService — Utils](#8-authservice--utils)
9. [AuthService — Commands](#9-authservice--commands)
10. [AuthService — Queries](#10-authservice--queries)
11. [AuthService — Controllers](#11-authservice--controllers)
12. [Web App — Utils](#12-web-app--utils)
13. [Web App — Hooks](#13-web-app--hooks)
14. [Mobile App](#14-mobile-app)

---

## 1. TỔNG QUAN HỆ THỐNG

| Module | Công nghệ | Test framework |
|--------|-----------|----------------|
| AcasService (.NET Backend) | .NET 9, C# | xUnit + Moq + FluentAssertions |
| AuthService (.NET Backend) | .NET 9, C# | xUnit + Moq + FluentAssertions |
| ApiGateway | .NET 9 | Không cần unit test |
| Web App (Next.js) | Next.js 16, React 19, TypeScript | Vitest + React Testing Library |
| Mobile App (Flutter) | Flutter, Dart | flutter_test |

---

## 2. ACASSERVICE — UTILS

### 2.1. ResultComparator

**Mục đích:** So sánh kết quả chạy code (output) với kết quả mong đợi (expected output) với nhiều chế độ so sánh khác nhau.

**Các hàm cần test:**

#### `Compare(string expectedOutput, string actualOutput, CompareMode mode)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R (Yes/No)|
|----|----------|---------------|-------------------|--------|--------|---|
| RC-01 | Exact match | expectedOutput = "Hello World", actualOutput = "Hello World", mode = Exact | Trả về `true` | `ResultComparator.Compare()` — Exact mode logic | Pending | Y |
| RC-02 | Exact mismatch | expectedOutput = "Hello World", actualOutput = "Hello World!", mode = Exact | Trả về `false` | `ResultComparator.Compare()` — Exact mode logic | Pending | Y |
| RC-03 | Case insensitive match | expectedOutput = "HELLO", actualOutput = "hello", mode = CaseInsensitive | Trả về `true` | `ResultComparator.Compare()` — CaseInsensitive mode | Pending | Y |
| RC-04 | Case insensitive mismatch | expectedOutput = "HELLO", actualOutput = "world", mode = CaseInsensitive | Trả về `false` | `ResultComparator.Compare()` — CaseInsensitive mode | Pending | Y |
| RC-05 | Floating point within tolerance | expectedOutput = "3.14159", actualOutput = "3.14160", mode = FloatingPoint(tolerance = 0.0001) | Trả về `true` | `ResultComparator.Compare()` — FloatingPoint mode | Pending | Y |
| RC-06 | Floating point outside tolerance | expectedOutput = "3.14", actualOutput = "3.20", mode = FloatingPoint(tolerance = 0.01) | Trả về `false` | `ResultComparator.Compare()` — FloatingPoint mode | Pending | Y |
| RC-07 | Floating point exact | expectedOutput = "3.14", actualOutput = "3.14", mode = FloatingPoint(tolerance = 0.01) | Trả về `true` | `ResultComparator.Compare()` — FloatingPoint mode | Pending | Y |
| RC-08 | Token comparison exact | expectedOutput = "foo bar baz", actualOutput = "foo bar baz", mode = Token | Trả về `true` | `ResultComparator.Compare()` — Token mode | Pending | Y |
| RC-09 | Token comparison different order | expectedOutput = "foo bar baz", actualOutput = "foo baz bar", mode = Token | Trả về `false` | `ResultComparator.Compare()` — Token mode | Pending | Y |
| RC-10 | Token comparison extra token | expectedOutput = "foo bar", actualOutput = "foo bar baz", mode = Token | Trả về `false` | `ResultComparator.Compare()` — Token mode | Pending | Y |
| RC-11 | Unordered comparison exact | expectedOutput = "cat dog bird", actualOutput = "dog bird cat", mode = UnorderedToken | Trả về `true` | `ResultComparator.Compare()` — UnorderedToken mode | Pending | Y |
| RC-12 | Unordered comparison missing token | expectedOutput = "cat dog bird", actualOutput = "cat dog", mode = UnorderedToken | Trả về `false` | `ResultComparator.Compare()` — UnorderedToken mode | Pending | Y |
| RC-13 | Empty expected, empty actual | expectedOutput = "", actualOutput = "", mode = Exact | Trả về `true` | `ResultComparator.Compare()` — boundary null/empty check | Pending | Y |
| RC-14 | Empty expected, non-empty actual | expectedOutput = "", actualOutput = "result", mode = Exact | Trả về `false` | `ResultComparator.Compare()` — boundary null/empty check | Pending | Y |
| RC-15 | Whitespace handling | expectedOutput = "Hello   World", actualOutput = "Hello World", mode = Exact | Tùy spec — trả về `false` (hoặc `true` nếu normalize) | `ResultComparator.Compare()` — whitespace normalization | Pending | Y |
| RC-16 | Null expected | expectedOutput = null, actualOutput = "result", mode = Exact | Ném exception hoặc trả về `false` | `ResultComparator.Compare()` — null guard | Pending | Y |
| RC-17 | Null actual | expectedOutput = "expected", actualOutput = null, mode = Exact | Ném exception hoặc trả về `false` | `ResultComparator.Compare()` — null guard | Pending | Y |

---

### 2.2. TestcaseGenerator

**Mục đích:** Tự động sinh test case từ input của người dùng hoặc template.

**Các hàm cần test:**

#### `GenerateTestcases(Problem problem, GenerationStrategy strategy)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| TCG-01 | Generate normal cases | Sinh test case từ sample input/output | Danh sách TestCase được tạo đúng số lượng | `TestcaseGenerator.GenerateTestcases()` | Pending | Y |
| TCG-02 | Generate boundary cases | Sinh test case với giá trị biên (min, max, zero, negative) | Tạo đúng test case cho các trường hợp biên | `TestcaseGenerator.GenerateTestcases()` — boundary logic | Pending | Y |
| TCG-03 | Generate edge cases | Input rỗng, input đặc biệt (ký tự Unicode, ký tự đặc biệt) | Xử lý đúng không crash | `TestcaseGenerator.GenerateTestcases()` — edge case handling | Pending | Y |
| TCG-04 | Invalid problem id | problem.Id = null hoặc rỗng | Ném exception `ArgumentException` | `TestcaseGenerator.GenerateTestcases()` — null guard | Pending | Y |
| TCG-05 | Strategy = AllCombinations | strategy = AllCombinations, mỗi tham số có 3 giá trị | Sinh đúng số lượng tổ hợp = 3^n | `TestcaseGenerator.GenerateTestcases()` — AllCombinations logic | Pending | Y |
| TCG-06 | Strategy = Pairwise | strategy = Pairwise | Sinh đúng số lượng test case theo thuật toán pairwise | `TestcaseGenerator.GenerateTestcases()` — Pairwise logic | Pending | Y |
| TCG-07 | Strategy = BoundaryOnly | strategy = BoundaryOnly | Chỉ sinh test case giá trị biên | `TestcaseGenerator.GenerateTestcases()` — BoundaryOnly logic | Pending | Y |
| TCG-08 | Duplicate testcases | Sinh ra test case trùng lặp | Loại bỏ duplicate, không trùng lặp | `TestcaseGenerator.GenerateTestcases()` — deduplication | Pending | Y |
| TCG-09 | Zero input range | Min = Max = 0 | Sinh đúng 1 test case với giá trị 0 | `TestcaseGenerator.GenerateTestcases()` — zero range handling | Pending | Y |

---

## 3. ACASSERVICE — JOBS

### 3.1. ExaminationJobScheduling

**Mục đích:** Quản lý lịch job cho việc tự động mở/kết thúc ca thi.

**Các hàm cần test:**

#### `ScheduleJobs(string examId, DateTime startDatetime, DateTime endDatetime)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EJS-01 | Both dates in future | start > now, end > now | 2 job được schedule: MarkExamAsOpenAsync + MarkExamAsCompletedAsync | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-02 | End datetime in past | end < now | 0 job được schedule | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-03 | Start datetime in past, end in future | start < now < end | 2 job được schedule, MarkExamAsOpenAsync fires immediately | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-04 | Start datetime just before now | start ≈ now (50ms) | 2 job được schedule (race condition) | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-05 | Start equals end | start = end | Chỉ 1 job được schedule (MarkExamAsCompletedAsync) | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-06 | Exam id null | examId = null | Ném exception `ArgumentNullException` | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |
| EJS-07 | Start after end | start > end | Ném exception `ArgumentException` | `ExaminationJobScheduling.ScheduleJobs()` | Pending | Y |

#### `CancelJobs(string examId)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EJS-08 | Exam with scheduled jobs | exam có cả job mở và đóng | Xóa đúng 2 job ID: exam-open:{id} + exam-complete:{id} | `ExaminationJobScheduling.CancelJobs()` | Pending | Y |
| EJS-09 | Non-existent exam | exam không có job nào | Không ném exception, không có job nào bị xóa | `ExaminationJobScheduling.CancelJobs()` | Pending | Y |

#### `RescheduleJobs(string examId, DateTime newStart, DateTime newEnd)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EJS-10 | Both dates changed | Thay đổi cả start và end | Đúng 2 job cũ bị xóa + 2 job mới được schedule | `ExaminationJobScheduling.RescheduleJobs()` | Pending | Y |
| EJS-11 | Only start changed | Chỉ thay đổi start | Hủy 2 job cũ, schedule 2 job mới | `ExaminationJobScheduling.RescheduleJobs()` | Pending | Y |
| EJS-12 | Only end changed | Chỉ thay đổi end | Hủy 2 job cũ, schedule 2 job mới | `ExaminationJobScheduling.RescheduleJobs()` | Pending | Y |
| EJS-13 | Dates unchanged | start = oldStart, end = oldEnd | Không schedule job mới (có thể xóa rồi tạo lại hoặc giữ nguyên) | `ExaminationJobScheduling.RescheduleJobs()` | Pending | Y |

#### `MarkExamAsOpenAsync(string examId)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EJS-14 | Exam is PENDING | Exam đang ở trạng thái PENDING | Status chuyển sang ONGOING, UpdatedDate được cập nhật | `ExaminationJobScheduling.MarkExamAsOpenAsync()` | Pending | Y |
| EJS-15 | Exam is ONGOING | Exam đã ở ONGOING | Không cập nhật gì (idempotent) | `ExaminationJobScheduling.MarkExamAsOpenAsync()` | Pending | Y |
| EJS-16 | Exam is COMPLETED | Exam đã COMPLETED | Không cập nhật gì | `ExaminationJobScheduling.MarkExamAsOpenAsync()` | Pending | Y |
| EJS-17 | Exam not found | examId không tồn tại | Không ném exception, không cập nhật | `ExaminationJobScheduling.MarkExamAsOpenAsync()` | Pending | Y |
| EJS-18 | Repository throws | GetByIdAsync ném exception | Exception được propagate | `ExaminationJobScheduling.MarkExamAsOpenAsync()` | Pending | Y |

#### `MarkExamAsCompletedAsync(string examId)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EJS-19 | Exam is ONGOING | Exam đang ONGOING | Status chuyển sang COMPLETED, UpdatedDate được cập nhật | `ExaminationJobScheduling.MarkExamAsCompletedAsync()` | Pending | Y |
| EJS-20 | Exam is COMPLETED | Exam đã COMPLETED | Không cập nhật gì (idempotent) | `ExaminationJobScheduling.MarkExamAsCompletedAsync()` | Pending | Y |
| EJS-21 | Exam is PENDING | Exam chưa bao giờ mở (PENDING) | Vẫn chuyển sang COMPLETED | `ExaminationJobScheduling.MarkExamAsCompletedAsync()` | Pending | Y |
| EJS-22 | Exam not found | examId không tồn tại | Không ném exception | `ExaminationJobScheduling.MarkExamAsCompletedAsync()` | Pending | Y |
| EJS-23 | Repository throws | UpdateAsync ném exception | Exception được propagate | `ExaminationJobScheduling.MarkExamAsCompletedAsync()` | Pending | Y |

---

## 4. ACASSERVICE — COMMANDS

### 4.1. SubmissionCommand

**Mục đích:** Xử lý việc nộp bài, chấm điểm tự động, chấm lại và ghi đè điểm.

#### `SubmitProblemAsync(SubmitProblemRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SUB-01 | Submit in PRACTICAL mode | examination.Mode = PRACTICAL, không có StudentExamSession | Tạo submission thành công, Version = 1 | `SubmissionCommand.SubmitProblemAsync()` — PRACTICAL mode branch | Pending | Y |
| SUB-02 | Submit in EXAMINATION mode, active session | examination.Mode = EXAMINATION, session.Phase = Active | Tạo submission thành công, Version = 1 | `SubmissionCommand.SubmitProblemAsync()` — EXAMINATION mode with active session | Pending | Y |
| SUB-03 | Submit in EXAMINATION mode, no session | examination.Mode = EXAMINATION, session = null | Ném `InvalidOperationException` "Exam session is not active..." | `SubmissionCommand.SubmitProblemAsync()` — session null check | Pending | Y |
| SUB-04 | Submit in EXAMINATION mode, session not active | examination.Mode = EXAMINATION, session.Phase = Submitted | Ném `InvalidOperationException` "Exam session is not active..." | `SubmissionCommand.SubmitProblemAsync()` — Phase validation | Pending | Y |
| SUB-05 | Re-submit same problem | Đã có submission cho cùng exam+problem | Version tăng lên 2, submission mới được tạo | `SubmissionCommand.SubmitProblemAsync()` — versioning logic | Pending | Y |
| SUB-06 | Multiple re-submit | Đã có 3 submission | Version = 4 | `SubmissionCommand.SubmitProblemAsync()` — version increment | Pending | Y |
| SUB-07 | Submission cached | submission đã có trong cache | Đọc từ cache thay vì DB | `SubmissionCommand.SubmitProblemAsync()` — cache lookup | Pending | Y |
| SUB-08 | Cache miss | Không có trong cache | Truy vấn DB, cập nhật cache | `SubmissionCommand.SubmitProblemAsync()` — cache miss handling | Pending | Y |
| SUB-09 | Repository returns null | CreateAsync trả về null | Trả về `null`, không ném exception | `SubmissionCommand.SubmitProblemAsync()` — null return | Pending | Y |
| SUB-10 | Exam not found | examination = null | Tạo submission bình thường (không kiểm tra session) | `SubmissionCommand.SubmitProblemAsync()` — exam null handling | Pending | Y |
| SUB-11 | Submission to non-existent exam | request.ExamId không tồn tại | Tạo submission bình thường (exam check trả về null) | `SubmissionCommand.SubmitProblemAsync()` — non-existent exam | Pending | Y |
| SUB-12 | StudentId null/empty | request.StudentId rỗng | Ném `ArgumentException` | `SubmissionCommand.SubmitProblemAsync()` — StudentId validation | Pending | Y |

#### `AutoGradeAllSubmissionsOfProblemAsync(BulkSubmissionGradingRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SUB-13 | Problem not found | problem = null | Trả về AutoGradeProblemResponse với TotalSubmissions = 0 | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — problem null check | Pending | Y |
| SUB-14 | Problem has no hidden testcases | hiddenTestCases.Count = 0 | Trả về response, không chấm bài nào | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — empty testcase list | Pending | Y |
| SUB-15 | All submissions pass all tests | Tất cả test case đều SUCCESS | FinalScore = problemMark, Status = GRADED | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — all pass branch | Pending | Y |
| SUB-16 | Partial pass | 3/5 test case passed | FinalScore = (3/5) * problemMark | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — score calculation | Pending | Y |
| SUB-17 | No test cases pass | 0/5 passed | FinalScore = 0, Status = GRADED | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — all fail branch | Pending | Y |
| SUB-18 | TestcaseEvaluator throws | ExecuteTestcasesAsync ném exception | ErrorMessage được ghi nhận, Submission không bị cập nhật | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — exception handling | Pending | Y |
| SUB-19 | Multiple submissions | 10 submissions | Tất cả đều được chấm, response đúng TotalSubmissions | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — bulk loop | Pending | Y |
| SUB-20 | Notification sent after grading | Chấm thành công | Gọi NotifyUsersAsync với NotificationType.GRADE_RESULT | `SubmissionCommand.AutoGradeAllSubmissionsOfProblemAsync()` — notification call | Pending | Y |

#### `RegradeSingleSubmissionAsync(string submissionId, SingleSubmissionRegradeRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SUB-21 | Submission not found | submission = null | Trả về AutoGradeSubmissionResult với ErrorMessage = "Submission not found" | `SubmissionCommand.RegradeSingleSubmissionAsync()` — submission null check | Pending | Y |
| SUB-22 | Problem not found | problem = null | Trả về ErrorMessage = "Problem not found" | `SubmissionCommand.RegradeSingleSubmissionAsync()` — problem null check | Pending | Y |
| SUB-23 | No hidden testcases | hiddenTestCases.Count = 0 | Trả về TotalTestCases = 0, ErrorMessage = "No hidden test cases" | `SubmissionCommand.RegradeSingleSubmissionAsync()` — empty testcases | Pending | Y |
| SUB-24 | Regrade success | Tất cả điều kiện hợp lệ | FinalScore được cập nhật, Status = GRADED, GradedDate cập nhật | `SubmissionCommand.RegradeSingleSubmissionAsync()` — success path | Pending | Y |
| SUB-25 | Regrade exception | ExecuteTestcasesAsync throws | Trả về ErrorMessage = exception.Message | `SubmissionCommand.RegradeSingleSubmissionAsync()` — exception handling | Pending | Y |
| SUB-26 | Notification sent | Regrade thành công | NotifyUsersAsync được gọi | `SubmissionCommand.RegradeSingleSubmissionAsync()` — notification | Pending | Y |

#### `OverrideSubmissionScoreAsync(string submissionId, float newScore, float maxMark)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SUB-27 | Submission not found | submission = null | Trả về `false` | `SubmissionCommand.OverrideSubmissionScoreAsync()` — submission null check | Pending | Y |
| SUB-28 | Score exceeds max mark | newScore > maxMark | Ném `InvalidOperationException` "Score cannot exceed max mark" | `SubmissionCommand.OverrideSubmissionScoreAsync()` — score validation | Pending | Y |
| SUB-29 | Score equals max mark | newScore = maxMark | Trả về `true`, FinalScore = maxMark | `SubmissionCommand.OverrideSubmissionScoreAsync()` — boundary value | Pending | Y |
| SUB-30 | Override previously ungraded | submission.Status = PENDING | Status chuyển sang GRADED | `SubmissionCommand.OverrideSubmissionScoreAsync()` — status transition | Pending | Y |
| SUB-31 | Override already graded | submission.Status = GRADED | Chỉ cập nhật FinalScore, giữ nguyên Status | `SubmissionCommand.OverrideSubmissionScoreAsync()` — already graded path | Pending | Y |
| SUB-32 | Update success | Tất cả điều kiện hợp lệ | Trả về `true`, UpdatedDate được cập nhật | `SubmissionCommand.OverrideSubmissionScoreAsync()` — success path | Pending | Y |
| SUB-33 | Notification sent | Override thành công | NotifyUsersAsync được gọi | `SubmissionCommand.OverrideSubmissionScoreAsync()` — notification | Pending | Y |

---

### 4.2. ProblemCommand

**Mục đích:** CRUD cho đề bài lập trình.

#### `CreateProblemAsync(CreateProblemRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PRO-01 | Create successfully | Request hợp lệ, không trùng tên | Problem được tạo, trả về response | `ProblemCommand.CreateProblemAsync()` — success path | Pending | Y |
| PRO-02 | Duplicate problem name | Tên đã tồn tại trong cùng subject | Ném `InvalidOperationException` "Problem with this name already exists" | `ProblemCommand.CreateProblemAsync()` — duplicate name check | Pending | Y |
| PRO-03 | Invalid difficulty | request.Difficulty = "INVALID" | Ném `ArgumentException` | `ProblemCommand.CreateProblemAsync()` — difficulty enum validation | Pending | Y |
| PRO-04 | Empty title | request.Title = "" hoặc null | Ném `ArgumentException` | `ProblemCommand.CreateProblemAsync()` — title validation | Pending | Y |
| PRO-05 | Null testcases | request.TestCases = null | Tạo problem với danh sách rỗng | `ProblemCommand.CreateProblemAsync()` — null testcases handling | Pending | Y |
| PRO-06 | Invalid time limit | request.TimeLimit < 0 | Ném `ArgumentException` | `ProblemCommand.CreateProblemAsync()` — TimeLimit validation | Pending | Y |
| PRO-07 | Invalid memory limit | request.MemoryLimit < 0 | Ném `ArgumentException` | `ProblemCommand.CreateProblemAsync()` — MemoryLimit validation | Pending | Y |

#### `UpdateProblemAsync(string problemId, UpdateProblemRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PRO-08 | Update successfully | Request hợp lệ | Problem được cập nhật, UpdatedDate thay đổi | `ProblemCommand.UpdateProblemAsync()` — success path | Pending | Y |
| PRO-09 | Problem not found | problemId không tồn tại | Ném `InvalidOperationException` | `ProblemCommand.UpdateProblemAsync()` — not found check | Pending | Y |
| PRO-10 | Rename to existing name | Đổi tên trùng với problem khác | Ném `InvalidOperationException` | `ProblemCommand.UpdateProblemAsync()` — duplicate name check | Pending | Y |
| PRO-11 | Partial update | Chỉ cập nhật description, giữ nguyên title | Title giữ nguyên, description được cập nhật | `ProblemCommand.UpdateProblemAsync()` — partial update | Pending | Y |
| PRO-12 | Soft delete related exams | Exam chứa problem này bị xóa mềm | Các Exam liên quan được đánh dấu IsDeleted = true | `ProblemCommand.UpdateProblemAsync()` — cascade soft delete | Pending | Y |

#### `DeleteProblemAsync(string problemId)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PRO-13 | Delete successfully | Problem tồn tại, không có submission | Problem.IsDeleted = true | `ProblemCommand.DeleteProblemAsync()` — success path | Pending | Y |
| PRO-14 | Has existing submissions | Problem có Submission liên quan | Ném `InvalidOperationException` hoặc soft delete + cảnh báo | `ProblemCommand.DeleteProblemAsync()` — submission check | Pending | Y |
| PRO-15 | Problem not found | problemId không tồn tại | Ném `InvalidOperationException` | `ProblemCommand.DeleteProblemAsync()` — not found check | Pending | Y |

---

### 4.3. ExaminationCommand

**Mục đích:** CRUD cho ca thi, quản lý lịch thi tự động.

#### `CreateAsync(ExaminationRequestDTO request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EXM-01 | Create successfully | Request hợp lệ | Examination được tạo, Status = PENDING, ScheduleJobs được gọi | `ExaminationCommand.CreateAsync()` — success path | Pending | Y |
| EXM-02 | Classroom not found | classroom = null | Ném exception | `ExaminationCommand.CreateAsync()` — classroom validation | Pending | Y |
| EXM-03 | Start datetime in past | startDatetime < now | Tạo được nhưng ScheduleJobs xử lý đúng (job fire immediately) | `ExaminationCommand.CreateAsync()` — past datetime handling | Pending | Y |
| EXM-04 | End datetime before start | endDatetime < startDatetime | Ném `ArgumentException` | `ExaminationCommand.CreateAsync()` — datetime validation | Pending | Y |
| EXM-05 | Empty problem list | Problems = [] | Tạo được exam không có đề bài | `ExaminationCommand.CreateAsync()` — empty problem list | Pending | Y |
| EXM-06 | Mode = EXAMINATION | mode = EXAMINATION | Exam được tạo với mode chính xác | `ExaminationCommand.CreateAsync()` — EXAMINATION mode | Pending | Y |
| EXM-07 | Mode = PRACTICAL | mode = PRACTICAL | Exam được tạo với mode chính xác | `ExaminationCommand.CreateAsync()` — PRACTICAL mode | Pending | Y |
| EXM-08 | Invalid status value | request.Status = "INVALID" | Ném `ArgumentException` "Invalid status" | `ExaminationCommand.CreateAsync()` — status enum validation | Pending | Y |
| EXM-09 | Notification failure | NotifyClassroomAsync throws | Ném exception (đã được test ở test hiện tại) | `ExaminationCommand.CreateAsync()` — notification error handling | Pending | Y |

#### `UpdateAsync(string examId, ExaminationRequestDTO request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EXM-10 | Change only start datetime | startDatetime khác | RescheduleJobs được gọi với ngày mới | `ExaminationCommand.UpdateAsync()` — date change detection | Pending | Y |
| EXM-11 | Change only end datetime | endDatetime khác | RescheduleJobs được gọi | `ExaminationCommand.UpdateAsync()` — date change detection | Pending | Y |
| EXM-12 | Change both dates | Cả start và end đều khác | RescheduleJobs được gọi đúng 1 lần | `ExaminationCommand.UpdateAsync()` — both dates changed | Pending | Y |
| EXM-13 | No date changes | start = oldStart, end = oldEnd | RescheduleJobs không được gọi | `ExaminationCommand.UpdateAsync()` — no date change | Pending | Y |
| EXM-14 | Exam not found | examId không tồn tại | Ném exception "Examination with given Id does not exist" | `ExaminationCommand.UpdateAsync()` — not found check | Pending | Y |
| EXM-15 | Update status to CANCELLED | status = CANCELLED | Trạng thái được cập nhật | `ExaminationCommand.UpdateAsync()` — status update | Pending | Y |

#### `DeleteAsync(string examId)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EXM-16 | Delete successfully | Exam tồn tại | CancelJobs được gọi, exam được xóa khỏi DB | `ExaminationCommand.DeleteAsync()` — success path | Pending | Y |
| EXM-17 | Exam not found | examId không tồn tại | Ném exception "Examination with given Id does not exist" | `ExaminationCommand.DeleteAsync()` — not found check | Pending | Y |
| EXM-18 | Has ongoing submissions | Có submission đang chạy | Cân nhắc: ném exception hoặc cho xóa + cảnh báo | `ExaminationCommand.DeleteAsync()` — submission check | Pending | Y |

---

**Mục đích:** Quản lý lớp học.

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| CLA-01 | Create classroom successfully | Request hợp lệ | Classroom được tạo | `ClassroomCommand.CreateAsync()` — success path | Pending | Y |
| CLA-02 | Duplicate classroom name | Tên trùng trong cùng subject | Ném exception | `ClassroomCommand.CreateAsync()` — duplicate name check | Pending | Y |
| CLA-03 | Add student to classroom | Student tồn tại, chưa trong lớp | Thêm thành công vào ClassEnrollment | `ClassroomCommand.AddStudentAsync()` — success | Pending | Y |
| CLA-04 | Add duplicate student | Student đã trong lớp | Ném exception hoặc bỏ qua không lỗi | `ClassroomCommand.AddStudentAsync()` — duplicate check | Pending | Y |
| CLA-05 | Remove student | Student đang trong lớp | Xóa khỏi ClassEnrollment | `ClassroomCommand.RemoveStudentAsync()` — success | Pending | Y |
| CLA-06 | Remove non-existent student | Student không trong lớp | Không lỗi, bỏ qua | `ClassroomCommand.RemoveStudentAsync()` — not found | Pending | Y |
| CLA-07 | Delete classroom with students | Lớp có sinh viên đang học | Xóa mềm, thông báo | `ClassroomCommand.DeleteAsync()` — cascade soft delete | Pending | Y |
| CLA-08 | Assign lecturer | lecturerId hợp lệ | Classroom.OwnerId được gán | `ClassroomCommand.UpdateAsync()` — owner assignment | Pending | Y |

---

### 4.5. StudentExamSessionCommand

**Mục đích:** Quản lý phiên thi của sinh viên.

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SES-01 | Start exam session | Exam đang ONGOING, chưa có session | Session được tạo, Phase = Active | `StudentExamSessionCommand.StartAsync()` — success path | Pending | Y |
| SES-02 | Start already started session | Session đã Active | Trả về session hiện tại, không tạo mới | `StudentExamSessionCommand.StartAsync()` — duplicate session | Pending | Y |
| SES-03 | Start COMPLETED exam | Exam đã COMPLETED | Ném `InvalidOperationException` | `StudentExamSessionCommand.StartAsync()` — status check | Pending | Y |
| SES-04 | Start PENDING exam | Exam chưa bắt đầu | Ném `InvalidOperationException` "Exam has not started yet" | `StudentExamSessionCommand.StartAsync()` — status check | Pending | Y |
| SES-05 | Submit exam | Session đang Active | Phase chuyển sang Submitted, SubmittedDate được ghi | `StudentExamSessionCommand.SubmitAsync()` — success path | Pending | Y |
| SES-06 | Submit already submitted | Session đã Submitted | Ném `InvalidOperationException` hoặc idempotent | `StudentExamSessionCommand.SubmitAsync()` — duplicate submit | Pending | Y |
| SES-07 | Force submit | Lecturer yêu cầu ép nộp | Phase = Submitted, SubmittedDate = now, các submission bị hủy/dừng | `StudentExamSessionCommand.ForceSubmitAsync()` — force submit | Pending | Y |
| SES-08 | Session not found | studentId/examId không tồn tại | Ném exception | `StudentExamSessionCommand.StartAsync()` — not found | Pending | Y |

---

### 4.6. QuizCommand / ClassroomQuizCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| QZ-01 | Create quiz successfully | Quiz hợp lệ | Quiz được tạo, Questions được liên kết | `QuizCommand.CreateAsync()` — success path | Pending | Y |
| QZ-02 | Add question to quiz | Question tồn tại, chưa trong quiz | Thêm thành công | `QuizCommand.AddQuestionAsync()` — success path | Pending | Y |
| QZ-03 | Remove question from quiz | Question đang trong quiz | Xóa khỏi quiz, không xóa question | `QuizCommand.RemoveQuestionAsync()` — success path | Pending | Y |
| QZ-04 | Shuffle questions | Shuffle = true | Questions được random thứ tự | `QuizCommand.CreateAsync()` — shuffle logic | Pending | Y |
| QZ-05 | Quiz with time limit | Quiz có thời gian làm bài | TimeLimit được lưu | `QuizCommand.CreateAsync()` — time limit field | Pending | Y |

---

### 4.7. DiscussionIssueCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| DI-01 | Create discussion successfully | Request hợp lệ | DiscussionIssue được tạo | `DiscussionIssueCommand.CreateAsync()` — success path | Pending | Y |
| DI-02 | Reply to discussion | Parent issue tồn tại | Reply được tạo với ParentId đúng | `DiscussionIssueCommand.CreateReplyAsync()` — reply path | Pending | Y |
| DI-03 | Mark as resolved | Issue chưa resolved | IsResolved = true | `DiscussionIssueCommand.MarkResolvedAsync()` — success path | Pending | Y |
| DI-04 | Delete own discussion | User là chủ sở hữu | Issue.IsDeleted = true | `DiscussionIssueCommand.DeleteAsync()` — own issue | Pending | Y |
| DI-05 | Delete others' discussion | User không phải chủ sở hữu | Ném `UnauthorizedAccessException` | `DiscussionIssueCommand.DeleteAsync()` — authorization | Pending | Y |

---

### 4.8. MaterialCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| MAT-01 | Upload material | File hợp lệ, upload lên S3 | Material được tạo, S3 URL được lưu | `MaterialCommand.UploadAsync()` — success + S3 upload | Pending | Y |
| MAT-02 | Delete material | Material tồn tại | Xóa khỏi DB và S3 | `MaterialCommand.DeleteAsync()` — DB + S3 delete | Pending | Y |
| MAT-03 | Get materials by subject | Subject có nhiều material | Trả về danh sách đã sắp xếp theo ngày | `MaterialQuery.GetBySubjectId()` — ordering | Pending | Y |
| MAT-04 | Upload unsupported file type | File extension không được hỗ trợ | Ném exception | `MaterialCommand.UploadAsync()` — file type validation | Pending | Y |

---

### 4.9. NotificationCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| NTF-01 | Send notification to single user | userId hợp lệ | Notification được tạo, gửi qua SignalR | `NotificationCommand.SendAsync()` — single user + SignalR | Pending | Y |
| NTF-02 | Send notification to multiple users | Nhiều userId | Notification được tạo cho từng user | `NotificationCommand.SendBulkAsync()` — bulk send | Pending | Y |
| NTF-03 | Mark notification as read | notification tồn tại, chưa đọc | IsRead = true, ReadDate = now | `NotificationCommand.MarkAsReadAsync()` — success | Pending | Y |
| NTF-04 | Mark non-existent notification | notificationId không tồn tại | Ném exception | `NotificationCommand.MarkAsReadAsync()` — not found | Pending | Y |

---

### 4.10. KeystrokeLogCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| KSL-01 | Save single keystroke | Log hợp lệ | KeystrokeLog được tạo | `KeystrokeLogCommand.SaveAsync()` — single insert | Pending | Y |
| KSL-02 | Batch save keystrokes | 100 keystroke logs | Tất cả được batch insert thành công | `KeystrokeLogCommand.SaveBatchAsync()` — batch insert | Pending | Y |
| KSL-03 | Save with null metadata | Metadata = null | Xử lý không crash, lưu null | `KeystrokeLogCommand.SaveAsync()` — null metadata | Pending | Y |

---

### 4.11. OCRCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| OCR-01 | OCR with clear image | Ảnh rõ ràng | Trả về text chính xác | `OcrService.RecognizeTextAsync()` — clean image | Pending | Y |
| OCR-02 | OCR with noisy image | Ảnh có nhiễu | Trả về text đã được làm sạch | `OcrService.RecognizeTextAsync()` — noise handling | Pending | Y |
| OCR-03 | OCR empty image | Ảnh trắng | Trả về chuỗi rỗng | `OcrService.RecognizeTextAsync()` — empty image | Pending | Y |
| OCR-04 | Unsupported image format | Format = BMP | Ném exception | `OcrService.RecognizeTextAsync()` — format validation | Pending | Y |
| OCR-05 | Large image | Kích thước > 10MB | Ném exception hoặc tự resize | `OcrService.RecognizeTextAsync()` — size check | Pending | Y |

---

### 4.12. ExamLogCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EL-01 | Log suspicious activity | Hành vi đáng ngờ (copy-paste nhiều) | ExamLog được tạo, Suspicious = true | `ExamLogCommand.CreateAsync()` — suspicious flag | Pending | Y |
| EL-02 | Log normal activity | Hành vi bình thường | ExamLog được tạo, Suspicious = false | `ExamLogCommand.CreateAsync()` — normal activity | Pending | Y |
| EL-03 | Log tab switch | studentId = "std1", event = "TabSwitch" | ExamLog được ghi | `ExamLogCommand.CreateAsync()` — tab switch event | Pending | Y |

---

### 4.13. QuizAttemptCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| QA-01 | Start quiz attempt | Quiz tồn tại, chưa có attempt | QuizAttempt được tạo, StartDate = now | `QuizAttemptCommand.StartAsync()` — success path | Pending | Y |
| QA-02 | Submit quiz with all answers | Tất cả câu hỏi đã trả lời | SubmittedDate = now, auto-grade được tính | `QuizAttemptCommand.SubmitAsync()` — full submit | Pending | Y |
| QA-03 | Submit quiz with missing answers | Một số câu chưa trả lời | SubmittedDate = now, câu chưa trả = null/0 điểm | `QuizAttemptCommand.SubmitAsync()` — partial submit | Pending | Y |
| QA-04 | Auto grade correct answer | Answer đúng | Score = điểm của câu đó | `QuizAttemptCommand.AutoGradeAsync()` — correct answer | Pending | Y |
| QA-05 | Auto grade wrong answer | Answer sai | Score = 0 | `QuizAttemptCommand.AutoGradeAsync()` — wrong answer | Pending | Y |
| QA-06 | Multiple attempts allowed | Quiz.allowMultipleAttempts = true | Tạo attempt mới | `QuizAttemptCommand.StartAsync()` — multiple attempts | Pending | Y |
| QA-07 | Multiple attempts not allowed | Quiz.allowMultipleAttempts = false, đã có attempt | Ném exception | `QuizAttemptCommand.StartAsync()` — attempt limit | Pending | Y |

---

### 4.14. StudentAnswerCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SA-01 | Save answer auto-save | isAutoSave = true | StudentAnswer được cập nhật, không trigger grade | `StudentAnswerCommand.SaveAsync()` — auto-save path | Pending | Y |
| SA-02 | Save answer manual | isAutoSave = false, QuizAttempt.SubmittedDate = null | StudentAnswer được cập nhật | `StudentAnswerCommand.SaveAsync()` — manual save | Pending | Y |
| SA-03 | Save after submission | QuizAttempt đã submit | Ném `InvalidOperationException` | `StudentAnswerCommand.SaveAsync()` — post-submit check | Pending | Y |
| SA-04 | Update existing answer | StudentAnswer đã tồn tại | Cập nhật nội dung answer | `StudentAnswerCommand.SaveAsync()` — update path | Pending | Y |

---

### 4.15. ExaminationTemplateCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| ET-01 | Create template | Request hợp lệ | ExaminationTemplate được tạo | `ExaminationTemplateCommand.CreateAsync()` — success | Pending | Y |
| ET-02 | Copy template to new exam | Template có problem list | Tạo exam mới với problem list giống template | `ExaminationTemplateCommand.CopyToExamAsync()` — copy | Pending | Y |
| ET-03 | Update template | Template tồn tại | Cập nhật thành công | `ExaminationTemplateCommand.UpdateAsync()` — success | Pending | Y |
| ET-04 | Delete template | Template tồn tại | Xóa template, không ảnh hưởng exam đã tạo | `ExaminationTemplateCommand.DeleteAsync()` — delete | Pending | Y |

---

### 4.16. ProgrammingLanguageCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PL-01 | Add supported language | Language hợp lệ | ProgrammingLanguage được tạo | `ProgrammingLanguageCommand.CreateAsync()` — success | Pending | Y |
| PL-02 | Duplicate language | Language đã tồn tại | Ném exception | `ProgrammingLanguageCommand.CreateAsync()` — duplicate check | Pending | Y |
| PL-03 | Delete language | Language đang được sử dụng bởi exam | Ném exception hoặc cảnh báo | `ProgrammingLanguageCommand.DeleteAsync()` — usage check | Pending | Y |

---

### 4.17. SlotCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SL-01 | Create slot | Slot hợp lệ | Slot được tạo | `SlotCommand.CreateAsync()` — success | Pending | Y |
| SL-02 | Assign classroom | Classroom khả dụng | Slot.ClassroomId được gán | `SlotCommand.UpdateAsync()` — classroom assignment | Pending | Y |
| SL-03 | Overlap slot | 2 slot cùng phòng, cùng giờ | Ném exception | `SlotCommand.CreateAsync()` — overlap validation | Pending | Y |
| SL-04 | Delete slot | Slot đang được exam sử dụng | Ném exception hoặc cảnh báo | `SlotCommand.DeleteAsync()` — usage check | Pending | Y |

---

### 4.18. ErrorGroupCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EG-01 | Create error group | Group hợp lệ | ErrorGroup được tạo | `ErrorGroupCommand.CreateAsync()` — success | Pending | Y |
| EG-02 | Link compilation error | Error tồn tại, group tồn tại | Compilation được liên kết | `ErrorGroupCommand.LinkCompilationErrorAsync()` — link | Pending | Y |
| EG-03 | Get errors by language | languageId hợp lệ | Trả về danh sách ErrorGroup cho ngôn ngữ đó | `ErrorGroupQuery.GetByLanguageId()` — filter | Pending | Y |

---

### 4.19. UserDeviceCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UD-01 | Register device | Device hợp lệ | UserDevice được tạo, DeviceToken được lưu | `UserDeviceCommand.RegisterAsync()` — success | Pending | Y |
| UD-02 | Register duplicate device | Cùng deviceId, userId | Cập nhật DeviceToken | `UserDeviceCommand.RegisterAsync()` — duplicate device | Pending | Y |
| UD-03 | Unregister device | Device tồn tại | UserDevice.IsActive = false | `UserDeviceCommand.UnregisterAsync()` — deactivate | Pending | Y |
| UD-04 | Send push notification | Device đang active | Push được gửi thành công | `UserDeviceCommand.SendPushAsync()` — push send | Pending | Y |

---

### 4.20. ClassEnrollmentCommand

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| CE-01 | Enroll student | Student và Classroom tồn tại | ClassEnrollment được tạo | `ClassEnrollmentCommand.EnrollAsync()` — success | Pending | Y |
| CE-02 | Enroll duplicate | Student đã trong lớp | Ném exception | `ClassEnrollmentCommand.EnrollAsync()` — duplicate check | Pending | Y |
| CE-03 | Withdraw student | Student đang trong lớp | Enrollment.IsActive = false | `ClassEnrollmentCommand.WithdrawAsync()` — withdraw | Pending | Y |
| CE-04 | Enroll with role | Role = STUDENT/TEACHING_ASSISTANT | Role được lưu đúng | `ClassEnrollmentCommand.EnrollAsync()` — role assignment | Pending | Y |

---

## 5. ACASSERVICE — QUERIES

### 5.1. ExaminationQuery

**Các hàm cần test:**

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EQ-01 | GetById exists | examId tồn tại | Trả về Examination đầy đủ | `ExaminationQuery.GetByIdAsync()` — success | Pending | Y |
| EQ-02 | GetById not exists | examId không tồn tại | Trả về `null` | `ExaminationQuery.GetByIdAsync()` — not found | Pending | Y |
| EQ-03 | GetByClassroomId | classroomId có nhiều exam | Trả về danh sách exam, sắp xếp theo ngày | `ExaminationQuery.GetByClassroomIdAsync()` — list | Pending | Y |
| EQ-04 | GetByDateRange | Lọc exam trong khoảng thời gian | Chỉ trả về exam trong range | `ExaminationQuery.GetByDateRangeAsync()` — filter | Pending | Y |
| EQ-05 | GetAvailableForStudent | Sinh viên chưa thi, exam ONGOING | Trả về exam sinh viên có thể tham gia | `ExaminationQuery.GetAvailableForStudentAsync()` — filter | Pending | Y |
| EQ-06 | GetAvailableForStudent, exam ended | exam đã COMPLETED | Không trả về exam đó | `ExaminationQuery.GetAvailableForStudentAsync()` — status filter | Pending | Y |
| EQ-07 | GetWithProblems | Include đầy đủ Problems | Problems được eager load | `ExaminationQuery.GetWithProblemsAsync()` — include | Pending | Y |
| EQ-08 | Pagination | PageSize = 10, Page = 2 | Đúng 10 exam, đúng offset | `ExaminationQuery.GetPaginatedAsync()` — pagination | Pending | Y |

---

### 5.2. ProblemQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PQ-01 | GetById exists | problemId tồn tại | Trả về Problem với TestCases | `ProblemQuery.GetByIdAsync()` — success | Pending | Y |
| PQ-02 | GetById not exists | problemId không tồn tại | Trả về `null` | `ProblemQuery.GetByIdAsync()` — not found | Pending | Y |
| PQ-03 | Get paginated list | 50 problems, pageSize = 10 | Đúng 10 items, có pagination metadata | `ProblemQuery.GetPaginatedAsync()` — pagination | Pending | Y |
| PQ-04 | Filter by subject | SubjectId hợp lệ | Chỉ trả về problem thuộc subject đó | `ProblemQuery.GetPaginatedAsync()` — subject filter | Pending | Y |
| PQ-05 | Filter by difficulty | Difficulty = "HARD" | Chỉ trả về HARD problem | `ProblemQuery.GetPaginatedAsync()` — difficulty filter | Pending | Y |
| PQ-06 | Filter by multiple criteria | SubjectId + Difficulty + isPublic | Đúng kết quả lọc | `ProblemQuery.GetPaginatedAsync()` — combined filter | Pending | Y |
| PQ-07 | Include hidden testcases | Lấy problem cho lecturer | Hidden testcases được include | `ProblemQuery.GetByIdAsync()` — hidden testcase include | Pending | Y |
| PQ-08 | Exclude hidden testcases | Lấy problem cho student | Hidden testcases không được trả về | `ProblemQuery.GetByIdAsync()` — exclude hidden | Pending | Y |
| PQ-09 | Search by title | keyword = "sort" | Trả về problem có "sort" trong title | `ProblemQuery.SearchAsync()` — title search | Pending | Y |

---

### 5.3. SubmissionQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SQ-01 | GetByStudentId | studentId tồn tại | Trả về tất cả submission của student | `SubmissionQuery.GetByStudentIdAsync()` — list | Pending | Y |
| SQ-02 | GetByStudentAndExam | studentId + examId | Trả về submission của student trong exam đó | `SubmissionQuery.GetByStudentAndExamAsync()` — filter | Pending | Y |
| SQ-03 | GetLatestVersion | student + exam + problem có 3 submission | Trả về submission có Version = 3 | `SubmissionQuery.GetLatestVersionAsync()` — latest version | Pending | Y |
| SQ-04 | GetByProblemId | problemId tồn tại | Trả về tất cả submission cho problem đó | `SubmissionQuery.GetByProblemIdAsync()` — list | Pending | Y |
| SQ-05 | Get with test results | Submission có test results | TestResults được include | `SubmissionQuery.GetByIdAsync()` — include test results | Pending | Y |
| SQ-06 | Get paginated | Nhiều submission | Đúng pagination | `SubmissionQuery.GetPaginatedAsync()` — pagination | Pending | Y |
| SQ-07 | GetByStudentAndExamAndProblem | Đầy đủ tham số | Trả về đúng submission | `SubmissionQuery.GetByStudentExamProblemAsync()` — exact match | Pending | Y |

---

### 5.4. ClassroomQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| CQ-01 | GetClassroomDetails | classroomId tồn tại | Trả về Classroom với danh sách StudentEnrollment | `ClassroomQuery.GetByIdAsync()` — with enrollments | Pending | Y |
| CQ-02 | GetStudentsByClassroom | classroomId có 30 sinh viên | Trả về đúng 30 sinh viên | `ClassroomQuery.GetStudentsByClassroomIdAsync()` — list | Pending | Y |
| CQ-03 | GetClassroomsByLecturer | lecturerId sở hữu 5 lớp | Trả về đúng 5 lớp | `ClassroomQuery.GetByOwnerIdAsync()` — filter | Pending | Y |
| CQ-04 | GetClassroomsByStudent | studentId đang học 3 lớp | Trả về đúng 3 lớp | `ClassroomQuery.GetByStudentIdAsync()` — filter | Pending | Y |
| CQ-05 | Classroom not found | classroomId không tồn tại | Trả về `null` | `ClassroomQuery.GetByIdAsync()` — not found | Pending | Y |

---

### 5.5. StudentExamSessionQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SEQ-01 | GetActiveSession | Có session Active | Trả về session với Phase = Active | `StudentExamSessionQuery.GetActiveSessionAsync()` — active | Pending | Y |
| SEQ-02 | GetSessionByStudentAndExam | studentId + examId hợp lệ | Trả về session đúng | `StudentExamSessionQuery.GetByStudentAndExamAsync()` — exact match | Pending | Y |
| SEQ-03 | GetSession not found | Không có session | Trả về `null` | `StudentExamSessionQuery.GetByStudentAndExamAsync()` — not found | Pending | Y |
| SEQ-04 | GetAllSessionsByExam | examId có nhiều session | Trả về danh sách đầy đủ | `StudentExamSessionQuery.GetByExamIdAsync()` — list | Pending | Y |
| SEQ-05 | ValidateSessionForSubmission | session.Active, exam.Ongoing | Validation trả về `true` | `StudentExamSessionQuery.ValidateForSubmissionAsync()` — valid | Pending | Y |
| SEQ-06 | ValidateSession expired | session đã Submitted | Validation trả về `false` | `StudentExamSessionQuery.ValidateForSubmissionAsync()` — expired | Pending | Y |

---

### 5.6. DiscussionIssueQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| DQ-01 | GetByClassroomId | Lấy discussion trong lớp | Trả về danh sách discussion | `DiscussionIssueQuery.GetByClassroomIdAsync()` — list | Pending | Y |
| DQ-02 | GetByProblemId | Lấy discussion về problem cụ thể | Chỉ trả về discussion liên quan | `DiscussionIssueQuery.GetByProblemIdAsync()` — filter | Pending | Y |
| DQ-03 | Get with replies | Include replies | Replies được eager load | `DiscussionIssueQuery.GetByIdAsync()` — include replies | Pending | Y |
| DQ-04 | GetResolved vs Unresolved | Lọc theo trạng thái | Đúng kết quả | `DiscussionIssueQuery.GetByClassroomIdAsync()` — status filter | Pending | Y |

---

### 5.7. NotificationQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| NQ-01 | GetByUserId | userId tồn tại | Trả về tất cả notification của user, mới nhất trước | `NotificationQuery.GetByUserIdAsync()` — list ordered | Pending | Y |
| NQ-02 | GetUnreadCount | 5 notification chưa đọc | Trả về count = 5 | `NotificationQuery.GetUnreadCountAsync()` — count | Pending | Y |
| NQ-03 | Get unread only | isRead = false | Chỉ trả về notification chưa đọc | `NotificationQuery.GetByUserIdAsync()` — unread filter | Pending | Y |
| NQ-04 | Pagination | Nhiều notification | Đúng pagination | `NotificationQuery.GetPaginatedAsync()` — pagination | Pending | Y |

---

### 5.8. ErrorGroupQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| ERG-01 | GetByLanguage | languageId hợp lệ | Trả về error group cho ngôn ngữ đó | `ErrorGroupQuery.GetByLanguageIdAsync()` — filter | Pending | Y |
| ERG-02 | GetByCompilerId | compilerId hợp lệ | Trả về error group cho compiler đó | `ErrorGroupQuery.GetByCompilerIdAsync()` — filter | Pending | Y |
| ERG-03 | Search by keyword | keyword = "null pointer" | Trả về error group có keyword đó | `ErrorGroupQuery.SearchAsync()` — keyword search | Pending | Y |

---

### 5.9. MaterialQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| MQ-01 | GetBySubjectId | Subject có 10 file | Trả về đúng 10 file, sắp xếp theo UploadDate | `MaterialQuery.GetBySubjectIdAsync()` — list ordered | Pending | Y |
| MQ-02 | GetByClassroomId | Lấy tài liệu theo lớp | Chỉ trả về tài liệu của lớp đó | `MaterialQuery.GetByClassroomIdAsync()` — filter | Pending | Y |
| MQ-03 | GetPublic vs Private | Lọc public/private | Đúng kết quả | `MaterialQuery.GetBySubjectIdAsync()` — visibility filter | Pending | Y |

---

### 5.10. KeystrokeLogQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| KSLQ-01 | GetBySessionId | Session có 500 keystroke | Trả về danh sách keystroke, đúng thứ tự thời gian | `KeystrokeLogQuery.GetBySessionIdAsync()` — ordered list | Pending | Y |
| KSLQ-02 | GetByTimeRange | Lọc theo khoảng thời gian | Đúng kết quả | `KeystrokeLogQuery.GetByTimeRangeAsync()` — time filter | Pending | Y |

---

### 5.11. SlotQuery

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SLQ-01 | GetAllSlots | Lấy tất cả slot | Trả về danh sách slot | `SlotQuery.GetAllAsync()` — list | Pending | Y |
| SLQ-02 | GetByDateRange | Lọc theo ngày | Chỉ trả về slot trong range | `SlotQuery.GetByDateRangeAsync()` — date filter | Pending | Y |
| SLQ-03 | GetAvailableSlots | Slot chưa được gán exam | Chỉ trả về slot trống | `SlotQuery.GetAvailableAsync()` — availability filter | Pending | Y |

---

## 6. ACASSERVICE — MAPPERS

### 6.1. SubmissionMapper

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SM-01 | ToEntity with all fields | Map request đầy đủ | Entity có đúng giá trị tất cả fields | `SubmissionMapper.ToEntity()` — all fields | Pending | Y |
| SM-02 | ToEntity with null fields | Request có null values | Null được giữ nguyên | `SubmissionMapper.ToEntity()` — null handling | Pending | Y |
| SM-03 | ToResponse from entity | Entity hợp lệ | Response có đúng giá trị | `SubmissionMapper.ToResponse()` — all fields | Pending | Y |
| SM-04 | ToResponse with null testResults | TestResults = null | Response không crash, testResults = null | `SubmissionMapper.ToResponse()` — null test results | Pending | Y |
| SM-05 | ToAutoGradeSubmissionResult success | Tất cả fields hợp lệ | Result có đầy đủ thông tin | `SubmissionMapper.ToAutoGradeSubmissionResult()` — success | Pending | Y |
| SM-06 | Map compiler options | CompileOptions khác nhau | Options được map đúng | `SubmissionMapper.ToEntity()` — compiler options | Pending | Y |

---

### 6.2. ExaminationMapper

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EM-01 | ToEntity from request | Map request → Entity | Tất cả fields được map đúng | `ExaminationMapper.ToEntity()` — all fields | Pending | Y |
| EM-02 | ToResponse from entity | Map Entity → Response | Tất cả fields được map đúng | `ExaminationMapper.ToResponse()` — all fields | Pending | Y |
| EM-03 | Map enum status | Status là enum | Enum được convert đúng | `ExaminationMapper.ToResponse()` — enum conversion | Pending | Y |
| EM-04 | Null handling | Entity = null | Trả về `null` không crash | `ExaminationMapper.ToResponse()` — null guard | Pending | Y |

---

### 6.3. ProblemMapper

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PM-01 | ToDetailResponse | Entity đầy đủ | Response có Problems + TestCases | `ProblemMapper.ToDetailResponse()` — with testcases | Pending | Y |
| PM-02 | ToListResponse | Map sang list response | Không include hidden testcases | `ProblemMapper.ToListResponse()` — exclude hidden | Pending | Y |
| PM-03 | Map difficulty enum | Difficulty là enum | Enum được convert đúng | `ProblemMapper.ToListResponse()` — enum conversion | Pending | Y |

---

## 7. ACASSERVICE — CONTROLLERS

### 7.1. TestAuthController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| TAC-01 | Valid JWT token | Token hợp lệ, chưa hết hạn | Trả về 200 OK với user info | `TestAuthController.TestAuth()` — valid token path | Pending | Y |
| TAC-02 | Invalid token format | Token không đúng format | Trả về 401 Unauthorized | `TestAuthController.TestAuth()` — invalid format | Pending | Y |
| TAC-03 | Expired token | Token đã hết hạn | Trả về 401 Unauthorized | `TestAuthController.TestAuth()` — expired token | Pending | Y |
| TAC-04 | Missing Authorization header | Header không có | Trả về 401 Unauthorized | `TestAuthController.TestAuth()` — missing header | Pending | Y |
| TAC-05 | Malformed Bearer token | "Bearer " không có token | Trả về 401 Unauthorized | `TestAuthController.TestAuth()` — malformed bearer | Pending | Y |

---

### 7.2. ExaminationController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| EC-01 | GET /examinations | Lấy danh sách exam | 200 OK, danh sách exam | `ExaminationController.GetAll()` — 200 OK | Pending | Y |
| EC-02 | GET /examinations/{id} | Exam tồn tại | 200 OK, exam details | `ExaminationController.GetById()` — 200 OK | Pending | Y |
| EC-03 | GET /examinations/{id} not found | Exam không tồn tại | 404 Not Found | `ExaminationController.GetById()` — 404 | Pending | Y |
| EC-04 | POST /examinations valid | Request hợp lệ | 201 Created, exam response | `ExaminationController.Create()` — 201 Created | Pending | Y |
| EC-05 | POST /examinations invalid | Request không hợp lệ | 400 Bad Request, validation errors | `ExaminationController.Create()` — 400 validation | Pending | Y |
| EC-06 | PUT /examinations/{id} | Update thành công | 200 OK | `ExaminationController.Update()` — 200 OK | Pending | Y |
| EC-07 | DELETE /examinations/{id} | Delete thành công | 204 No Content | `ExaminationController.Delete()` — 204 | Pending | Y |
| EC-08 | DELETE /examinations/{id} not found | Exam không tồn tại | 404 Not Found | `ExaminationController.Delete()` — 404 | Pending | Y |
| EC-09 | Unauthorized access | Không có token | 401 Unauthorized | `ExaminationController` — [Authorize] attribute | Pending | Y |

---

### 7.3. SubmissionController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| SC-01 | POST /submissions valid | Submit code hợp lệ | 201 Created, submission response | `SubmissionController.Submit()` — 201 Created | Pending | Y |
| SC-02 | POST /submissions invalid exam session | Exam session không active | 400 Bad Request | `SubmissionController.Submit()` — session validation | Pending | Y |
| SC-03 | POST /submissions empty source | Source = "" | 400 Bad Request | `SubmissionController.Submit()` — source validation | Pending | Y |
| SC-04 | GET /submissions/{id} | Submission tồn tại | 200 OK | `SubmissionController.GetById()` — 200 OK | Pending | Y |
| SC-05 | POST /submissions/bulk-grade | Bulk grading request | 200 OK, grading results | `SubmissionController.BulkGrade()` — 200 OK | Pending | Y |
| SC-06 | POST /submissions/{id}/regrade | Regrade request | 200 OK, new result | `SubmissionController.Regrade()` — 200 OK | Pending | Y |
| SC-07 | PUT /submissions/{id}/score override | Override score hợp lệ | 200 OK | `SubmissionController.OverrideScore()` — 200 OK | Pending | Y |
| SC-08 | PUT /submissions/{id}/score invalid | Score > maxMark | 400 Bad Request | `SubmissionController.OverrideScore()` — validation | Pending | Y |

---

### 7.4. ProblemController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| PC-01 | GET /problems | Lấy danh sách problem | 200 OK, paginated list | `ProblemController.GetAll()` — 200 OK | Pending | Y |
| PC-02 | GET /problems/{id} as lecturer | Lecturer lấy problem | 200 OK, có hidden testcases | `ProblemController.GetById()` — lecturer include hidden | Pending | Y |
| PC-03 | GET /problems/{id} as student | Student lấy problem | 200 OK, không có hidden testcases | `ProblemController.GetById()` — student exclude hidden | Pending | Y |
| PC-04 | POST /problems | Tạo problem hợp lệ | 201 Created | `ProblemController.Create()` — 201 Created | Pending | Y |
| PC-05 | POST /problems with duplicate name | Trùng tên | 400 Bad Request | `ProblemController.Create()` — duplicate name | Pending | Y |
| PC-06 | PUT /problems/{id} | Update thành công | 200 OK | `ProblemController.Update()` — 200 OK | Pending | Y |
| PC-07 | DELETE /problems/{id} | Delete thành công | 204 No Content | `ProblemController.Delete()` — 204 | Pending | Y |
| PC-08 | POST /problems/{id}/generate-testcases | Generate testcases | 200 OK, generated testcases | `ProblemController.GenerateTestcases()` — 200 OK | Pending | Y |
| PC-09 | POST /problems/import | Import file đúng format | 201 Created, problems được tạo | `ProblemController.Import()` — 201 Created | Pending | Y |
| PC-10 | POST /problems/import invalid format | File không đúng format | 400 Bad Request | `ProblemController.Import()` — 400 validation | Pending | Y |

---

### 7.5. ClassroomController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| CC-01 | GET /classrooms | Lấy danh sách | 200 OK | `ClassroomController.GetAll()` — 200 OK | Pending | Y |
| CC-02 | GET /classrooms/{id} | Classroom tồn tại | 200 OK, có student list | `ClassroomController.GetById()` — 200 OK | Pending | Y |
| CC-03 | POST /classrooms | Tạo classroom | 201 Created | `ClassroomController.Create()` — 201 Created | Pending | Y |
| CC-04 | POST /classrooms/{id}/students | Thêm sinh viên | 200 OK | `ClassroomController.AddStudent()` — 200 OK | Pending | Y |
| CC-05 | DELETE /classrooms/{id}/students/{studentId} | Xóa sinh viên | 204 No Content | `ClassroomController.RemoveStudent()` — 204 | Pending | Y |
| CC-06 | POST /classrooms/{id}/materials | Upload tài liệu | 200 OK | `ClassroomController.UploadMaterial()` — 200 OK | Pending | Y |

---

## 8. AUTHSERVICE — UTILS

### 8.1. JwtUtil

**Mục đích:** Tạo và xác thực JWT token.

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| JWT-01 | Generate token | Input userId, email, role hợp lệ | Token được tạo, chứa đúng claims | `JwtUtil.GenerateToken()` — success | Pending | Y |
| JWT-02 | Validate valid token | Token hợp lệ, chưa hết hạn | Trả về claims, không ném exception | `JwtUtil.ValidateToken()` — valid token | Pending | Y |
| JWT-03 | Validate expired token | Token đã hết hạn | Ném `SecurityTokenExpiredException` hoặc trả về claims với expired flag | `JwtUtil.ValidateToken()` — expired token | Pending | Y |
| JWT-04 | Validate invalid signature | Token bị sửa signature | Ném `SecurityTokenSignatureKeyNotFoundException` | `JwtUtil.ValidateToken()` — invalid signature | Pending | Y |
| JWT-05 | Validate malformed token | Token không đúng format | Ném exception | `JwtUtil.ValidateToken()` — malformed token | Pending | Y |
| JWT-06 | Extract userId from token | Token hợp lệ | userId được trích xuất đúng | `JwtUtil.ExtractUserId()` — extract claim | Pending | Y |
| JWT-07 | Extract role from token | Token hợp lệ | Role được trích xuất đúng | `JwtUtil.ExtractRole()` — extract role | Pending | Y |
| JWT-08 | Generate token with different roles | Role = STUDENT/LECTURER/ADMIN | Token chứa đúng role tương ứng | `JwtUtil.GenerateToken()` — role variation | Pending | Y |
| JWT-09 | Generate token null userId | userId = null | Ném `ArgumentNullException` | `JwtUtil.GenerateToken()` — null guard | Pending | Y |
| JWT-10 | Refresh token | Token gần hết hạn | Trả về token mới với expiry kéo dài | `JwtUtil.RefreshToken()` — refresh | Pending | Y |

---

### 8.2. HashingUtil

**Mục đích:** Hash và xác thực mật khẩu.

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| HH-01 | Hash password | Password hợp lệ | Hash được tạo, khác với plaintext | `HashingUtil.HashPassword()` — success | Pending | Y |
| HH-02 | Hash same password twice | Hash cùng password | 2 hash khác nhau (do salt) | `HashingUtil.HashPassword()` — salt uniqueness | Pending | Y |
| HH-03 | Verify correct password | Plaintext đúng | Trả về `true` | `HashingUtil.VerifyPassword()` — correct | Pending | Y |
| HH-04 | Verify wrong password | Plaintext sai | Trả về `false` | `HashingUtil.VerifyPassword()` — wrong | Pending | Y |
| HH-05 | Verify with wrong hash format | Hash không đúng format | Trả về `false` hoặc ném exception | `HashingUtil.VerifyPassword()` — wrong format | Pending | Y |
| HH-06 | Hash empty password | Password = "" | Hash được tạo, không crash | `HashingUtil.HashPassword()` — empty password | Pending | Y |
| HH-07 | Hash null password | Password = null | Ném `ArgumentNullException` | `HashingUtil.HashPassword()` — null guard | Pending | Y |
| HH-08 | Hash with special characters | Password = "P@$$w0rd!#$%" | Hash + verify đều hoạt động đúng | `HashingUtil` — special char handling | Pending | Y |
| HH-09 | Hash long password | Password > 100 ký tự | Hash + verify hoạt động đúng | `HashingUtil` — long password | Pending | Y |

---

### 8.3. GoogleTokenVerifier

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| GTV-01 | Valid Google ID token | Token từ Google hợp lệ | Trả về Google user info (email, name, picture) | `GoogleTokenVerifier.VerifyAsync()` — valid token | Pending | Y |
| GTV-02 | Invalid token | Token không phải từ Google | Ném `InvalidTokenException` | `GoogleTokenVerifier.VerifyAsync()` — invalid token | Pending | Y |
| GTV-03 | Expired token | Token đã hết hạn | Ném `TokenExpiredException` | `GoogleTokenVerifier.VerifyAsync()` — expired | Pending | Y |
| GTV-04 | Token missing email claim | Token không có email | Ném exception hoặc trả về user info không có email | `GoogleTokenVerifier.VerifyAsync()` — missing email | Pending | Y |
| GTV-05 | Null token | token = null | Ném `ArgumentNullException` | `GoogleTokenVerifier.VerifyAsync()` — null guard | Pending | Y |

---

### 8.4. OtpUtil (Cần tạo mới)

**Mục đích:** Tạo và xác thực OTP 6 chữ số cho email verification.

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| OTP-01 | Generate OTP | Tạo OTP mới | Trả về chuỗi 6 chữ số (000000-999999) | `OtpUtil.Generate()` — 6 digits | Pending | Y |
| OTP-02 | Generate multiple OTPs | Tạo 100 OTP | Tất cả đều 6 chữ số, có thể trùng (xác suất thấp) | `OtpUtil.Generate()` — uniqueness | Pending | Y |
| OTP-03 | Verify correct OTP | OTP đúng, chưa hết hạn | Trả về `true` | `OtpUtil.Verify()` — correct OTP | Pending | Y |
| OTP-04 | Verify wrong OTP | OTP sai | Trả về `false` | `OtpUtil.Verify()` — wrong OTP | Pending | Y |
| OTP-05 | Verify expired OTP | OTP đã quá thời gian hiệu lực | Trả về `false` | `OtpUtil.Verify()` — expired OTP | Pending | Y |
| OTP-06 | Verify after max attempts | Retry > 3 lần | Trả về `false`, OTP bị vô hiệu hóa | `OtpUtil.Verify()` — max attempts | Pending | Y |
| OTP-07 | Resend OTP | Gửi lại OTP mới | OTP cũ bị vô hiệu, OTP mới được tạo | `OtpUtil.Resend()` — resend | Pending | Y |
| OTP-08 | Verify null OTP | otp = null | Ném exception | `OtpUtil.Verify()` — null guard | Pending | Y |
| OTP-09 | OTP length check | Kiểm tra độ dài | Luôn đúng 6 ký tự số | `OtpUtil.Generate()` — length validation | Pending | Y |

---

## 9. AUTHSERVICE — COMMANDS

### 9.1. UserCommand

#### `CreateUserAsync(RegisterData registerData)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-01 | Create successfully | Email chưa tồn tại, dữ liệu hợp lệ | User được tạo, trả về AuthResponse | `UserCommand.CreateUserAsync()` — success path | Pending | Y |
| UC-02 | Email already exists | Email đã tồn tại | Ném `InvalidOperationException` "User with this email already exists" | `UserCommand.CreateUserAsync()` — duplicate check | Pending | Y |
| UC-03 | Invalid role | registerData.Role = "INVALID_ROLE" | Ném `ArgumentException` | `UserCommand.CreateUserAsync()` — role validation | Pending | Y |
| UC-04 | Empty email | email = "" | Ném `ArgumentException` | `UserCommand.CreateUserAsync()` — email validation | Pending | Y |
| UC-05 | Empty password | password = "" | Ném `ArgumentException` | `UserCommand.CreateUserAsync()` — password validation | Pending | Y |
| UC-06 | Weak password | password = "123" | Tùy policy — ném exception nếu không đủ mạnh | `UserCommand.CreateUserAsync()` — password strength | Pending | Y |

#### `RegisterWithEmailVerificationAsync(RegisterData registerData)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-07 | Register and send email | Email hợp lệ, chưa tồn tại | OTP được tạo, email được gửi, trả về message | `UserCommand.RegisterWithEmailVerificationAsync()` — success | Pending | Y |
| UC-08 | Email already exists | Email đã tồn tại | Ném exception | `UserCommand.RegisterWithEmailVerificationAsync()` — duplicate check | Pending | Y |
| UC-09 | Email service failure | Email gửi thất bại | User vẫn được tạo, OTP vẫn lưu, cảnh báo được ghi | `UserCommand.RegisterWithEmailVerificationAsync()` — email failure | Pending | Y |
| UC-10 | OTP stored in cache | OTP được lưu đúng key (email) | Có thể retrieve để verify | `UserCommand.RegisterWithEmailVerificationAsync()` — OTP cache | Pending | Y |

#### `VerifyEmailAsync(VerifyEmailRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-11 | Correct OTP | OTP đúng, chưa hết hạn, chưa verified | IsEmailVerified = true | `UserCommand.VerifyEmailAsync()` — correct OTP | Pending | Y |
| UC-12 | Wrong OTP | OTP sai | Trả về `false` | `UserCommand.VerifyEmailAsync()` — wrong OTP | Pending | Y |
| UC-13 | Expired OTP | OTP đã hết hạn (> 5 phút) | Trả về `false` | `UserCommand.VerifyEmailAsync()` — expired OTP | Pending | Y |
| UC-14 | Already verified | User đã verify trước đó | Trả về `false` hoặc idempotent | `UserCommand.VerifyEmailAsync()` — already verified | Pending | Y |
| UC-15 | Max retry exceeded | Thử sai OTP > 5 lần | OTP bị vô hiệu, cần resend | `UserCommand.VerifyEmailAsync()` — max retry | Pending | Y |
| UC-16 | Email not found | Email không tồn tại trong OTP cache | Trả về `false` | `UserCommand.VerifyEmailAsync()` — not found | Pending | Y |

#### `SendForgotPasswordLinkAsync(ForgotPasswordRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-17 | User exists, email sent | User tồn tại | Email reset được gửi, trả về `true` | `UserCommand.SendForgotPasswordLinkAsync()` — user found | Pending | Y |
| UC-18 | User not found | Email không tồn tại | Trả về `true` (không tiết lộ user có tồn tại hay không — security) | `UserCommand.SendForgotPasswordLinkAsync()` — user not found | Pending | Y |
| UC-19 | Email service failure | Gửi email thất bại | Ghi log, vẫn trả về `true` (không leak thông tin) | `UserCommand.SendForgotPasswordLinkAsync()` — email failure | Pending | Y |

#### `ResetPasswordAsync(ResetPasswordRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-20 | Valid token, valid password | Token hợp lệ, password đủ mạnh | Password được cập nhật, token bị vô hiệu | `UserCommand.ResetPasswordAsync()` — success | Pending | Y |
| UC-21 | Invalid token | Token không hợp lệ | Ném exception "Invalid or expired token" | `UserCommand.ResetPasswordAsync()` — invalid token | Pending | Y |
| UC-22 | Expired token | Token đã hết hạn | Ném exception | `UserCommand.ResetPasswordAsync()` — expired token | Pending | Y |
| UC-23 | Weak password format | Password không đủ mạnh | Ném exception với thông báo yêu cầu | `UserCommand.ResetPasswordAsync()` — weak password | Pending | Y |
| UC-24 | Token already used | Token đã được sử dụng | Ném exception "Token already used" | `UserCommand.ResetPasswordAsync()` — token used | Pending | Y |
| UC-25 | Password same as old | Password mới = password cũ | Ném exception "New password cannot be same as old password" | `UserCommand.ResetPasswordAsync()` — same password | Pending | Y |

#### `GrantAccountAsync(GrantAccountRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-26 | Grant successfully | Admin cấp quyền hợp lệ | User được cấp quyền, trả về response | `UserCommand.GrantAccountAsync()` — success | Pending | Y |
| UC-27 | User not found | userId không tồn tại | Ném exception | `UserCommand.GrantAccountAsync()` — user not found | Pending | Y |
| UC-28 | Role conflict | Gán role không hợp lệ với email | Ném exception | `UserCommand.GrantAccountAsync()` — role conflict | Pending | Y |

#### `ResetFirstLoginPasswordAsync(ResetFirstLoginPasswordRequest request)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-29 | First login reset | User.IsFirstLogin = true | Password được reset, IsFirstLogin = false | `UserCommand.ResetFirstLoginPasswordAsync()` — first login | Pending | Y |
| UC-30 | Not first login | User.IsFirstLogin = false | Ném `InvalidOperationException` | `UserCommand.ResetFirstLoginPasswordAsync()` — not first login | Pending | Y |
| UC-31 | Wrong current password | CurrentPassword sai | Ném exception | `UserCommand.ResetFirstLoginPasswordAsync()` — wrong password | Pending | Y |
| UC-32 | Weak new password | NewPassword không đủ mạnh | Ném exception | `UserCommand.ResetFirstLoginPasswordAsync()` — weak password | Pending | Y |

#### `UpdateUserAsync`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-33 | Update successfully | userId tồn tại, dữ liệu hợp lệ | User được cập nhật, trả về UserProfileResponse | `UserCommand.UpdateUserAsync()` — success | Pending | Y |
| UC-34 | Update non-existent user | userId không tồn tại | Ném exception | `UserCommand.UpdateUserAsync()` — not found | Pending | Y |
| UC-35 | Update role to invalid | role = "INVALID" | Ném `ArgumentException` | `UserCommand.UpdateUserAsync()` — role validation | Pending | Y |
| UC-36 | Disable user | isEnable = false | User.IsEnable = false | `UserCommand.UpdateUserAsync()` — disable user | Pending | Y |

#### `UpdateProfileAsync`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UC-37 | Update profile successfully | Token hợp lệ | Profile được cập nhật | `UserCommand.UpdateProfileAsync()` — success | Pending | Y |
| UC-38 | Invalid token | Token không hợp lệ | Ném exception | `UserCommand.UpdateProfileAsync()` — invalid token | Pending | Y |
| UC-39 | Update avatar URL | avatarUrl hợp lệ | AvatarUrl được cập nhật | `UserCommand.UpdateProfileAsync()` — avatar update | Pending | Y |
| UC-40 | Update birthday | birthday hợp lệ | Birthday được cập nhật | `UserCommand.UpdateProfileAsync()` — birthday update | Pending | Y |

---

## 10. AUTHSERVICE — QUERIES

### 10.1. UserQuery

#### `AuthenticateAsync(LoginCredentials credentials)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UQ-01 | Valid credentials | Email và password đúng | Trả về AuthResponse với JWT token | `UserQuery.AuthenticateAsync()` — success | Pending | Y |
| UQ-02 | User not found | Email không tồn tại | Ném `InvalidOperationException` "Invalid email or password" | `UserQuery.AuthenticateAsync()` — user not found | Pending | Y |
| UQ-03 | Wrong password | Password sai | Ném `InvalidOperationException` "Invalid email or password" | `UserQuery.AuthenticateAsync()` — wrong password | Pending | Y |
| UQ-04 | User disabled | IsEnable = false | Ném `InvalidOperationException` "User is forbidden" | `UserQuery.AuthenticateAsync()` — disabled user | Pending | Y |
| UQ-05 | Email not verified | IsEmailVerified = false | Tùy business rule — ném exception hoặc cho đăng nhập với cảnh báo | `UserQuery.AuthenticateAsync()` — email not verified | Pending | Y |
| UQ-06 | Empty email | email = "" | Ném `ArgumentException` | `UserQuery.AuthenticateAsync()` — email validation | Pending | Y |
| UQ-07 | Empty password | password = "" | Ném `ArgumentException` | `UserQuery.AuthenticateAsync()` — password validation | Pending | Y |
| UQ-08 | Case sensitivity email | Email = "USER@EMAIL.COM" | Tìm thấy user với email "user@email.com" (case-insensitive) | `UserQuery.AuthenticateAsync()` — case insensitive email | Pending | Y |

#### `AuthenticateWithGoogleAsync(string idToken)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UQ-09 | New Google user | Google user chưa có trong hệ thống | Tạo user mới, trả về AuthResponse | `UserQuery.AuthenticateWithGoogleAsync()` — new user | Pending | Y |
| UQ-10 | Existing Google user | Google user đã có | Đăng nhập thành công | `UserQuery.AuthenticateWithGoogleAsync()` — existing user | Pending | Y |
| UQ-11 | Invalid Google token | Token không hợp lệ | Ném exception | `UserQuery.AuthenticateWithGoogleAsync()` — invalid token | Pending | Y |
| UQ-12 | Google token expired | Token đã hết hạn | Ném exception | `UserQuery.AuthenticateWithGoogleAsync()` — expired token | Pending | Y |
| UQ-13 | Null token | token = null | Ném `ArgumentNullException` | `UserQuery.AuthenticateWithGoogleAsync()` — null guard | Pending | Y |

#### `GetProfileAsync(string accessToken)`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UQ-14 | Valid token | Token hợp lệ | Trả về UserProfileResponse đầy đủ | `UserQuery.GetProfileAsync()` — success | Pending | Y |
| UQ-15 | Invalid token | Token không hợp lệ | Ném exception | `UserQuery.GetProfileAsync()` — invalid token | Pending | Y |
| UQ-16 | Expired token | Token đã hết hạn | Ném exception | `UserQuery.GetProfileAsync()` — expired token | Pending | Y |
| UQ-17 | Token missing userId claim | Token không có userId | Ném exception | `UserQuery.GetProfileAsync()` — missing claim | Pending | Y |

#### `GetAllUsersAsync()`

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| UQ-18 | Get all users | Lấy tất cả user | Trả về danh sách đầy đủ | `UserQuery.GetAllUsersAsync()` — all users | Pending | Y |
| UQ-19 | Pagination | PageSize = 20, Page = 1 | Đúng 20 users, có pagination metadata | `UserQuery.GetAllUsersAsync()` — pagination | Pending | Y |
| UQ-20 | Filter by role | Role = STUDENT | Chỉ trả về student | `UserQuery.GetAllUsersAsync()` — role filter | Pending | Y |
| UQ-21 | Filter by isEnable | isEnable = false | Chỉ trả về user bị vô hiệu | `UserQuery.GetAllUsersAsync()` — isEnable filter | Pending | Y |
| UQ-22 | Search by name | keyword = "John" | Trả về user có "John" trong fullname | `UserQuery.GetAllUsersAsync()` — name search | Pending | Y |
| UQ-23 | Search by email | keyword = "@fpt.edu.vn" | Trả về user có email chứa domain đó | `UserQuery.GetAllUsersAsync()` — email search | Pending | Y |

---

## 11. AUTHSERVICE — CONTROLLERS

### 11.1. AuthCommandController

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| ACC-01 | POST /register valid | Request hợp lệ | 201 Created, user info | `AuthCommandController.Register()` — 201 | Pending | Y |
| ACC-02 | POST /register email exists | Email đã tồn tại | 409 Conflict | `AuthCommandController.Register()` — 409 Conflict | Pending | Y |
| ACC-03 | POST /register missing fields | Thiếu email/password | 400 Bad Request, validation errors | `AuthCommandController.Register()` — 400 validation | Pending | Y |
| ACC-04 | POST /login valid | Credentials hợp lệ | 200 OK, JWT token | `AuthCommandController.Login()` — 200 OK | Pending | Y |
| ACC-05 | POST /login wrong password | Password sai | 401 Unauthorized | `AuthCommandController.Login()` — 401 | Pending | Y |
| ACC-06 | POST /login user disabled | IsEnable = false | 403 Forbidden | `AuthCommandController.Login()` — 403 | Pending | Y |
| ACC-07 | POST /login user not found | Email không tồn tại | 401 Unauthorized | `AuthCommandController.Login()` — 401 | Pending | Y |
| ACC-08 | POST /verify-email valid | OTP đúng | 200 OK, email verified | `AuthCommandController.VerifyEmail()` — 200 OK | Pending | Y |
| ACC-09 | POST /verify-email wrong OTP | OTP sai | 400 Bad Request | `AuthCommandController.VerifyEmail()` — 400 | Pending | Y |
| ACC-10 | POST /forgot-password | Email hợp lệ | 200 OK, email sent | `AuthCommandController.ForgotPassword()` — 200 OK | Pending | Y |
| ACC-11 | POST /forgot-password email not found | Email không tồn tại | 200 OK (không leak thông tin) | `AuthCommandController.ForgotPassword()` — no leak | Pending | Y |
| ACC-12 | POST /reset-password valid | Token + password hợp lệ | 200 OK | `AuthCommandController.ResetPassword()` — 200 OK | Pending | Y |
| ACC-13 | POST /reset-password invalid token | Token không hợp lệ | 400 Bad Request | `AuthCommandController.ResetPassword()` — 400 | Pending | Y |
| ACC-14 | POST /grant-account | Admin cấp quyền hợp lệ | 200 OK | `AuthCommandController.GrantAccount()` — 200 OK | Pending | Y |
| ACC-15 | POST /grant-account unauthorized | Không phải admin | 403 Forbidden | `AuthCommandController.GrantAccount()` — 403 | Pending | Y |
| ACC-16 | POST /google-auth | Google token hợp lệ | 200 OK, JWT token | `AuthCommandController.GoogleAuth()` — 200 OK | Pending | Y |
| ACC-17 | GET /profile | Token hợp lệ | 200 OK, profile info | `AuthCommandController.GetProfile()` — 200 OK | Pending | Y |
| ACC-18 | PUT /profile | Update profile hợp lệ | 200 OK | `AuthCommandController.UpdateProfile()` — 200 OK | Pending | Y |
| ACC-19 | GET /users | Admin lấy danh sách | 200 OK | `AuthCommandController.GetAllUsers()` — 200 OK | Pending | Y |
| ACC-20 | GET /users unauthorized | Không có quyền | 403 Forbidden | `AuthCommandController.GetAllUsers()` — 403 | Pending | Y |

---

## 12. WEB APP — UTILS

### 12.1. datetime-utils.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi | Confirm | Status | R |
|----|----------|---------------|-------------------|--------|--------|---|
| DTU-01 | Format date to string | Input Date object hợp lệ | Trả về string theo format quy định | `datetime-utils.ts` — formatDate() | Pending | Y |
| DTU-02 | Format with locale | Locale = "vi-VN" | Định dạng đúng theo locale Việt Nam | `datetime-utils.ts` — formatDate() locale | Pending | Y |
| DTU-03 | Parse date string | Input string hợp lệ | Trả về Date object đúng | `datetime-utils.ts` — parseDate() | Pending | Y |
| DTU-04 | Parse invalid date string | Input = "invalid" | Trả về `null` hoặc throw | `datetime-utils.ts` — parseDate() invalid | Pending | Y |
| DTU-05 | Calculate time remaining | Input exam end time > now | Trả về số giây/phút còn lại | `datetime-utils.ts` — getTimeRemaining() | Pending | Y |
| DTU-06 | Time remaining expired | Input exam đã kết thúc | Trả về 0 hoặc số âm | `datetime-utils.ts` — getTimeRemaining() expired | Pending | Y |
| DTU-07 | Format duration | Input = 3661 giây | Trả về "1h 1m 1s" | `datetime-utils.ts` — formatDuration() | Pending | Y |
| DTU-08 | Format countdown | Input = 60000ms | Trả về "00:01:00" | `datetime-utils.ts` — formatCountdown() | Pending | Y |
| DTU-09 | Convert timezone | UTC → local time | Giờ được convert đúng | `datetime-utils.ts` — convertTimezone() | Pending | Y |
| DTU-10 | Null/undefined date | Input = null | Xử lý không crash, trả về giá trị mặc định | `datetime-utils.ts` — null guard | Pending | Y |

---

### 12.2. student-exam-session.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| SES-01 | Get session from localStorage | Session đã lưu | Trả về session đúng |
| SES-02 | Get session, none stored | localStorage rỗng | Trả về `null` |
| SES-03 | Save session to localStorage | Session object hợp lệ | Session được lưu, có thể đọc lại |
| SES-04 | Clear session | Gọi hàm clear | localStorage được xóa session |
| SES-05 | Check session expired | Session hết hạn | Trả về `true` |
| SES-06 | Check session valid | Session còn hiệu lực | Trả về `false` |
| SES-07 | Calculate remaining time | Session start + duration | Trả về số giây còn lại |
| SES-08 | Sync session with server | Có session cũ, server có session mới | Cập nhật localStorage với server session |

---

### 12.3. markdown-converter.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| MDC-01 | Convert basic markdown | Input = "**bold** *italic*" | Output chứa `<strong>` và `<em>` |
| MDC-02 | Convert code block | Input = "```python\nprint('hi')\n```" | Output có `<pre><code class="language-python">` |
| MDC-03 | Convert inline code | Input = "`code`" | Output có `<code>` |
| MDC-04 | Convert link | Input = "[Google](https://google.com)" | Output có `<a href="...">` |
| MDC-05 | Convert table | Input = markdown table | Output có `<table>` đúng cấu trúc |
| MDC-06 | Convert empty string | Input = "" | Output = "" |
| MDC-07 | XSS prevention | Input = `<script>alert('xss')</script>` | Script bị loại bỏ hoặc escaped |
| MDC-08 | Convert with GFM | GFM tables, strikethrough | Render đúng GFM |

---

### 12.4. markdown-formatter.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| MDF-01 | Format plain text | Input = "plain text" | Output = "plain text" |
| MDF-02 | Insert bold | Chọn text, gọi format bold | Markdown `**text**` được chèn đúng |
| MDF-03 | Insert italic | Chọn text, gọi format italic | Markdown `*text*` được chèn đúng |
| MDF-04 | Insert code block | Chọn text, gọi format code | Markdown ```` ``` ```` được chèn |
| MDF-05 | Insert link | Chọn text, gọi format link | Markdown `[text](url)` được chèn |
| MDF-06 | Insert list | Gọi format list | Markdown list được chèn đúng |
| MDF-07 | No selection for inline format | Không chọn text | Không chèn gì hoặc chèn placeholder |
| MDF-08 | Wrap selected text | Text được chọn | Text được wrap đúng |

---

### 12.5. test-tracker/storageKeys.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| TTS-01 | Generate storage key | examId + studentId | Key đúng format |
| TTS-02 | Key uniqueness | 2 examId khác nhau | 2 key khác nhau |
| TTS-03 | Empty examId | examId = "" | Key được tạo với empty part |

---

### 12.6. exam-log-flag.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| ELF-01 | Flag copy-paste | Nhiều paste trong thời gian ngắn | Suspicious flag = true |
| ELF-02 | Normal copy-paste | Ít paste bình thường | Suspicious flag = false |
| ELF-03 | Flag tab switch | Nhiều lần chuyển tab | Suspicious flag = true |
| ELF-04 | Flag right-click | Nhiều lần right-click | Suspicious flag = true |
| ELF-05 | Combined flags | Copy + tab switch + paste | Flag count tăng đúng |
| ELF-06 | Reset flags | Gọi reset | Flag count = 0 |

---

### 12.7. exam-problem.ts

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| EP-01 | Parse problem data | Raw problem JSON | Parsed object đúng structure |
| EP-02 | Validate problem structure | Missing required fields | Trả về validation error |
| EP-03 | Calculate problem score | problem.mark, testCases passed | Điểm được tính đúng |

---

## 13. WEB APP — HOOKS

### 13.1. hooks/exam/

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| EXH-01 | Start exam successfully | Gọi API bắt đầu thi | Session được tạo, state = "active" |
| EXH-02 | Start already started exam | Thi đã bắt đầu | Trả về session hiện tại |
| EXH-03 | Start completed exam | Exam đã kết thúc | Ném error, state = "expired" |
| EXH-04 | Auto-save answer | Gọi auto-save | Answer được lưu lên server |
| EXH-05 | Submit exam | Gọi submit | State = "submitted", không submit lại được |
| EXH-06 | Handle time warning | Còn 5 phút | Warning được trigger |
| EXH-07 | Handle time expired | Hết giờ | Tự động submit |
| EXH-08 | Handle API error | API trả về lỗi | Error state được set, retry logic |

---

### 13.2. hooks/submission/

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| SUBH-01 | Submit code successfully | Code hợp lệ | Submission được tạo, state = "submitted" |
| SUBH-02 | Submit with compilation error | Code lỗi compile | Error được trả về, state = "error" |
| SUBH-03 | Submit during exam inactive | Exam không active | Ném error |
| SUBH-04 | Get submission history | Lấy lịch sử nộp | Danh sách submission được trả về |
| SUBH-05 | Re-submit code | Nộp lại bài | Version tăng, submission mới được tạo |

---

### 13.3. hooks/coding/

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| CDH-01 | Initialize editor | Mở code editor | Monaco editor được khởi tạo với đúng language |
| CDH-02 | Change language | Chọn Python | Editor language = python, template code thay đổi |
| CDH-03 | Auto-save code | Gõ code | Code được auto-save vào localStorage |
| CDH-04 | Load saved code | Có code trong localStorage | Code được load vào editor |
| CDH-05 | Format code | Gọi format | Code được format theo clang-format |
| CDH-06 | Reset code | Gọi reset | Code quay về template ban đầu |

---

### 13.4. hooks/problem/

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| PH-01 | Fetch problem list | Gọi API lấy danh sách | Problems được set vào state |
| PH-02 | Filter by subject | Chọn subject filter | Chỉ hiển thị problem thuộc subject đó |
| PH-03 | Filter by difficulty | Chọn difficulty filter | Kết quả đúng filter |
| PH-04 | Search problems | Nhập keyword | Problems phù hợp được trả về |
| PH-05 | Pagination | Page change | Đúng page data |
| PH-06 | Empty result | Filter không có kết quả | Empty state được hiển thị |
| PH-07 | API error | API trả về 500 | Error state được set |

---

## 14. MOBILE APP

### 14.1. Unit Tests (core/utils/)

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| MA-01 | Date formatting | Format date sang "dd/MM/yyyy" | Output đúng format Việt Nam |
| MA-02 | Countdown timer | Input giây còn lại | Format "HH:mm:ss" đúng |
| MA-03 | Validate email | Email hợp lệ / không hợp lệ | Trả về true/false đúng |
| MA-04 | Validate password strength | Password yếu/mạnh | Trả về strength level đúng |
| MA-05 | API response parsing | JSON response hợp lệ | Object được parse đúng |
| MA-06 | Null handling | Input null | Xử lý không crash |

### 14.2. Widget Tests

| ID | Tên case | Mô tả hành vi | Kết quả mong đợi |
|----|----------|---------------|-------------------|
| MA-07 | Login page renders | Mở trang login | Email/password fields hiển thị |
| MA-08 | Login validation | Bỏ trống email | Error message hiển thị |
| MA-09 | Login success | Credentials đúng | Chuyển sang trang chính |
| MA-10 | Login failure | Credentials sai | Error message hiển thị |
| MA-11 | Exam page renders | Mở trang thi | Timer, câu hỏi hiển thị |
| MA-12 | Answer selection | Tap vào đáp án | Đáp án được chọn, highlight đúng |
| MA-13 | Submit exam | Tap nộp bài | Confirmation dialog hiển thị |
| MA-14 | Navigation to detail | Tap vào item | Chuyển trang detail |
| MA-15 | Pull to refresh | Kéo refresh | Data được reload |

---

## TỔNG HỢP SỐ LƯỢNG TEST CASE

| Module | Số lượng test case |
|--------|-------------------|
| AcasService — Utils | 17 + 9 = 26 |
| AcasService — Jobs | 23 |
| AcasService — Commands | ~100+ |
| AcasService — Queries | ~60+ |
| AcasService — Mappers | ~15 |
| AcasService — Controllers | ~35+ |
| AuthService — Utils | 10 + 9 + 5 + 9 = 33 |
| AuthService — Commands | ~40 |
| AuthService — Queries | ~23 |
| AuthService — Controllers | ~20 |
| Web App — Utils | ~30 |
| Web App — Hooks | ~20 |
| Mobile App | ~15 |
| **Tổng cộng** | **~450+ test cases** |
