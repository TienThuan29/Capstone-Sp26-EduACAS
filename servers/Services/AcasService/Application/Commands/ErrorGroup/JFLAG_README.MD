# Báo cáo phân tích: `JPlagCommand`

Tài liệu mô tả logic của class `JPlagCommand` trong `JPlagCommand.cs` — lớp gọi công cụ JPlag (Java) để so sánh độ tương đồng mã nguồn giữa các bài nộp.

## 1. Vai trò và hợp đồng

- **Interface `IJPlagCommand`**: một phương thức `RunSimilarityCheckAsync(language, submissions)` trả về `Task<List<JPlagMatch>>`.
- **`JPlagCommand`**: triển khai bằng cách ghi mã nguồn ra thư mục tạm, chạy `java -jar jplag.jar`, đọc file ZIP kết quả và parse JSON trong thư mục `comparisons/`.

**Phụ thuộc runtime**

- File JAR: `{AppContext.BaseDirectory}/Application/Thirdparty/jplag.jar`.
- Lệnh `java` có trên `PATH`, chạy headless (`-Djava.awt.headless=true`).

## 2. Luồng xử lý chính (`RunSimilarityCheckAsync`)

```text
submissions < 2  →  log cảnh báo, trả về list rỗng
       ↓
Tạo sessionId, tempDir = %TEMP%/AcasJPlag/{sessionId}/
       ↓
submissionDir = tempDir/submissions — mỗi submission một thư mục con (tên = sub.Id)
       ↓
Ghi file solution.{ext} theo ngôn ngữ; với C# có bước chuẩn hóa mã nguồn
       ↓
Delay 500ms (đồng bộ I/O / thư mục)
       ↓
Tính -t (min token match) từ ngôn ngữ + độ dài source mẫu (submission đầu)
       ↓
Map ngôn ngữ sang tên JPlag (-l)
       ↓
Process: java ... -jar jplag.jar --mode RUN -l ... -r results -t ... -m 0.0 --overwrite submissionDir
       ↓
ExitCode != 0  →  throw Exception (kèm stderr/stdout)
       ↓
Đọc results.jplag (ZIP), ExtractMatchesFromArchiveAsync
       ↓
finally: xóa recursive tempDir (lỗi xóa chỉ log, không ném)
```

## 3. Chuẩn bị file nộp cho JPlag

- **Phần mở rộng**: `GetExtensionForLanguage` — map `csharp`/`c#` → `.cs`, `java` → `.java`, v.v.; ngôn ngữ không khớp → `.txt`.
- **C# đặc biệt**: nếu `language` chứa `"csharp"` hoặc `"cs"`:
  - Thay `namespace ...` bằng `namespace Unified`.
  - Thay khai báo class (kể cả `public`/`partial`) bằng `class Submission`.
  - Mục đích: giảm khác biệt “vỏ” (namespace/tên class) để JPlag tập trung vào logic trùng.

Mỗi bài: `Directory.CreateDirectory(studentDir)` rồi `File.WriteAllTextAsync(solution.{ext}, source)` — `sub.Source` null được coi là chuỗi rỗng.

## 4. Tham số JPlag (CLI)

| Tham số | Ý nghĩa trong code |
|--------|---------------------|
| `--mode RUN` | Chạy phân tích (theo convention JPlag CLI được dùng ở đây). |
| `-l {jplagLang}` | Ngôn ngữ lexer JPlag (`MapLanguageForJPlag`). |
| `-r {resultBaseName}` | Tiền tố output; kết quả thực tế là `{resultBaseName}.jplag` (ZIP). |
| `-t {minTokenMatch}` | Ngưỡng độ dài khớp token tối thiểu (xem mục 5). |
| `-m 0.0` | Ngưỡng similarity tối thiểu = 0 → không lọc bớt cặp theo % tại JPlag (lọc có thể xử lý ở tầng trên). |
| `--overwrite` | Ghi đè kết quả cũ nếu có. |
| Cuối cùng | Đường dẫn thư mục gốc chứa các submission. |

