# Classroom Dashboard Statistics

Tài liệu này mô tả các loại đánh giá/thống kê có trong `ClassroomDashboardQuery.cs` phục vụ Dashboard của lớp học.

---

## 1. Score Distribution (Phân bố điểm)

**Method:** `GetScoreDistributionAsync(string classroomId, string? mode = null)`

**Mục đích:** Phân bố điểm của tất cả sinh viên trong lớp theo các khoảng điểm.

**Logic:**
- Lấy danh sách sinh viên đã enroll trong lớp
- Lấy tất cả exams của lớp, lọc theo `mode` nếu có (EXAMINATION / PRACTICAL)
- Thu thập tất cả submissions của từng sinh viên, filter theo exam đã lọc
- **Không lọc version** — lấy **tất cả submissions** (tất cả versions)

> ⚠️ **Lưu ý quan trọng về Version Filtering:**
> - `GetScoreDistributionAsync`: **KHÔNG** lọc version — tất cả submissions (v1, v2, v3...) đều được đếm
> - `GetExamScoreStatisticsAsync`: **CÓ** lọc — chỉ lấy submission version cao nhất của mỗi sinh viên
> - `GetAtRiskStudentsAsync`: **CÓ** lọc — chỉ lấy submission version cao nhất của mỗi sinh viên
>
> Điều này có thể dẫn đến `ScoreDistribution` có số lượng cao hơn thực tế nếu sinh viên nộp nhiều lần.

**Response: `ScoreDistributionItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `Range` | string | Khoảng điểm: "9-10", "7-8", "5-6", "3-4", "0-2" |
| `Count` | int | Số lượng submissions trong khoảng |
| `Percentage` | float | Tỷ lệ phần trăm (%) |

> **Lưu ý:** Trường `Color` đã được di chuyển sang **frontend**. Backend chỉ trả về `Range`, `Count`, `Percentage`. Frontend sử dụng `getScoreColor(range)` từ `types/dashboard/scoreColors.ts` để map màu:
> - `9-10`: `#22C55E` (green)
> - `7-8`: `#3B82F6` (blue)
> - `5-6`: `#FACC15` (yellow)
> - `3-4`: `#F97316` (orange)
> - `0-2`: `#EF4444` (red)

---

## 2. At-Risk Students (Sinh viên có nguy cơ)

**Method:** `GetAtRiskStudentsAsync(string classroomId, int limit)`

**Mục đích:** Xác định và liệt kê sinh viên có nguy cơ thấp (điểm trung bình < 5).

**Logic:**
- Lấy tất cả sinh viên trong lớp
- Lấy submissions và warnings của mỗi sinh viên
- **Có lọc version** — chỉ lấy submission version cao nhất của mỗi sinh viên
- Tính điểm trung bình của mỗi sinh viên
- Filter: `averageScore < 5f`
- Sắp xếp theo điểm trung bình tăng dần
- Giới hạn kết quả theo `limit`

> ℹ️ **Version Filtering:** Method này **CÓ** lọc version — chỉ lấy submission mới nhất (version cao nhất) của mỗi sinh viên để tính điểm trung bình.

**Response: `AtRiskStudentItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `StudentId` | string | ID sinh viên |
| `StudentName` | string | Tên đầy đủ |
| `Email` | string | Email sinh viên |
| `RoleNumber` | string | Mã số sinh viên |
| `AverageScore` | float | Điểm trung bình (0-10) |
| `RiskLevel` | string | Mức độ rủi ro: "HIGH" (<3), "MEDIUM" (3-5), "LOW" (>=5) |
| `WarningLevel` | int | Cấp độ cảnh báo: 0 (không), 1 (1 warning), 2 (>=2 warnings) |
| `Trend` | string | Xu hướng điểm: "improving", "stable", "declining" |
| `WarningCount` | int | Số lượng academic warnings |
| `ClassroomId` | string | ID lớp học |
| `ClassroomName` | string | Tên lớp học |

**Risk Level Logic:**
```csharp
if (averageScore < 3) return "HIGH";
if (averageScore < 5) return "MEDIUM";
return "LOW";
```

**Trend Logic:**
- So sánh trung bình nửa đầu vs nửa sau của các submissions (theo thứ tự điểm)
- `improving`: diff > 0.5
- `declining`: diff < -0.5
- `stable`: ngược lại

---

## 3. Recent Warnings (Cảnh báo gần đây)

**Method:** `GetRecentWarningsAsync(string classroomId, int limit)`

**Mục đích:** Hiển thị các cảnh báo học tập (Academic Warnings) gần đây nhất trong lớp.

**Logic:**
- Lấy tất cả warnings của lớp từ `AcademicWarningRepository`
- Sắp xếp theo `SentDate` giảm dần
- Giới hạn kết quả theo `limit`
- Join với thông tin sinh viên qua `UserRequestProducer`

**Response: `RecentWarningItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `WarningId` | string | ID của warning |
| `StudentName` | string | Tên sinh viên nhận cảnh báo |
| `ClassName` | string | Tên lớp học |
| `WarningLevel` | int | Cấp độ cảnh báo (1 hoặc 2) |
| `Message` | string | Nội dung cảnh báo |
| `CreatedAt` | DateTime | Thời gian gửi cảnh báo |
| `IsRead` | bool | Đã đọc chưa |

---

## 4. Class Stats (Thống kê lớp)

**Method:** `GetClassStatsAsync(string? classroomId)`

**Mục đích:** Tổng hợp thông tin thống kê của một hoặc tất cả các lớp.

**Logic:**
- Nếu `classroomId` null hoặc "all": thống kê tất cả lớp
- Nếu có `classroomId`: chỉ thống kê lớp đó
- Tính toán: sĩ số, điểm trung bình, số at-risk

**Response: `ClassStatsItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `ClassId` | string | ID lớp học |
| `ClassName` | string | Tên lớp học |
| `TotalStudents` | int | Tổng số sinh viên đã enroll |
| `ClassAverage` | float | Điểm trung bình của lớp (0-10) |
| `AtRiskCount` | int | Số sinh viên có nguy cơ (avg < 5) |

---

## 5. Exam Score Statistics (Thống kê điểm thi)

**Method:** `GetExamScoreStatisticsAsync(string classroomId, string? examId = null)`

**Mục đích:** Thống kê chi tiết điểm số của một hoặc nhiều bài thi trong lớp.

**Logic:**
- Lấy danh sách các bài thi của lớp (hoặc 1 bài thi cụ thể nếu có `examId`)
- Với mỗi bài thi:
  - Lấy submissions của sinh viên
  - **Có lọc version** — chỉ lấy submission **mới nhất** (version cao nhất) của mỗi sinh viên
  - Chỉ lấy submissions có `Status == GRADED`
  - Tính: average, highest, lowest, median, pass rate, submission rate

> ℹ️ **Version Filtering:** Method này **CÓ** lọc version — chỉ lấy submission mới nhất (version cao nhất) của mỗi sinh viên để đảm bảo thống kê không bị lặp.

**Response: `ExamScoreStatisticsItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `ExamId` | string | ID bài thi |
| `ExamName` | string | Tên bài thi |
| `TotalMark` | float | Thang điểm tối đa (default 10) |
| `AverageScore` | float | Điểm trung bình |
| `HighestScore` | float | Điểm cao nhất |
| `LowestScore` | float | Điểm thấp nhất |
| `MedianScore` | float | Điểm trung vị |
| `TotalSubmissions` | int | Tổng số bài nộp |
| `TotalStudents` | int | Tổng số sinh viên đã enroll |
| `SubmissionRate` | float | Tỷ lệ nộp bài (%) |
| `PassRate` | float | Tỷ lệ đạt (>= 5 điểm) (%) |
| `StartDatetime` | DateTime | Thời gian bắt đầu thi |
| `EndDatetime` | DateTime | Thời gian kết thúc thi |
| `ScoreDistribution` | List<`ExamScoreDistributionItem`> | Phân bố điểm chi tiết |

**Nested: `ExamScoreDistributionItem`**
| Field | Type | Mô tả |
|-------|------|--------|
| `Range` | string | Khoảng điểm |
| `Count` | int | Số lượng |
| `Percentage` | float | Tỷ lệ % |

> **Lưu ý:** Trường `Color` đã được di chuyển sang **frontend**. Xem chi tiết ở mục 1.

**Ngưỡng Pass:** `passingScoreThreshold = 5f` (>= 5 điểm = đạt)

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/classrooms/{classroomId}/dashboard/score-distribution` | Phân bố điểm lớp |
| `GET` | `/api/v1/classrooms/{classroomId}/dashboard/at-risk?limit=10` | Sinh viên at-risk |
| `GET` | `/api/v1/classrooms/{classroomId}/dashboard/warnings?limit=10` | Cảnh báo gần đây |
| `GET` | `/api/v1/classrooms/dashboard/stats?classroomId=...` | Thống kê lớp |
| `GET` | `/api/v1/classrooms/{classroomId}/dashboard/exam-statistics?examId=...` | Thống kê điểm thi |

---

## 7. Các Helper Methods

### GetScoreRange
```csharp
private static string GetScoreRange(float score)
{
    if (score >= 9) return "9-10";
    if (score >= 7) return "7-8";
    if (score >= 5) return "5-6";
    if (score >= 3) return "3-4";
    return "0-2";
}
```

> **Lưu ý:** Trường `Color` đã được **di chuyển sang frontend**. Xem `types/dashboard/scoreColors.ts` để thay đổi màu sắc.

### CalculateMedian
```csharp
private static float CalculateMedian(List<float> sortedScores)
{
    int count = sortedScores.Count;
    if (count % 2 == 0)
        return (sortedScores[count / 2 - 1] + sortedScores[count / 2]) / 2f;
    return sortedScores[count / 2];
}
```

---

## 8. Data Dependencies

```
ClassroomDashboardQuery
├── ISubmissionRepository
│   └── GetByStudentIdAsync(studentId) → List<Submission>
│   └── GetByExamIdAsync(examId) → List<Submission>
├── IClassroomEnrollmentRepository
│   └── FindByClassIdAsync(classroomId) → List<ClassEnrollment>
│   └── FindByAllAsync() → List<ClassEnrollment>
├── IClassroomRepository
│   └── FindByIdAsync(id) → Classroom
│   └── FindByIdsAsync(ids) → List<Classroom>
├── IAcademicWarningRepository
│   └── FindByStudentIdAsync(studentId) → List<AcademicWarning>
│   └── FindByClassroomIdAsync(classroomId) → List<AcademicWarning>
├── IExaminationRepository
│   └── GetByClassIdAsync(classroomId) → List<Examination>
└── UserRequestProducer (RabbitMQ)
    └── GetUsersByIdsAsync(studentIds) → List<UserProfile>
```

---

## 9. Default Values

Khi không có dữ liệu:
- `ScoreDistribution`: Trả về 5 khoảng điểm với Count=0, Percentage=0
- `AtRiskStudents`: Trả về empty list
- `RecentWarnings`: Trả về empty list
- `ClassStats`: Trả về empty list
- `ExamScoreStatistics`: Trả về empty list