## 5. `CalculateMinTokenMatch(language, sourceCode)`

- **Cơ sở theo ngôn ngữ** (hằng số lớp):
  - C-style (`csharp`, `c#`, `java`, `cpp`, `c++`, `c`): **8**
  - Script-like (`javascript`, `typescript`, `go`, `golang`, `rust`): **6**
  - Python-like (`python`, `python3`, `kotlin`, `swift`, `scala`): **5**
  - Mặc định: **3**
- **Hệ số theo số dòng** `sourceCode.Split('\n').Length`:
  - &lt; 300 dòng: ×1.0
  - 300–999: ×1.5
  - ≥ 1000: ×2.25
- Kết quả: `(int)(base * multiplier)` — file dài hơn → ngưỡng token cao hơn (ít báo khớp “vụn” hơn).

**Lưu ý**: Chỉ dùng `submissions[0].Source` để đếm dòng; nếu các bài khác dài hơn nhiều, hệ số có thể không phản ánh đúng từng bài.

## 6. `MapLanguageForJPlag`

Map chuỗi ngôn ngữ ứng dụng sang identifier JPlag (ví dụ `python3`, `cpp`, `csharp`). Không khớp → `"text"`.

## 7. Đọc kết quả: `ExtractMatchesFromArchiveAsync`

- Mở file ZIP `*.jplag`; nếu không tồn tại → trả về list rỗng.
- Chỉ xử lý entry có `FullName` bắt đầu `comparisons/` và kết thúc `.json`.
- Với mỗi file JSON:
  - Parse `JsonDocument`, đọc **ID submission** linh hoạt (nhiều tên field có thể có trong các phiên bản/format JPlag): `first_submission` / `firstSubmissionId` / `submission1` / `id1` (và tương tự cho bài thứ hai).
  - Thiếu ID → log và bỏ qua entry.
  - **Điểm giống**: `firstSimilarity`, `secondSimilarity` — lấy `Math.Max`; nếu &gt; 1.0 thì chia 100 (giả định dạng phần trăm).
  - **Chi tiết khớp** (`matches` array): hỗ trợ nhiều schema:
    - Object `startInFirst`/`endInFirst`/`startInSecond`/`endInSecond` với `line` (kiểu JPlag mới hơn).
    - Hoặc `start1`/`end1`/`start2`/`end2` dạng object với `startLine`/`endLine`.
    - Hoặc `start1`… dạng số (line phẳng).
  - Chỉ thêm `JPlagMatchDetail` khi `StartLine1 > 0` và `StartLine2 > 0`.
  - Token count: `lengthOfFirst`, hoặc `tokens`, hoặc `length`.

Mỗi cặp parse thành một `JPlagMatch` (kèm `Details`) và đưa vào list trả về.

## 8. Xử lý lỗi và dọn dẹp

- **Try/catch**: mọi exception được log rồi **rethrow** (caller nhận lỗi).
- **Finally**: luôn cố gắng `Directory.Delete(tempDir, true)`; lỗi xóa chỉ `LogWarning`.

## 9. Ghi chú về logging

- Dùng nhiều `LogCritical` cho preview nội dung, STDOUT/STDERR JPlag, raw JSON match — thường phù hợp mức Debug/Trace hơn là Critical trong môi trường production.
- Có log cấu trúc thư mục và 10 match đầu sau khi parse.

## 10. Tóm tắt

`JPlagCommand` là **adapter** giữa domain `Submission` của AcasService và CLI JPlag: chuẩn hóa file (đặc biệt C#), điều chỉnh ngưỡng token theo ngôn ngữ và độ dài mã, chạy tiến trình Java, rồi **normalize** nhiều biến thể JSON so sánh từ ZIP kết quả thành `List<JPlagMatch>` để tầng ứng dụng tiếp tục xử lý (nhóm lỗi, UI, v.v.).
