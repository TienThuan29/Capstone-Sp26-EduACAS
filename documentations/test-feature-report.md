# TEST REPORT DOCUMENT — EDUACAS

> Phiên bản: 1.0
> Ngày: 17/04/2026
> Dự án: EduACAS — Hệ thống thi trực tuyến và quản lý học tập
> Mã dự án: EDU-ACAS-2026

---

## MỤC LỤC

1. [Trang bìa](#1-trang-bìa)
2. [Danh sách Test Case](#2-danh-sách-test-case)
3. [Thống kê Test](#3-thống-kê-test)
4. [F01 — Đăng nhập (Login)](#4-f01--đăng-nhập-login)
5. [F02 — Đăng ký (Register)](#5-f02--đăng-ký-register)
6. [F03 — Quên mật khẩu (Forgot Password)](#6-f03--quên-mật-khẩu-forgot-password)
7. [F04 — Đặt lại mật khẩu (Reset Password)](#7-f04--đặt-lại-mật-khẩu-reset-password)
8. [F05 — Xác thực Google (Google OAuth)](#8-f05--xác-thực-google-oauth)
9. [F06 — Xác thực Email (Email Verification)](#9-f06--xác-thực-email-email-verification)
10. [F07 — Quản lý hồ sơ (Profile Management)](#10-f07--quản-lý-hồ-sơ-profile-management)
11. [F08 — Đổi mật khẩu (Change Password)](#11-f08--đổi-mật-khẩu-change-password)
12. [F09 — Quản lý lớp học (CRUD Classroom)](#12-f09--quản-lý-lớp-học-crud-classroom)
13. [F10 — Thêm/xóa sinh viên vào lớp (Student Enrollment)](#13-f10--thêmxóa-sinh-viên-vào-lớp-student-enrollment)
14. [F11 — Ghi danh lớp học (Classroom Enrollment)](#14-f11--ghi-danh-lớp-học-classroom-enrollment)
15. [F12 — Quản lý môn học (Subject Management)](#15-f12--quản-lý-môn-học-subject-management)
16. [F13 — Quản lý bài toán (Problem Management)](#16-f13--quản-lý-bài-toán-problem-management)
17. [F14 — Quản lý Test Case (Test Case Management)](#17-f14--quản-lý-test-case-test-case-management)
18. [F15 — Quản lý ngôn ngữ lập trình (Programming Language)](#18-f15--quản-lý-ngôn-ngữ-lập-trình-programming-language)
19. [F16 — Quản lý ca thi (Examination Management)](#19-f16--quản-lý-ca-thi-examination-management)
20. [F17 — Quản lý template ca thi (Examination Template)](#20-f17--quản-lý-template-ca-thi-examination-template)
21. [F18 — Bắt đầu/Kết thúc ca thi (Start/End Examination)](#21-f18--bắt-đầukết-thúc-ca-thi-startend-examination)
22. [F19 — Kiểm tra đạo văn (Plagiarism Detection)](#22-f19--kiểm-tra-đạo-văn-plagiarism-detection)
23. [F20 — Quản lý phiên thi (Student Exam Session)](#23-f20--quản-lý-phiên-thi-student-exam-session)
24. [F21 — Nộp bài (Submission)](#24-f21--nộp-bài-submission)
25. [F22 — Chấm điểm tự động (Auto-Grading)](#25-f22--chấm-điểm-tự-động-auto-grading)
26. [F23 — Trình soạn thảo code (Code Editor)](#26-f23--trình-soạn-thảo-code-code-editor)
27. [F24 — Thảo luận (Discussion)](#27-f24--thảo-luận-discussion)
28. [F25 — Quiz](#28-f25--quiz)
29. [F26 — Tài liệu học tập (Material)](#29-f26--tài-liệu-học-tập-material)
30. [F27 — Thông báo (Notification)](#30-f27--thông-báo-notification)
31. [F28 — Theo dõi hành vi thi (Exam Proctoring)](#31-f28--theo-dõi-hành-vi-thi-exam-proctoring)
32. [F29 — Quản lý Slot](#32-f29--quản-lý-slot)

---

## 1. TRANG BÌA

| Trường | Giá trị |
|--------|----------|
| **Tên dự án** | EduACAS |
| **Mã dự án** | EDU-ACAS-2026 |
| **Mô tả** | Hệ thống thi trực tuyến, quản lý bài tập lập trình và quản lý học tập cho FPT University |
| **Người tạo** | [Người tạo] |
| **Ngày tạo** | 17/04/2026 |
| **Phiên bản** | v1.0 |
| **Trạng thái** | Đang phát triển |

### Lịch sử thay đổi

| Ngày hiệu lực | Phiên bản | Mục thay đổi | Mô tả thay đổi |
|----------------|-----------|---------------|-----------------|
| 17/04/2026 | v1.0 | A (Add) | Tạo mới tài liệu test report đầu tiên |

---

## 2. DANH SÁCH TEST CASE

| STT | Tên chức năng | Sheet Name | Mô tả | Điều kiện tiên quyết |
|------|---------------|------------|--------|----------------------|
| 1 | Đăng nhập (Login) | F01_Login | Người dùng đăng nhập bằng email/password | Người dùng đã có tài khoản |
| 2 | Đăng ký (Register) | F02_Register | Người dùng tạo tài khoản mới | Người dùng chưa có tài khoản |
| 3 | Quên mật khẩu (Forgot Password) | F03_ForgotPassword | Người dùng yêu cầu reset password | Người dùng có tài khoản nhưng quên mật khẩu |
| 4 | Đặt lại mật khẩu (Reset Password) | F04_ResetPassword | Người dùng đặt mật khẩu mới qua email link | Người dùng nhận được email reset |
| 5 | Xác thực Google (Google OAuth) | F05_GoogleOAuth | Đăng nhập bằng tài khoản Google | Người dùng có tài khoản Google |
| 6 | Xác thực Email (Email Verification) | F06_EmailVerification | Xác thực email qua OTP | Người dùng đăng ký tài khoản mới |
| 7 | Quản lý hồ sơ (Profile Management) | F07_ProfileManagement | Xem và cập nhật thông tin cá nhân | Người dùng đã đăng nhập |
| 8 | Đổi mật khẩu (Change Password) | F08_ChangePassword | Thay đổi mật khẩu từ trang profile | Người dùng đã đăng nhập |
| 9 | Quản lý lớp học (CRUD Classroom) | F09_ClassroomCRUD | Tạo, sửa, xóa lớp học | Giảng viên đã đăng nhập |
| 10 | Thêm/xóa sinh viên vào lớp (Student Enrollment) | F10_StudentEnrollment | Thêm hoặc xóa sinh viên khỏi lớp | Lớp học đã được tạo |
| 11 | Ghi danh lớp học (Classroom Enrollment) | F11_ClassroomEnroll | Sinh viên đăng ký vào lớp bằng mã lớp | Sinh viên đã đăng nhập, có mã lớp |
| 12 | Quản lý môn học (Subject Management) | F12_SubjectManagement | CRUD môn học | Admin đã đăng nhập |
| 13 | Quản lý bài toán (Problem Management) | F13_ProblemManagement | CRUD bài toán lập trình | Giảng viên đã đăng nhập |
| 14 | Quản lý Test Case (Test Case Management) | F14_TestCaseManagement | Tạo, sửa, xóa test case | Bài toán đã được tạo |
| 15 | Quản lý ngôn ngữ lập trình (Programming Language) | F15_ProgrammingLanguage | Thêm, sửa, xóa ngôn ngữ lập trình | Admin đã đăng nhập |
| 16 | Quản lý ca thi (Examination Management) | F16_ExaminationManagement | CRUD ca thi | Giảng viên đã đăng nhập |
| 17 | Quản lý template ca thi (Examination Template) | F17_ExaminationTemplate | Tạo, sửa, xóa template ca thi | Giảng viên đã đăng nhập |
| 18 | Bắt đầu/Kết thúc ca thi (Start/End Examination) | F18_StartEndExamination | Sinh viên bắt đầu và nộp bài thi | Ca thi đang trong thời gian thi |
| 19 | Kiểm tra đạo văn (Plagiarism Detection) | F19_Plagiarism | Phát hiện bài nộp trùng lặp | Có submissions trong ca thi |
| 20 | Quản lý phiên thi (Student Exam Session) | F20_StudentExamSession | Quản lý trạng thái phiên thi | Sinh viên đã bắt đầu thi |
| 21 | Nộp bài (Submission) | F21_Submission | Nộp bài code | Sinh viên đang trong phiên thi |
| 22 | Chấm điểm tự động (Auto-Grading) | F22_AutoGrading | Chấm điểm tự động bằng hidden test cases | Có submissions chờ chấm |
| 23 | Trình soạn thảo code (Code Editor) | F23_CodeEditor | Soạn và chạy code | Sinh viên đang làm bài |
| 24 | Thảo luận (Discussion) | F24_Discussion | Sinh viên đặt câu hỏi, giảng viên trả lời | Lớp học đã được tạo |
| 25 | Quiz | F25_Quiz | Làm quiz trắc nghiệm | Quiz đã được tạo |
| 26 | Tài liệu học tập (Material) | F26_Material | Upload và xem tài liệu học tập | Lớp học đã được tạo |
| 27 | Thông báo (Notification) | F27_Notification | Nhận và xem thông báo | Người dùng đã đăng nhập |
| 28 | Theo dõi hành vi thi (Exam Proctoring) | F28_ExamProctoring | Ghi nhận hành vi bất thường khi thi | Sinh viên đang thi |
| 29 | Quản lý Slot | F29_SlotManagement | CRUD slot thời gian thi | Admin/giảng viên đã đăng nhập |

---

## 3. THỐNG KÊ TEST

| STT | Mã module | Passed | Failed | Pending | N/A | Số lượng test case |
|------|-----------|--------|--------|---------|-----|-------------------|
| 1 | F01_Login | - | - | - | - | TBD |
| 2 | F02_Register | - | - | - | - | TBD |
| 3 | F03_ForgotPassword | - | - | - | - | TBD |
| 4 | F04_ResetPassword | - | - | - | - | TBD |
| 5 | F05_GoogleOAuth | - | - | - | - | TBD |
| 6 | F06_EmailVerification | - | - | - | - | TBD |
| 7 | F07_ProfileManagement | - | - | - | - | TBD |
| 8 | F08_ChangePassword | - | - | - | - | TBD |
| 9 | F09_ClassroomCRUD | - | - | - | - | TBD |
| 10 | F10_StudentEnrollment | - | - | - | - | TBD |
| 11 | F11_ClassroomEnroll | - | - | - | - | TBD |
| 12 | F12_SubjectManagement | - | - | - | - | TBD |
| 13 | F13_ProblemManagement | - | - | - | - | TBD |
| 14 | F14_TestCaseManagement | - | - | - | - | TBD |
| 15 | F15_ProgrammingLanguage | - | - | - | - | TBD |
| 16 | F16_ExaminationManagement | - | - | - | - | TBD |
| 17 | F17_ExaminationTemplate | - | - | - | - | TBD |
| 18 | F18_StartEndExamination | - | - | - | - | TBD |
| 19 | F19_Plagiarism | - | - | - | - | TBD |
| 20 | F20_StudentExamSession | - | - | - | - | TBD |
| 21 | F21_Submission | - | - | - | - | TBD |
| 22 | F22_AutoGrading | - | - | - | - | TBD |
| 23 | F23_CodeEditor | - | - | - | - | TBD |
| 24 | F24_Discussion | - | - | - | - | TBD |
| 25 | F25_Quiz | - | - | - | - | TBD |
| 26 | F26_Material | - | - | - | - | TBD |
| 27 | F27_Notification | - | - | - | - | TBD |
| 28 | F28_ExamProctoring | - | - | - | - | TBD |
| 29 | F29_SlotManagement | - | - | - | - | TBD |
| | **Tổng cộng** | - | - | - | - | **TBD** |

| Chỉ số | Giá trị |
|---------|----------|
| **Test coverage** | - |
| **Test successful coverage** | - |

---

## 4. F01 — ĐĂNG NHẬP (LOGIN)

**Feature:** F01_Login — Đăng nhập hệ thống
**Mô tả yêu cầu:** Người dùng đăng nhập vào hệ thống bằng email và mật khẩu. Hệ thống xác thực thông tin đăng nhập và cấp JWT token để truy cập các tài nguyên được bảo vệ.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F01-TC01 | Đăng nhập thành công với thông tin hợp lệ | 1. Mở trang đăng nhập\n2. Nhập email hợp lệ\n3. Nhập mật khẩu hợp lệ\n4. Nhấn nút "Login" | Đăng nhập thành công, chuyển hướng đến trang chủ, hiển thị thông tin user | Người dùng có tài khoản hợp lệ | Pending | Pending | Pending | |
| F01-TC02 | Đăng nhập thất bại với email không tồn tại | 1. Mở trang đăng nhập\n2. Nhập email không tồn tại\n3. Nhập mật khẩu bất kỳ\n4. Nhấn nút "Login" | Hiển thị thông báo lỗi "Invalid email or password", không chuyển trang | Không có tài khoản với email này | Pending | Pending | Pending | |
| F01-TC03 | Đăng nhập thất bại với mật khẩu sai | 1. Mở trang đăng nhập\n2. Nhập email đúng\n3. Nhập mật khẩu sai\n4. Nhấn nút "Login" | Hiển thị thông báo lỗi "Invalid email or password", không chuyển trang | Người dùng có tài khoản | Pending | Pending | Pending | |
| F01-TC04 | Đăng nhập thất bại với tài khoản bị vô hiệu hóa | 1. Mở trang đăng nhập\n2. Nhập email tài khoản bị disable\n3. Nhập mật khẩu đúng\n4. Nhấn nút "Login" | Hiển thị thông báo lỗi "User is forbidden" hoặc "Account has been disabled" | Tài khoản có IsEnable = false | Pending | Pending | Pending | |
| F01-TC05 | Đăng nhập thất bại với email không hợp lệ | 1. Mở trang đăng nhập\n2. Nhập email sai định dạng (ví dụ: "user@")\n3. Nhập mật khẩu\n4. Nhấn nút "Login" | Hiển thị validation error "Invalid email format" hoặc không cho submit | Không có | Pending | Pending | Pending | |
| F01-TC06 | Đăng nhập thất bại khi bỏ trống email | 1. Mở trang đăng nhập\n2. Bỏ trống trường email\n3. Nhập mật khẩu\n4. Nhấn nút "Login" | Hiển thị validation error "Email is required" | Không có | Pending | Pending | Pending | |
| F01-TC07 | Đăng nhập thất bại khi bỏ trống mật khẩu | 1. Mở trang đăng nhập\n2. Nhập email hợp lệ\n3. Bỏ trống trường mật khẩu\n4. Nhấn nút "Login" | Hiển thị validation error "Password is required" | Không có | Pending | Pending | Pending | |
| F01-TC08 | Đăng nhập với "Remember me" được chọn | 1. Mở trang đăng nhập\n2. Nhập email và mật khẩu hợp lệ\n3. Tick checkbox "Remember me"\n4. Nhấn nút "Login" | Đăng nhập thành công, token được lưu vào localStorage với thời gian dài hơn | Người dùng có tài khoản hợp lệ | Pending | Pending | Pending | |
| F01-TC09 | Chuyển hướng đến trang Forgot Password | 1. Mở trang đăng nhập\n2. Nhấn link "Forgot password?"\n3. Kiểm tra URL | Chuyển hướng đến trang /forgot-password | Không có | Pending | Pending | Pending | |
| F01-TC10 | Chuyển hướng đến trang Register | 1. Mở trang đăng nhập\n2. Nhấn link "Register now"\n3. Kiểm tra URL | Chuyển hướng đến trang /register | Không có | Pending | Pending | Pending | |
| F01-TC11 | Đăng nhập với email viết hoa/thường khác nhau | 1. Mở trang đăng nhập\n2. Nhập email viết HOA (USER@EMAIL.COM)\n3. Nhập mật khẩu đúng\n4. Nhấn nút "Login" | Đăng nhập thành công (email case-insensitive) | Người dùng có tài khoản user@email.com | Pending | Pending | Pending | |
| F01-TC12 | Kiểm tra hiển thị/ẩn mật khẩu | 1. Mở trang đăng nhập\n2. Nhập mật khẩu\n3. Nhấn icon hiển thị/ẩn mật khẩu | Mật khẩu được hiển thị dạng text hoặc ẩn dạng ••• | Không có | Pending | Pending | Pending | |
| F01-TC13 | Đăng nhập khi API trả về lỗi 500 | 1. Mở trang đăng nhập\n2. Nhập thông tin hợp lệ\n3. Server trả về lỗi 500\n4. Nhấn nút "Login" | Hiển thị thông báo lỗi "Server error. Please try again later." | Server đang có lỗi | Pending | Pending | Pending | |
| F01-TC14 | Đăng nhập khi mất kết nối mạng | 1. Mở trang đăng nhập\n2. Ngắt kết nối mạng\n3. Nhấn nút "Login" | Hiển thị thông báo "Network error. Please check your connection." | Không có kết nối mạng | Pending | Pending | Pending | |

---

## 5. F02 — ĐĂNG KÝ (REGISTER)

**Feature:** F02_Register — Đăng ký tài khoản mới
**Mô tả yêu cầu:** Người dùng chưa có tài khoản có thể đăng ký tài khoản mới bằng email, họ tên, vai trò và mật khẩu. Hệ thống kiểm tra tính hợp lệ và tạo tài khoản.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F02-TC01 | Đăng ký thành công với thông tin hợp lệ | 1. Mở trang đăng ký\n2. Nhập họ tên: "Nguyễn Văn A"\n3. Nhập email chưa tồn tại\n4. Chọn vai trò: Sinh viên\n5. Nhập mật khẩu (≥8 ký tự)\n6. Nhập xác nhận mật khẩu đúng\n7. Tick đồng ý điều khoản\n8. Nhấn "Đăng ký" | Đăng ký thành công, chuyển đến trang xác thực email hoặc đăng nhập | Email chưa tồn tại trong hệ thống | Pending | Pending | Pending | |
| F02-TC02 | Đăng ký thất bại với email đã tồn tại | 1. Mở trang đăng ký\n2. Nhập email đã có trong hệ thống\n3. Điền các trường còn lại hợp lệ\n4. Nhấn "Đăng ký" | Hiển thị thông báo lỗi "User with this email already exists" | Email đã tồn tại | Pending | Pending | Pending | |
| F02-TC03 | Đăng ký thất bại với mật khẩu < 8 ký tự | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ\n3. Nhập mật khẩu: "1234567"\n4. Nhấn "Đăng ký" | Hiển thị thông báo lỗi validation "Password must be at least 8 characters" | Không có | Pending | Pending | Pending | |
| F02-TC04 | Đăng ký thất bại khi xác nhận mật khẩu không khớp | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ\n3. Nhập mật khẩu: "Password123"\n4. Nhập xác nhận mật khẩu: "Password456"\n5. Nhấn "Đăng ký" | Hiển thị thông báo "Mật khẩu xác nhận không khớp!" | Không có | Pending | Pending | Pending | |
| F02-TC05 | Đăng ký thất bại khi không đồng ý điều khoản | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ\n3. Không tick checkbox đồng ý điều khoản\n4. Nhấn "Đăng ký" | Hiển thị thông báo "Vui lòng đồng ý với điều khoản dịch vụ!" | Không có | Pending | Pending | Pending | |
| F02-TC06 | Đăng ký thất bại khi bỏ trống họ tên | 1. Mở trang đăng ký\n2. Bỏ trống họ tên\n3. Điền các trường còn lại hợp lệ\n4. Nhấn "Đăng ký" | Hiển thị validation error "Họ và tên is required" | Không có | Pending | Pending | Pending | |
| F02-TC07 | Đăng ký thất bại khi không chọn vai trò | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ, bỏ trống vai trò\n3. Nhấn "Đăng ký" | Hiển thị validation error "Vai trò is required" | Không có | Pending | Pending | Pending | |
| F02-TC08 | Đăng ký với vai trò Giảng viên | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ\n3. Chọn vai trò: Giảng viên\n4. Nhấn "Đăng ký" | Đăng ký thành công, vai trò được set là TEACHER | Không có | Pending | Pending | Pending | |
| F02-TC09 | Đăng ký với email sai định dạng | 1. Mở trang đăng ký\n2. Nhập email sai định dạng: "userexample.com"\n3. Nhấn "Đăng ký" | Hiển thị validation error "Email must be a valid email" | Không có | Pending | Pending | Pending | |
| F02-TC10 | Đăng ký khi API trả về lỗi server | 1. Mở trang đăng ký\n2. Điền thông tin hợp lệ\n3. Server trả về lỗi 500\n4. Nhấn "Đăng ký" | Hiển thị thông báo lỗi từ server | Server đang có lỗi | Pending | Pending | Pending | |
| F02-TC11 | Chuyển hướng đến trang đăng nhập | 1. Mở trang đăng ký\n2. Nhấn link "Đăng nhập"\n3. Kiểm tra URL | Chuyển hướng đến trang /login | Không có | Pending | Pending | Pending | |
| F02-TC12 | Kiểm tra điều khoản và chính sách bảo mật link | 1. Mở trang đăng ký\n2. Nhấn link "Điều khoản dịch vụ"\n3. Nhấn link "Chính sách bảo mật" | Mở trang điều khoản/chính sách (hoặc alert nếu chưa implement) | Không có | Pending | Pending | Pending | |

---

## 6. F03 — QUÊN MẬT KHẨU (FORGOT PASSWORD)

**Feature:** F03_ForgotPassword — Yêu cầu đặt lại mật khẩu qua email
**Mô tả yêu cầu:** Người dùng quên mật khẩu có thể yêu cầu hệ thống gửi email hướng dẫn đặt lại mật khẩu. Hệ thống gửi email chứa link/token reset đến email đã đăng ký.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F03-TC01 | Gửi yêu cầu thành công với email tồn tại | 1. Mở trang quên mật khẩu\n2. Nhập email đã đăng ký\n3. Nhấn "Gửi yêu cầu đặt lại mật khẩu"\n4. Đợi phản hồi | Hiển thị trang xác nhận "Kiểm tra email của bạn", email reset được gửi | Email đã tồn tại trong hệ thống | Pending | Pending | Pending | |
| F03-TC02 | Gửi yêu cầu với email không tồn tại | 1. Mở trang quên mật khẩu\n2. Nhập email không tồn tại\n3. Nhấn "Gửi yêu cầu"\n4. Kiểm tra phản hồi | Hiển thị thông báo "Không tìm thấy tài khoản với email này" HOẶC vì lý do bảo mật, hiển thị thông báo chung "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn" | Email không tồn tại (không tiết lộ thông tin user) | Pending | Pending | Pending | |
| F03-TC03 | Gửi yêu cầu với email sai định dạng | 1. Mở trang quên mật khẩu\n2. Nhập email sai định dạng\n3. Nhấn "Gửi yêu cầu" | Hiển thị validation error "Email must be a valid email" | Không có | Pending | Pending | Pending | |
| F03-TC04 | Gửi yêu cầu khi bỏ trống email | 1. Mở trang quên mật khẩu\n2. Bỏ trống trường email\n3. Nhấn "Gửi yêu cầu" | Hiển thị validation error "Email is required" | Không có | Pending | Pending | Pending | |
| F03-TC05 | Hiển thị loading khi đang gửi yêu cầu | 1. Mở trang quên mật khẩu\n2. Nhập email hợp lệ\n3. Nhấn nút gửi\n4. Quan sát trạng thái loading | Nút hiển thị "Đang gửi...", input bị disable trong quá trình xử lý | Không có | Pending | Pending | Pending | |
| F03-TC06 | Nhấn "Thử lại với email khác" sau khi gửi thành công | 1. Gửi yêu cầu thành công\n2. Nhấn "Thử lại với email khác"\n3. Nhập email mới\n4. Gửi lại | Reset form, cho phép nhập email mới, gửi thành công | Đã gửi yêu cầu thành công trước đó | Pending | Pending | Pending | |
| F03-TC07 | Quay lại trang đăng nhập | 1. Mở trang quên mật khẩu\n2. Nhấn "Đăng nhập" ở cuối trang | Chuyển hướng đến trang /login | Không có | Pending | Pending | Pending | |
| F03-TC08 | Quay lại trang chủ | 1. Mở trang quên mật khẩu\n2. Nhấn "Back to home" | Chuyển hướng đến trang chủ | Không có | Pending | Pending | Pending | |
| F03-TC09 | Gửi yêu cầu khi API trả về lỗi | 1. Mở trang quên mật khẩu\n2. Nhập email hợp lệ\n3. Server trả về lỗi 500\n4. Nhấn "Gửi yêu cầu" | Hiển thị thông báo lỗi "Đã xảy ra lỗi. Vui lòng thử lại." | Server đang có lỗi | Pending | Pending | Pending | |

---

## 7. F04 — ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)

**Feature:** F04_ResetPassword — Đặt lại mật khẩu mới qua email link
**Mô tả yêu cầu:** Người dùng nhấn vào link trong email đặt lại mật khẩu, nhập mật khẩu mới. Hệ thống cập nhật mật khẩu và vô hiệu token.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F04-TC01 | Đặt lại mật khẩu thành công với mật khẩu hợp lệ | 1. Mở link reset password từ email (URL có token)\n2. Nhập mật khẩu mới (≥8 ký tự)\n3. Nhập xác nhận mật khẩu đúng\n4. Nhấn "Đặt lại mật khẩu" | Đặt lại thành công, hiển thị thông báo, chuyển đến trang đăng nhập sau 2 giây | Token hợp lệ, chưa hết hạn | Pending | Pending | Pending | |
| F04-TC02 | Đặt lại thất bại với token không hợp lệ | 1. Mở link reset với token sai\n2. Nhập mật khẩu mới\n3. Nhấn "Đặt lại mật khẩu" | Hiển thị thông báo lỗi "Token không hợp lệ hoặc đã hết hạn", không cho đặt lại | Token không tồn tại hoặc không hợp lệ | Pending | Pending | Pending | |
| F04-TC03 | Đặt lại thất bại với token đã hết hạn | 1. Mở link reset với token đã hết hạn (> 1 giờ)\n2. Nhập mật khẩu mới\n3. Nhấn "Đặt lại mật khẩu" | Hiển thị thông báo lỗi "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới." | Token đã hết hạn | Pending | Pending | Pending | |
| F04-TC04 | Đặt lại thất bại với mật khẩu mới < 5 ký tự | 1. Mở link reset password\n2. Nhập mật khẩu mới: "1234"\n3. Nhấn "Đặt lại mật khẩu" | Hiển thị thông báo "Mật khẩu phải có ít nhất 5 ký tự" | Không có | Pending | Pending | Pending | |
| F04-TC05 | Đặt lại thất bại với mật khẩu mới > 64 ký tự | 1. Mở link reset password\n2. Nhập mật khẩu mới với 70 ký tự\n3. Nhấn "Đặt lại mật khẩu" | Hiển thị thông báo "Mật khẩu không được vượt quá 64 ký tự" | Không có | Pending | Pending | Pending | |
| F04-TC06 | Đặt lại thất bại khi xác nhận mật khẩu không khớp | 1. Mở link reset password\n2. Nhập mật khẩu mới: "NewPass123"\n3. Nhập xác nhận mật khẩu: "NewPass456"\n4. Nhấn "Đặt lại mật khẩu" | Hiển thị thông báo "Mật khẩu xác nhận không khớp" | Không có | Pending | Pending | Pending | |
| F04-TC07 | Kiểm tra độ mạnh mật khẩu — Yếu | 1. Mở link reset password\n2. Nhập mật khẩu: "abc123"\n3. Quan sát thanh độ mạnh | Thanh độ mạnh hiển thị màu đỏ, text "Yếu" | Không có | Pending | Pending | Pending | |
| F04-TC08 | Kiểm tra độ mạnh mật khẩu — Trung bình | 1. Mở link reset password\n2. Nhập mật khẩu: "Pass1234"\n3. Quan sát thanh độ mạnh | Thanh độ mạnh hiển thị màu vàng, text "Trung bình" | Không có | Pending | Pending | Pending | |
| F04-TC09 | Kiểm tra độ mạnh mật khẩu — Mạnh | 1. Mở link reset password\n2. Nhập mật khẩu: "Password123!"\n3. Quan sát thanh độ mạnh | Thanh độ mạnh hiển thị màu xanh lá, text "Mạnh" hoặc "Rất mạnh" | Không có | Pending | Pending | Pending | |
| F04-TC10 | Token đã được sử dụng trước đó | 1. Sử dụng token để đặt lại mật khẩu thành công\n2. Thử sử dụng lại token đó | Hiển thị thông báo lỗi "Token đã được sử dụng" | Token đã được sử dụng | Pending | Pending | Pending | |
| F04-TC11 | Quay lại trang đăng nhập | 1. Mở trang reset password\n2. Nhấn "Quay lại đăng nhập"\n3. Kiểm tra URL | Chuyển hướng đến trang /login | Không có | Pending | Pending | Pending | |
| F04-TC12 | Mở trang reset không có email param | 1. Mở URL /forgot-password/reset mà không có param email\n2. Quan sát hành vi | Chuyển hướng về trang /login với thông báo lỗi | Không có email trong URL | Pending | Pending | Pending | |
| F04-TC13 | Sau khi reset thành công, đăng nhập bằng mật khẩu mới | 1. Đặt lại mật khẩu thành công\n2. Chuyển hướng đến /login\n3. Đăng nhập với mật khẩu mới | Đăng nhập thành công | Mật khẩu đã được đặt lại | Pending | Pending | Pending | |

---

## 8. F05 — XÁC THỰC GOOGLE (OAUTH)

**Feature:** F05_GoogleOAuth — Đăng nhập/đăng ký bằng Google
**Mô tả yêu cầu:** Người dùng có thể đăng nhập hoặc đăng ký tài khoản bằng tài khoản Google OAuth 2.0. Hệ thống xác thực Google ID Token và tạo/cập nhật tài khoản.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F05-TC01 | Đăng nhập Google thành công với user đã tồn tại | 1. Mở trang đăng nhập\n2. Nhấn nút "Sign in with Google"\n3. Chọn tài khoản Google đã liên kết\n4. Xác nhận | Đăng nhập thành công, chuyển đến trang chủ | Tài khoản Google đã được đăng ký trước đó | Pending | Pending | Pending | |
| F05-TC02 | Đăng ký Google thành công với user mới | 1. Mở trang đăng nhập\n2. Nhấn nút "Sign in with Google"\n3. Chọn tài khoản Google mới\n4. Xác nhận | Tài khoản mới được tạo tự động, đăng nhập thành công, chuyển đến trang chủ | Tài khoản Google chưa từng đăng ký | Pending | Pending | Pending | |
| F05-TC03 | Đăng nhập Google thất bại với token không hợp lệ | 1. Mở trang đăng nhập\n2. Nhấn nút "Sign in with Google"\n3. Giả lập token không hợp lệ\n4. Xác nhận | Hiển thị thông báo lỗi "Invalid Google token" hoặc "Authentication failed" | Token không hợp lệ | Pending | Pending | Pending | |
| F05-TC04 | Đăng nhập Google khi Google script không load | 1. Mở trang đăng nhập\n2. Tắt/mất mạng khiến Google script không load\n3. Nhấn nút "Sign in with Google" | Hiển thị thông báo lỗi hoặc Google popup không mở | Không load được Google Identity Services | Pending | Pending | Pending | |
| F05-TC05 | Đăng nhập Google khi user cancel | 1. Mở trang đăng nhập\n2. Nhấn nút "Sign in with Google"\n3. Chọn tài khoản nhưng nhấn Cancel/Hủy | Không có gì xảy ra, quay lại trang đăng nhập, không đăng nhập | User hủy quá trình OAuth | Pending | Pending | Pending | |
| F05-TC06 | Đăng nhập Google khi GOOGLE_CLIENT_ID chưa config | 1. Mở trang đăng nhập (dev/test env)\n2. Kiểm tra console log\n3. Nhấn nút "Sign in with Google" | Hiển thị cảnh báo "Google Client ID is not configured" trong console, không crash UI | GOOGLE_CLIENT_ID chưa được set | Pending | Pending | Pending | |

---

## 9. F06 — XÁC THỰC EMAIL (EMAIL VERIFICATION)

**Feature:** F06_EmailVerification — Xác thực email qua OTP
**Mô tả yêu cầu:** Sau khi đăng ký, người dùng nhận email chứa mã OTP 6 chữ số để xác thực địa chỉ email. Hệ thống kiểm tra OTP và kích hoạt tài khoản.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F06-TC01 | Xác thực email thành công với OTP đúng | 1. Nhận email chứa mã OTP\n2. Mở trang xác thực email\n3. Nhập OTP 6 chữ số đúng\n4. Nhấn "Xác thực" | Xác thực thành công, IsEmailVerified = true, chuyển đến trang đăng nhập hoặc trang chính | OTP đúng, còn hiệu lực | Pending | Pending | Pending | |
| F06-TC02 | Xác thực email thất bại với OTP sai | 1. Mở trang xác thực email\n2. Nhập OTP sai (ví dụ: 123456)\n3. Nhấn "Xác thực" | Hiển thị thông báo lỗi "Mã OTP không đúng", không xác thực | OTP sai | Pending | Pending | Pending | |
| F06-TC03 | Xác thực email thất bại với OTP đã hết hạn | 1. Đợi hết thời gian hiệu lực OTP (>5 phút)\n2. Nhập OTP đã hết hạn\n3. Nhấn "Xác thực" | Hiển thị thông báo lỗi "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới." | OTP đã hết hạn | Pending | Pending | Pending | |
| F06-TC04 | Gửi lại OTP mới | 1. Mở trang xác thực email\n2. Nhấn "Gửi lại mã OTP"\n3. Kiểm tra email mới | OTP cũ bị vô hiệu, OTP mới được gửi đến email, OTP cũ không sử dụng được | Không có | Pending | Pending | Pending | |
| F06-TC05 | Xác thực với email đã được xác thực trước đó | 1. User đã xác thực email\n2. Thử xác thực lại với OTP | Hiển thị thông báo "Email đã được xác thực trước đó" hoặc chuyển thẳng đến trang đăng nhập | IsEmailVerified = true | Pending | Pending | Pending | |
| F06-TC06 | Nhập OTP không đủ 6 chữ số | 1. Mở trang xác thực email\n2. Nhập OTP: "12345" (5 số)\n3. Nhấn "Xác thực" | Hiển thị validation error "Mã OTP phải có 6 chữ số" | Không có | Pending | Pending | Pending | |
| F06-TC07 | Nhập OTP chứa ký tự không phải số | 1. Mở trang xác thực email\n2. Nhập OTP: "12ABC"\n3. Kiểm tra input | Input chỉ chấp nhận số (type="number" hoặc validation) | Không có | Pending | Pending | Pending | |
| F06-TC08 | Xác thực khi gửi sai OTP quá số lần cho phép | 1. Nhập sai OTP 5 lần liên tiếp\n2. Nhập đúng OTP ở lần thứ 6 | Hiển thị thông báo "Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới." | Retry > giới hạn | Pending | Pending | Pending | |
| F06-TC09 | Chuyển hướng đến đăng nhập khi chưa có OTP | 1. Mở URL xác thực mà không có thông tin OTP/user | Kiểm tra hành vi | Không có OTP trong URL/param | Pending | Pending | Pending | |

---

## 10. F07 — QUẢN LÝ HỒ SƠ (PROFILE MANAGEMENT)

**Feature:** F07_ProfileManagement — Xem và cập nhật thông tin cá nhân
**Mô tả yêu cầu:** Người dùng đã đăng nhập có thể xem và chỉnh sửa thông tin hồ sơ cá nhân bao gồm họ tên, ngày sinh, avatar. Các trường chỉ có thể sửa khi ở chế độ edit.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F07-TC01 | Xem thông tin hồ sơ | 1. Đăng nhập\n2. Truy cập trang /profile\n3. Quan sát thông tin hiển thị | Hiển thị đầy đủ: avatar, họ tên, email, vai trò, ngày sinh | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC02 | Bật chế độ chỉnh sửa hồ sơ | 1. Truy cập trang profile\n2. Nhấn nút "Chỉnh sửa" (Pencil icon)\n3. Quan sát các trường | Các trường họ tên, ngày sinh, avatar trở nên editable, hiển thị nút Lưu/Hủy | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC03 | Cập nhật họ tên thành công | 1. Bật chế độ chỉnh sửa\n2. Thay đổi họ tên\n3. Nhấn "Lưu"\n4. Kiểm tra phản hồi | Họ tên được cập nhật, hiển thị thông báo thành công, form exit edit mode | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC04 | Cập nhật ngày sinh thành công | 1. Bật chế độ chỉnh sửa\n2. Thay đổi ngày sinh\n3. Nhấn "Lưu" | Ngày sinh được cập nhật, hiển thị thông báo thành công | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC05 | Upload avatar hợp lệ (JPEG) | 1. Bật chế độ chỉnh sửa\n2. Nhấn upload avatar\n3. Chọn file .jpg hợp lệ (< 5MB)\n4. Nhấn "Lưu" | Avatar mới được hiển thị, file được upload lên server | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC06 | Upload avatar hợp lệ (PNG) | 1. Bật chế độ chỉnh sửa\n2. Chọn file .png (< 5MB)\n3. Nhấn "Lưu" | Avatar mới được hiển thị | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC07 | Upload avatar hợp lệ (WebP) | 1. Bật chế độ chỉnh sửa\n2. Chọn file .webp (< 5MB)\n3. Nhấn "Lưu" | Avatar mới được hiển thị | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC08 | Upload avatar thất bại với file > 5MB | 1. Bật chế độ chỉnh sửa\n2. Chọn file .jpg có kích thước 6MB\n3. Nhấn "Lưu" | Hiển thị thông báo lỗi "File size must be 5 MB or less" | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC09 | Upload avatar thất bại với định dạng không hỗ trợ | 1. Bật chế độ chỉnh sửa\n2. Chọn file .pdf\n3. Nhấn "Lưu" | Hiển thị thông báo lỗi "Invalid file type. Use JPEG, PNG, WebP, or GIF." | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC10 | Hủy chỉnh sửa hồ sơ | 1. Bật chế độ chỉnh sửa\n2. Thay đổi thông tin\n3. Nhấn "Hủy" | Form trở về trạng thái view, các thay đổi bị discard | Đã đăng nhập, đang ở chế độ edit | Pending | Pending | Pending | |
| F07-TC11 | Cập nhật hồ sơ khi chưa điền họ tên | 1. Bật chế độ chỉnh sửa\n2. Xóa họ tên, để trống\n3. Nhấn "Lưu" | Hiển thị validation error "Họ và tên không được để trống" | Đã đăng nhập | Pending | Pending | Pending | |
| F07-TC12 | Cập nhật hồ sơ khi API trả về lỗi | 1. Bật chế độ chỉnh sửa\n2. Thay đổi thông tin\n3. Server trả về lỗi 500\n4. Nhấn "Lưu" | Hiển thị thông báo lỗi từ server, form vẫn ở chế độ edit | Server đang có lỗi | Pending | Pending | Pending | |
| F07-TC13 | Chỉ xem thông tin khi chưa đăng nhập | 1. Truy cập /profile khi chưa đăng nhập | Chuyển hướng đến trang đăng nhập hoặc hiển thị trang 401 | Chưa đăng nhập | Pending | Pending | Pending | |

---

## 11. F08 — ĐỔI MẬT KHẨU (CHANGE PASSWORD)

**Feature:** F08_ChangePassword — Thay đổi mật khẩu từ trang profile
**Mô tả yêu cầu:** Người dùng đã đăng nhập có thể thay đổi mật khẩu từ trang hồ sơ. Yêu cầu nhập mật khẩu hiện tại để xác nhận.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F08-TC01 | Đổi mật khẩu thành công | 1. Truy cập trang profile\n2. Nhấn "Đổi mật khẩu"\n3. Nhập mật khẩu hiện tại đúng\n4. Nhập mật khẩu mới hợp lệ\n5. Nhập xác nhận mật khẩu mới đúng\n6. Nhấn "Đổi mật khẩu" | Đổi thành công, hiển thị thông báo, mật khẩu được cập nhật | Đã đăng nhập | Pending | Pending | Pending | |
| F08-TC02 | Đổi mật khẩu thất bại với mật khẩu hiện tại sai | 1. Truy cập trang đổi mật khẩu\n2. Nhập mật khẩu hiện tại sai\n3. Nhập mật khẩu mới hợp lệ\n4. Nhấn "Đổi mật khẩu" | Hiển thị thông báo lỗi "Mật khẩu hiện tại không đúng" | Mật khẩu hiện tại không đúng | Pending | Pending | Pending | |
| F08-TC03 | Đổi mật khẩu thất bại khi xác nhận không khớp | 1. Nhập mật khẩu hiện tại đúng\n2. Nhập mật khẩu mới: "NewPass123"\n3. Nhập xác nhận: "DifferentPass"\n4. Nhấn "Đổi mật khẩu" | Hiển thị thông báo "Mật khẩu xác nhận không khớp" | Không có | Pending | Pending | Pending | |
| F08-TC04 | Đổi mật khẩu thất bại với mật khẩu mới < 8 ký tự | 1. Nhập mật khẩu hiện tại đúng\n2. Nhập mật khẩu mới: "123"\n3. Nhấn "Đổi mật khẩu" | Hiển thị validation error | Không có | Pending | Pending | Pending | |
| F08-TC05 | Đổi mật khẩu mới trùng với mật khẩu hiện tại | 1. Nhập mật khẩu hiện tại đúng\n2. Nhập mật khẩu mới = mật khẩu hiện tại\n3. Nhấn "Đổi mật khẩu" | Hiển thị thông báo "Mật khẩu mới không được trùng với mật khẩu hiện tại" | Mật khẩu mới = mật khẩu cũ | Pending | Pending | Pending | |
| F08-TC06 | Đổi mật khẩu khi chưa nhập mật khẩu hiện tại | 1. Bỏ trống mật khẩu hiện tại\n2. Nhập mật khẩu mới hợp lệ\n3. Nhấn "Đổi mật khẩu" | Hiển thị validation error "Mật khẩu hiện tại is required" | Không có | Pending | Pending | Pending | |

---

## 12. F09 — QUẢN LÝ LỚP HỌC (CRUD CLASSROOM)

**Feature:** F09_ClassroomCRUD — Tạo, sửa, xóa lớp học
**Mô tả yêu cầu:** Giảng viên có thể tạo mới lớp học, cập nhật thông tin lớp học (tên, mã lớp, môn học, học kỳ, số slot tối đa), và xóa lớp học. Lớp học có trạng thái IsDeleted để soft delete.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F09-TC01 | Tạo lớp học thành công | 1. Đăng nhập với vai trò giảng viên\n2. Truy cập /manage-classroom\n3. Nhấn "Tạo lớp mới"\n4. Điền thông tin: tên lớp, mã lớp, chọn môn học, học kỳ, số slot\n5. Nhấn "Tạo" | Lớp học được tạo thành công, hiển thị trong danh sách, thông báo thành công | Giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F09-TC02 | Tạo lớp học thất bại với tên lớp trùng | 1. Tạo lớp học với tên "Lớp A"\n2. Thử tạo lớp khác cũng với tên "Lớp A"\n3. Nhấn "Tạo" | Hiển thị thông báo lỗi "Tên lớp đã tồn tại" | Lớp "Lớp A" đã tồn tại | Pending | Pending | Pending | |
| F09-TC03 | Tạo lớp học thất bại khi bỏ trống các trường bắt buộc | 1. Mở form tạo lớp học\n2. Bỏ trống tên lớp, mã lớp\n3. Nhấn "Tạo" | Hiển thị validation errors cho các trường bắt buộc | Không có | Pending | Pending | Pending | |
| F09-TC04 | Tạo lớp học thất bại khi số slot ≤ 0 | 1. Nhập số slot: 0 hoặc -1\n2. Nhấn "Tạo" | Hiển thị validation error "Số slot phải lớn hơn 0" | Không có | Pending | Pending | Pending | |
| F09-TC05 | Sửa lớp học thành công | 1. Chọn lớp học đã tồn tại\n2. Nhấn "Sửa"\n3. Thay đổi thông tin\n4. Nhấn "Lưu" | Lớp học được cập nhật, thông báo thành công | Giảng viên đã tạo lớp | Pending | Pending | Pending | |
| F09-TC06 | Sửa lớp học không thuộc quyền sở hữu | 1. Đăng nhập giảng viên A\n2. Chọn lớp học của giảng viên B\n3. Nhấn "Sửa" | Không cho phép sửa, hiển thị thông báo "Bạn không có quyền sửa lớp học này" | Lớp thuộc giảng viên khác | Pending | Pending | Pending | |
| F09-TC07 | Xóa lớp học thành công | 1. Chọn lớp học thuộc quyền sở hữu\n2. Nhấn "Xóa"\n3. Xác nhận xóa | Lớp học được soft delete (IsDeleted = true), không hiển thị trong danh sách chính | Lớp học đã tồn tại | Pending | Pending | Pending | |
| F09-TC08 | Xóa lớp học có sinh viên đang học | 1. Lớp học có sinh viên đăng ký\n2. Nhấn "Xóa"\n3. Xác nhận xóa | Hiển thị cảnh báo hoặc cho phép xóa với điều kiện, sinh viên được thông báo | Lớp có sinh viên | Pending | Pending | Pending | |
| F09-TC09 | Xóa lớp học không thuộc quyền sở hữu | 1. Đăng nhập giảng viên A\n2. Chọn lớp của giảng viên B\n3. Nhấn "Xóa" | Không cho phép xóa, hiển thị thông báo lỗi | Lớp thuộc giảng viên khác | Pending | Pending | Pending | |
| F09-TC10 | Xem danh sách lớp học | 1. Đăng nhập giảng viên\n2. Truy cập /manage-classroom | Hiển thị danh sách lớp học thuộc quyền sở hữu, có phân trang, tìm kiếm | Giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F09-TC11 | Tìm kiếm lớp học | 1. Trong danh sách lớp học\n2. Nhập từ khóa vào ô tìm kiếm | Hiển thị kết quả lọc theo tên lớp, mã lớp phù hợp | Không có | Pending | Pending | Pending | |
| F09-TC12 | Lọc lớp học theo học kỳ | 1. Trong danh sách lớp học\n2. Chọn học kỳ từ dropdown | Chỉ hiển thị lớp thuộc học kỳ được chọn | Không có | Pending | Pending | Pending | |
| F09-TC13 | Phân trang danh sách lớp học | 1. Có nhiều lớp học (> 10)\n2. Xem trang 1\n3. Nhấn "Trang tiếp" | Hiển thị đúng 10 lớp mỗi trang, chuyển trang hoạt động đúng | Có ≥ 11 lớp học | Pending | Pending | Pending | |

---

## 13. F10 — THÊM/XÓA SINH VIÊN VÀO LỚP (STUDENT ENROLLMENT)

**Feature:** F10_StudentEnrollment — Thêm và xóa sinh viên khỏi lớp học
**Mô tả yêu cầu:** Giảng viên quản lý lớp học có thể thêm sinh viên vào lớp thông qua danh sách email hoặc tìm kiếm, và xóa sinh viên khỏi lớp.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F10-TC01 | Thêm sinh viên vào lớp thành công | 1. Mở trang quản lý lớp học\n2. Chuyển tab "Sinh viên"\n3. Nhấn "Thêm sinh viên"\n4. Nhập email sinh viên đã đăng ký\n5. Nhấn "Thêm" | Sinh viên được thêm vào lớp, hiển thị trong danh sách sinh viên | Sinh viên có tài khoản trong hệ thống | Pending | Pending | Pending | |
| F10-TC02 | Thêm sinh viên đã tồn tại trong lớp | 1. Sinh viên đã ở trong lớp\n2. Thử thêm sinh viên đó lần nữa | Hiển thị thông báo "Sinh viên đã có trong lớp học" | Sinh viên đã được thêm trước đó | Pending | Pending | Pending | |
| F10-TC03 | Thêm sinh viên không tồn tại trong hệ thống | 1. Nhập email không tồn tại\n2. Nhấn "Thêm" | Hiển thị thông báo "Không tìm thấy sinh viên với email này" | Email không tồn tại | Pending | Pending | Pending | |
| F10-TC04 | Xóa sinh viên khỏi lớp thành công | 1. Chọn sinh viên trong danh sách\n2. Nhấn "Xóa"\n3. Xác nhận xóa | Sinh viên bị xóa khỏi lớp, không hiển thị trong danh sách | Sinh viên đang trong lớp | Pending | Pending | Pending | |
| F10-TC05 | Xóa sinh viên đang thi | 1. Sinh viên đang trong phiên thi\n2. Thử xóa khỏi lớp | Cảnh báo hoặc không cho phép xóa, hiển thị "Sinh viên đang trong ca thi, không thể xóa" | Sinh viên có phiên thi đang active | Pending | Pending | Pending | |
| F10-TC06 | Thêm nhiều sinh viên cùng lúc | 1. Nhấn "Thêm nhiều sinh viên"\n2. Nhập danh sách email (mỗi dòng 1 email)\n3. Nhấn "Thêm" | Tất cả sinh viên hợp lệ được thêm vào lớp | Nhiều email hợp lệ | Pending | Pending | Pending | |
| F10-TC07 | Import sinh viên từ file (Excel/CSV) | 1. Nhấn "Import từ file"\n2. Upload file Excel/CSV chứa danh sách email\n3. Nhấn "Import" | Danh sách sinh viên từ file được thêm vào lớp | File có định dạng đúng | Pending | Pending | Pending | |
| F10-TC08 | Import file có định dạng sai | 1. Upload file không đúng định dạng (.txt thay vì .xlsx)\n2. Nhấn "Import" | Hiển thị thông báo lỗi "Định dạng file không hỗ trợ" | File không đúng định dạng | Pending | Pending | Pending | |
| F10-TC09 | Xem danh sách sinh viên trong lớp | 1. Chuyển tab "Sinh viên"\n3. Quan sát danh sách | Hiển thị danh sách đầy đủ: tên, email, ngày tham gia, trạng thái | Lớp có sinh viên | Pending | Pending | Pending | |
| F10-TC10 | Tìm kiếm sinh viên trong lớp | 1. Trong tab sinh viên\n2. Nhập từ khóa tìm kiếm | Kết quả được lọc theo tên hoặc email | Không có | Pending | Pending | Pending | |

---

## 14. F11 — GHI DANH LỚP HỌC (CLASSROOM ENROLLMENT)

**Feature:** F11_ClassroomEnroll — Sinh viên đăng ký vào lớp bằng mã lớp
**Mô tả yêu cầu:** Sinh viên có thể tìm kiếm và đăng ký vào lớp học bằng mã lớp (enrollment key). Sau khi đăng ký thành công, sinh viên có thể truy cập tài liệu và bài tập của lớp.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F11-TC01 | Đăng ký vào lớp thành công bằng mã lớp | 1. Đăng nhập sinh viên\n2. Truy cập /my-classroom\n3. Nhấn "Đăng ký lớp mới"\n4. Nhập mã lớp hợp lệ\n5. Nhấn "Đăng ký" | Đăng ký thành công, lớp học xuất hiện trong danh sách "Đã tham gia" | Mã lớp hợp lệ, chưa đăng ký lớp này | Pending | Pending | Pending | |
| F11-TC02 | Đăng ký với mã lớp không tồn tại | 1. Nhập mã lớp không tồn tại\n2. Nhấn "Đăng ký" | Hiển thị thông báo lỗi "Mã lớp không tồn tại. Vui lòng kiểm tra lại." | Mã lớp sai | Pending | Pending | Pending | |
| F11-TC03 | Đăng ký lớp đã tham gia | 1. Sinh viên đã tham gia lớp\n2. Thử đăng ký lớp đó lần nữa | Hiển thị thông báo "Bạn đã tham gia lớp học này rồi" | Sinh viên đã tham gia lớp | Pending | Pending | Pending | |
| F11-TC04 | Đăng ký lớp khi lớp đã đầy (số slot tối đa) | 1. Lớp đã đạt số sinh viên tối đa\n2. Sinh viên thử đăng ký | Hiển thị thông báo "Lớp học đã đầy. Không thể đăng ký." | Lớp đầy | Pending | Pending | Pending | |
| F11-TC05 | Xem danh sách lớp học đã tham gia | 1. Đăng nhập sinh viên\n2. Truy cập /my-classroom | Hiển thị danh sách lớp đã tham gia với thông tin: tên lớp, giảng viên, môn học, học kỳ | Sinh viên đã đăng ký lớp | Pending | Pending | Pending | |
| F11-TC06 | Rời khỏi lớp học | 1. Trong danh sách lớp đã tham gia\n2. Chọn lớp học\n3. Nhấn "Rời lớp"\n4. Xác nhận | Sinh viên được xóa khỏi lớp, không hiển thị trong danh sách đã tham gia | Sinh viên đang trong lớp | Pending | Pending | Pending | |
| F11-TC07 | Rời lớp khi đang có ca thi | 1. Lớp có ca thi đang chờ hoặc đang diễn ra\n2. Sinh viên thử rời lớp | Cảnh báo: "Bạn đang có ca thi trong lớp này. Rời lớp sẽ hủy đăng ký thi." và yêu cầu xác nhận | Sinh viên có ca thi trong lớp | Pending | Pending | Pending | |
| F11-TC08 | Tìm kiếm lớp học | 1. Nhấn "Tìm lớp học"\n2. Nhập từ khóa (tên lớp, môn học, giảng viên)\n3. Xem kết quả | Hiển thị kết quả lọc đúng | Không có | Pending | Pending | Pending | |
| F11-TC09 | Lọc lớp theo học kỳ | 1. Chọn học kỳ từ dropdown\n2. Xem kết quả | Chỉ hiển thị lớp thuộc học kỳ được chọn | Không có | Pending | Pending | Pending | |

---

## 15. F12 — QUẢN LÝ MÔN HỌC (SUBJECT MANAGEMENT)

**Feature:** F12_SubjectManagement — CRUD môn học
**Mô tả yêu cầu:** Admin có thể tạo, sửa, xóa môn học trong hệ thống. Mỗi môn học có mã môn, tên môn, mô tả.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F12-TC01 | Tạo môn học thành công | 1. Đăng nhập Admin\n2. Truy cập /admin/subjects\n3. Nhấn "Tạo môn học mới"\n4. Điền mã môn, tên môn, mô tả\n5. Nhấn "Tạo" | Môn học được tạo, hiển thị trong danh sách | Admin đã đăng nhập | Pending | Pending | Pending | |
| F12-TC02 | Tạo môn học thất bại với mã môn trùng | 1. Tạo môn với mã "CS101"\n2. Thử tạo môn khác cũng với mã "CS101" | Hiển thị thông báo lỗi "Mã môn học đã tồn tại" | Mã "CS101" đã tồn tại | Pending | Pending | Pending | |
| F12-TC03 | Sửa môn học | 1. Chọn môn học\n2. Nhấn "Sửa"\n3. Thay đổi tên/mô tả\n4. Nhấn "Lưu" | Môn học được cập nhật | Môn học đã tồn tại | Pending | Pending | Pending | |
| F12-TC04 | Xóa môn học | 1. Chọn môn học\n2. Nhấn "Xóa"\n3. Xác nhận | Môn học bị xóa, không hiển thị trong danh sách | Môn học đã tồn tại | Pending | Pending | Pending | |
| F12-TC05 | Xóa môn học đang được sử dụng bởi lớp học | 1. Môn học có lớp đang sử dụng\n2. Thử xóa | Hiển thị cảnh báo "Môn học đang được sử dụng bởi X lớp học" hoặc không cho xóa | Môn có lớp học | Pending | Pending | Pending | |

---

## 16. F13 — QUẢN LÝ BÀI TOÁN (PROBLEM MANAGEMENT)

**Feature:** F13_ProblemManagement — CRUD bài toán lập trình
**Mô tả yêu cầu:** Giảng viên có thể tạo, sửa, xóa bài toán lập trình. Mỗi bài toán có tiêu đề, nội dung (markdown), độ khó, code template, ngôn ngữ hỗ trợ.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F13-TC01 | Tạo bài toán thành công | 1. Truy cập /problem-banks\n2. Nhấn "Tạo bài toán mới"\n3. Điền: tiêu đề, nội dung, độ khó, code template\n4. Nhấn "Tạo" | Bài toán được tạo, hiển thị trong danh sách | Giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F13-TC02 | Tạo bài toán thất bại với tiêu đề trùng | 1. Tạo bài toán "Bài 1"\n2. Thử tạo bài khác cũng với tiêu đề "Bài 1"\n3. Nhấn "Tạo" | Hiển thị thông báo lỗi "Tiêu đề bài toán đã tồn tại" | Bài "Bài 1" đã tồn tại | Pending | Pending | Pending | |
| F13-TC03 | Tạo bài toán với độ khó EASY | 1. Chọn độ khó: EASY\n2. Tạo bài toán\n3. Lưu | Bài toán được tạo với Difficulty = EASY | Không có | Pending | Pending | Pending | |
| F13-TC04 | Tạo bài toán với độ khó MEDIUM | 1. Chọn độ khó: MEDIUM\n2. Tạo bài toán | Bài toán được tạo với Difficulty = MEDIUM | Không có | Pending | Pending | Pending | |
| F13-TC05 | Tạo bài toán với độ khó HARD | 1. Chọn độ khó: HARD\n2. Tạo bài toán | Bài toán được tạo với Difficulty = HARD | Không có | Pending | Pending | Pending | |
| F13-TC06 | Tạo bài toán với code template | 1. Nhập code template cho Python\n2. Tạo bài toán | Code template được lưu và hiển thị khi sinh viên làm bài | Không có | Pending | Pending | Pending | |
| F13-TC07 | Tạo bài toán với nội dung Markdown | 1. Nhập nội dung có định dạng Markdown (bảng, code block)\n2. Tạo bài toán | Nội dung được lưu và render đúng định dạng Markdown | Không có | Pending | Pending | Pending | |
| F13-TC08 | Sửa bài toán | 1. Chọn bài toán\n2. Nhấn "Sửa"\n3. Thay đổi tiêu đề, nội dung\n4. Nhấn "Lưu" | Bài toán được cập nhật | Bài toán đã tồn tại | Pending | Pending | Pending | |
| F13-TC09 | Xóa bài toán không có submissions | 1. Chọn bài toán không có submission\n2. Nhấn "Xóa"\n3. Xác nhận | Bài toán được xóa, không hiển thị trong danh sách | Bài toán không có submission | Pending | Pending | Pending | |
| F13-TC10 | Xóa bài toán có submissions | 1. Bài toán có sinh viên đã nộp\n2. Nhấn "Xóa"\n3. Xác nhận | Hiển thị cảnh báo, bài toán bị soft delete hoặc không cho xóa | Bài toán có submissions | Pending | Pending | Pending | |
| F13-TC11 | Tìm kiếm bài toán | 1. Trong danh sách bài toán\n2. Nhập từ khóa tìm kiếm | Kết quả được lọc theo tiêu đề, nội dung | Không có | Pending | Pending | Pending | |
| F13-TC12 | Lọc bài toán theo độ khó | 1. Chọn độ khó từ filter\n2. Xem kết quả | Chỉ hiển thị bài toán có độ khó được chọn | Không có | Pending | Pending | Pending | |
| F13-TC13 | Phân trang danh sách bài toán | 1. Có > 10 bài toán\n2. Xem trang 1\n3. Chuyển trang | Hiển thị đúng 10 bài mỗi trang, phân trang hoạt động đúng | Có ≥ 11 bài toán | Pending | Pending | Pending | |

---

## 17. F14 — QUẢN LÝ TEST CASE (TEST CASE MANAGEMENT)

**Feature:** F14_TestCaseManagement — Tạo, sửa, xóa test case cho bài toán
**Mô tả yêu cầu:** Giảng viên quản lý test case cho bài toán, bao gồm test case công khai (public) và test case ẩn (hidden) dùng để chấm điểm tự động.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F14-TC01 | Tạo test case công khai thành công | 1. Mở trang chỉnh sửa bài toán\n2. Thêm test case mới\n3. Nhập input, expected output\n4. Tick "Public" = true\n5. Nhấn "Lưu" | Test case được tạo, hiển thị trong danh sách | Bài toán đã tồn tại | Pending | Pending | Pending | |
| F14-TC02 | Tạo test case ẩn (hidden) | 1. Thêm test case mới\n2. Tick "Public" = false (hoặc bỏ tick)\n3. Lưu | Test case ẩn được tạo, không hiển thị cho sinh viên | Bài toán đã tồn tại | Pending | Pending | Pending | |
| F14-TC03 | Tạo test case với input rỗng | 1. Để trống input\n2. Nhập expected output\n3. Lưu | Hiển thị validation error hoặc cho phép (tùy yêu cầu) | Không có | Pending | Pending | Pending | |
| F14-TC04 | Tạo test case với expected output rỗng | 1. Nhập input\n2. Để trống expected output\n3. Lưu | Hiển thị validation error hoặc cho phép | Không có | Pending | Pending | Pending | |
| F14-TC05 | Tạo test case với Compare Mode = CaseInsensitive | 1. Thêm test case\n2. Chọn Compare Mode: CaseInsensitive\n3. Lưu | Test case được lưu với mode so sánh không phân biệt hoa thường | Không có | Pending | Pending | Pending | |
| F14-TC06 | Tạo test case với Compare Mode = FloatingPoint | 1. Thêm test case\n2. Chọn Compare Mode: FloatingPoint\n3. Nhập Tolerance (ví dụ: 0.001)\n4. Lưu | Test case được lưu với floating point tolerance | Không có | Pending | Pending | Pending | |
| F14-TC07 | Tạo test case với Compare Mode = Token | 1. Thêm test case\n2. Chọn Compare Mode: Token\n3. Lưu | Test case được lưu với token comparison | Không có | Pending | Pending | Pending | |
| F14-TC08 | Sửa test case | 1. Chọn test case\n2. Nhấn "Sửa"\n3. Thay đổi input/output\n4. Lưu | Test case được cập nhật | Test case đã tồn tại | Pending | Pending | Pending | |
| F14-TC09 | Xóa test case | 1. Chọn test case\n2. Nhấn "Xóa"\n3. Xác nhận | Test case bị xóa, không hiển thị trong danh sách | Test case đã tồn tại | Pending | Pending | Pending | |
| F14-TC10 | Sắp xếp thứ tự test case | 1. Kéo thả test case để sắp xếp\n2. Lưu | Thứ tự test case được cập nhật | Có ≥ 2 test cases | Pending | Pending | Pending | |
| F14-TC11 | Sinh test case tự động (AI Generator) | 1. Nhấn "Sinh test case tự động"\n2. Xem kết quả | Hệ thống sinh test case dựa trên input/output mẫu, sinh viên không thấy được test case ẩn | Bài toán đã tồn tại | Pending | Pending | Pending | |
| F14-TC12 | Import test cases từ file | 1. Nhấn "Import test cases"\n2. Upload file JSON/Excel\n3. Xem preview\n4. Nhấn "Import" | Các test case từ file được thêm vào | File đúng định dạng | Pending | Pending | Pending | |
| F14-TC13 | Export test cases | 1. Nhấn "Export test cases"\n2. Chọn định dạng (JSON/Excel)\n3. Tải file | File được tải về với danh sách test case | Có test case trong bài toán | Pending | Pending | Pending | |

---

## 18. F15 — QUẢN LÝ NGÔN NGỮ LẬP TRÌNH (PROGRAMMING LANGUAGE)

**Feature:** F15_ProgrammingLanguage — Thêm, sửa, xóa ngôn ngữ lập trình
**Mô tả yêu cầu:** Admin quản lý danh sách ngôn ngữ lập trình được hỗ trợ trong hệ thống (Python, Java, C++, JavaScript...).
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F15-TC01 | Thêm ngôn ngữ lập trình thành công | 1. Đăng nhập Admin\n2. Truy cập /admin/programming-languages\n3. Nhấn "Thêm ngôn ngữ"\n4. Điền: tên, compiler ID, version\n5. Nhấn "Lưu" | Ngôn ngữ được thêm, hiển thị trong danh sách | Admin đã đăng nhập | Pending | Pending | Pending | |
| F15-TC02 | Thêm ngôn ngữ trùng lặp | 1. Thêm ngôn ngữ "Python"\n2. Thử thêm "Python" lần nữa | Hiển thị thông báo lỗi "Ngôn ngữ đã tồn tại" | Python đã tồn tại | Pending | Pending | Pending | |
| F15-TC03 | Sửa ngôn ngữ lập trình | 1. Chọn ngôn ngữ\n2. Nhấn "Sửa"\n3. Thay đổi version\n4. Lưu | Ngôn ngữ được cập nhật | Ngôn ngữ đã tồn tại | Pending | Pending | Pending | |
| F15-TC04 | Xóa ngôn ngữ không được sử dụng | 1. Chọn ngôn ngữ không có bài toán nào dùng\n2. Nhấn "Xóa"\n3. Xác nhận | Ngôn ngữ bị xóa khỏi hệ thống | Ngôn ngữ chưa được sử dụng | Pending | Pending | Pending | |
| F15-TC05 | Xóa ngôn ngữ đang được sử dụng | 1. Ngôn ngữ đang được bài toán sử dụng\n2. Nhấn "Xóa" | Hiển thị cảnh báo, không cho xóa | Ngôn ngữ đang được sử dụng | Pending | Pending | Pending | |

---

## 19. F16 — QUẢN LÝ CA THI (EXAMINATION MANAGEMENT)

**Feature:** F16_ExaminationManagement — CRUD ca thi
**Mô tả yêu cầu:** Giảng viên tạo, sửa, xóa ca thi cho lớp học. Ca thi có các thuộc tính: tên, thời gian bắt đầu/kết thúc, chế độ (PRACTICAL/EXAMINATION), ngôn ngữ lập trình, danh sách bài toán.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F16-TC01 | Tạo ca thi thành công | 1. Truy cập /exam-banks\n2. Nhấn "Tạo ca thi"\n3. Điền thông tin: tên, thời gian, chế độ, ngôn ngữ\n4. Chọn bài toán từ danh sách\n5. Nhấn "Tạo" | Ca thi được tạo, hiển thị trong danh sách, jobs được schedule | Lớp học đã tồn tại | Pending | Pending | Pending | |
| F16-TC02 | Tạo ca thi với thời gian bắt đầu trong quá khứ | 1. Chọn thời gian bắt đầu < now\n2. Tạo ca thi | Ca thi được tạo nhưng job OPEN được fire ngay lập tức | Không có | Pending | Pending | Pending | |
| F16-TC03 | Tạo ca thi với thời gian kết thúc trước thời gian bắt đầu | 1. EndDatetime < StartDatetime\n2. Tạo ca thi | Hiển thị validation error "Thời gian kết thúc phải sau thời gian bắt đầu" | Không có | Pending | Pending | Pending | |
| F16-TC04 | Tạo ca thi với chế độ PRACTICAL | 1. Chọn mode = PRACTICAL\n2. Tạo ca thi | Ca thi được tạo với Mode = PRACTICAL | Không có | Pending | Pending | Pending | |
| F16-TC05 | Tạo ca thi với chế độ EXAMINATION | 1. Chọn mode = EXAMINATION\n2. Tạo ca thi | Ca thi được tạo với Mode = EXAMINATION, sinh viên cần bắt đầu phiên thi trước | Không có | Pending | Pending | Pending | |
| F16-TC06 | Tạo ca thi không chọn bài toán | 1. Bỏ trống danh sách bài toán\n2. Tạo ca thi | Ca thi được tạo với 0 bài toán | Không có | Pending | Pending | Pending | |
| F16-TC07 | Tạo ca thi với bài toán có điểm | 1. Chọn bài toán\n2. Nhập điểm cho từng bài toán\n3. Tạo ca thi | Điểm của mỗi bài toán được lưu, tổng điểm = tổng điểm bài toán | Không có | Pending | Pending | Pending | |
| F16-TC08 | Sửa ca thi — thay đổi thời gian bắt đầu | 1. Chọn ca thi đang PENDING\n2. Sửa StartDatetime\n3. Lưu | Ca thi được cập nhật, jobs được reschedule | Ca thi PENDING | Pending | Pending | Pending | |
| F16-TC09 | Sửa ca thi — thay đổi thời gian kết thúc | 1. Chọn ca thi\n2. Sửa EndDatetime\n3. Lưu | Jobs được reschedule | Ca thi PENDING | Pending | Pending | Pending | |
| F16-TC10 | Sửa ca thi — không thay đổi thời gian | 1. Sửa chỉ tên/mô tả\n2. Lưu | Ca thi được cập nhật, jobs không bị reschedule | Ca thi đã tồn tại | Pending | Pending | Pending | |
| F16-TC11 | Xóa ca thi đang PENDING | 1. Ca thi chưa bắt đầu (PENDING)\n2. Nhấn "Xóa"\n3. Xác nhận | Ca thi bị xóa, jobs bị hủy, không còn hiển thị | Ca thi PENDING | Pending | Pending | Pending | |
| F16-TC12 | Xóa ca thi đang ONGOING | 1. Ca thi đang diễn ra\n2. Nhấn "Xóa"\n3. Xác nhận | Cảnh báo "Ca thi đang diễn ra. Việc xóa sẽ hủy tất cả submissions đang chạy." | Ca thi ONGOING | Pending | Pending | Pending | |
| F16-TC13 | Xem chi tiết ca thi | 1. Chọn ca thi\n2. Nhấn "Chi tiết" | Hiển thị đầy đủ: tên, thời gian, chế độ, bài toán, số sinh viên tham gia | Ca thi đã tồn tại | Pending | Pending | Pending | |
| F16-TC14 | Xem danh sách submissions của ca thi | 1. Mở chi tiết ca thi\n2. Chuyển tab "Submissions" | Hiển thị danh sách tất cả submissions của sinh viên | Ca thi có submissions | Pending | Pending | Pending | |
| F16-TC15 | Lọc ca thi theo trạng thái | 1. Trong danh sách ca thi\n2. Chọn filter: PENDING / ONGOING / COMPLETED | Chỉ hiển thị ca thi có trạng thái được chọn | Không có | Pending | Pending | Pending | |

---

## 20. F17 — QUẢN LÝ TEMPLATE CA THI (EXAMINATION TEMPLATE)

**Feature:** F17_ExaminationTemplate — Tạo, sửa, xóa, copy template ca thi
**Mô tả yêu cầu:** Giảng viên tạo template ca thi để tái sử dụng cho nhiều lớp/học kỳ. Template chứa danh sách bài toán, cấu hình chung.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F17-TC01 | Tạo template thành công | 1. Truy cập /exam-banks\n2. Nhấn "Tạo template"\n3. Điền tên template, chọn bài toán\n4. Nhấn "Lưu" | Template được tạo | Không có | Pending | Pending | Pending | |
| F17-TC02 | Copy template thành ca thi | 1. Chọn template\n2. Nhấn "Tạo ca thi từ template"\n3. Điền thông tin bổ sung (thời gian, lớp)\n4. Nhấn "Tạo" | Ca thi mới được tạo với cấu hình giống template | Template đã tồn tại | Pending | Pending | Pending | |
| F17-TC03 | Sửa template | 1. Chọn template\n2. Nhấn "Sửa"\n3. Thay đổi bài toán trong template\n4. Lưu | Template được cập nhật, các ca thi đã tạo không bị ảnh hưởng | Template đã tồn tại | Pending | Pending | Pending | |
| F17-TC04 | Xóa template | 1. Chọn template\n2. Nhấn "Xóa"\n3. Xác nhận | Template bị xóa, các ca thi đã tạo từ template không bị ảnh hưởng | Template đã tồn tại | Pending | Pending | Pending | |
| F17-TC05 | Khôi phục template đã xóa mềm | 1. Template đã bị soft delete\n2. Tick "Hiển thị đã xóa"\n3. Nhấn "Khôi phục" | Template được khôi phục, hiển thị lại trong danh sách | Template đã soft delete | Pending | Pending | Pending | |

---

## 21. F18 — BẮT ĐẦU/KẾT THÚC CA THI (START/END EXAMINATION)

**Feature:** F18_StartEndExamination — Sinh viên bắt đầu và nộp bài thi
**Mô tả yêu cầu:** Sinh viên bắt đầu làm bài thi khi ca thi bắt đầu. Hệ thống tự động kết thúc khi hết giờ hoặc sinh viên chủ động nộp bài.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F18-TC01 | Bắt đầu thi thành công | 1. Ca thi đang ONGOING\n2. Sinh viên nhấn "Bắt đầu thi"\n3. Xác nhận | Phiên thi được tạo (Phase = Active), chuyển đến trang làm bài, timer bắt đầu đếm ngược | Ca thi ONGOING, sinh viên đã đăng ký | Pending | Pending | Pending | |
| F18-TC02 | Bắt đầu thi khi ca thi chưa bắt đầu | 1. Ca thi PENDING (chưa đến giờ)\n2. Sinh viên nhấn "Bắt đầu thi" | Hiển thị thông báo "Ca thi chưa bắt đầu. Vui lòng đợi đến [thời gian bắt đầu]." | Ca thi PENDING | Pending | Pending | Pending | |
| F18-TC03 | Bắt đầu thi khi ca thi đã kết thúc | 1. Ca thi COMPLETED\n2. Sinh viên nhấn "Bắt đầu thi" | Hiển thị thông báo "Ca thi đã kết thúc. Không thể bắt đầu." | Ca thi COMPLETED | Pending | Pending | Pending | |
| F18-TC04 | Sinh viên bắt đầu thi 2 lần | 1. Đã bắt đầu thi lần 1\n2. Thử bắt đầu lại | Trả về phiên thi hiện tại, không tạo phiên mới (idempotent) | Phiên thi đang Active | Pending | Pending | Pending | |
| F18-TC05 | Nộp bài thi thành công | 1. Đang trong phiên thi Active\n2. Nhấn "Nộp bài"\n3. Xác nhận | Phiên thi chuyển sang Phase = Submitted, thời gian nộp được ghi, không cho làm bài tiếp | Phiên thi Active | Pending | Pending | Pending | |
| F18-TC06 | Nộp bài khi đã nộp rồi | 1. Phiên thi đã Submitted\n2. Thử nộp lại | Hiển thị thông báo "Bạn đã nộp bài. Không thể nộp lại." | Phiên thi Submitted | Pending | Pending | Pending | |
| F18-TC07 | Hệ thống tự động nộp bài khi hết giờ | 1. Timer đếm ngược về 0\n2. Đợi | Bài thi được nộp tự động, phiên thi chuyển sang Submitted | Timer hết giờ | Pending | Pending | Pending | |
| F18-TC08 | Kiểm tra countdown timer | 1. Bắt đầu thi\n2. Quan sát timer | Timer hiển thị đúng thời gian còn lại, cập nhật mỗi giây | Phiên thi Active | Pending | Pending | Pending | |
| F18-TC09 | Giảng viên ép nộp bài sinh viên | 1. Giảng viên chọn sinh viên đang thi\n2. Nhấn "Ép nộp bài"\n3. Xác nhận | Phiên thi của sinh viên bị chuyển sang Submitted, sinh viên không thể tiếp tục làm bài | Sinh viên đang trong phiên Active | Pending | Pending | Pending | |
| F18-TC10 | Xem thông báo khi còn 5 phút | 1. Timer còn 5 phút\n2. Quan sát | Hiển thị warning "Còn 5 phút nữa. Hãy nộp bài." | Timer = 5 phút | Pending | Pending | Pending | |
| F18-TC11 | Xem thông báo khi còn 1 phút | 1. Timer còn 1 phút\n2. Quan sát | Hiển thị warning "Còn 1 phút! Hãy nộp bài ngay." | Timer = 1 phút | Pending | Pending | Pending | |

---

## 22. F19 — KIỂM TRA ĐẠO VĂN (PLAGIARISM DETECTION)

**Feature:** F19_Plagiarism — Phát hiện bài nộp trùng lặp/đạo văn
**Mô tả yêu cầu:** Giảng viên xem báo cáo đạo văn giữa các submissions trong ca thi. Hệ thống so sánh code và hiển thị mức độ tương đồng.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F19-TC01 | Xem danh sách cặp submissions đạo văn | 1. Truy cập chi tiết ca thi\n2. Chuyển tab "Đạo văn"\n3. Xem danh sách | Hiển thị danh sách các cặp submissions có độ tương đồng cao | Ca thi có submissions | Pending | Pending | Pending | |
| F19-TC02 | Xem chi tiết so sánh 2 submissions | 1. Chọn một cặp submissions đáng ngờ\n2. Nhấn "Xem chi tiết"\n3. Quan sát diff | Hiển thị side-by-side diff, highlight các đoạn code trùng lặp | Có cặp submissions đạo văn | Pending | Pending | Pending | |
| F19-TC03 | Xem điểm tương đồng | 1. Mở chi tiết cặp đạo văn\n2. Quan sát điểm | Hiển thị % tương đồng (ví dụ: 85%) | Có cặp submissions | Pending | Pending | Pending | |
| F19-TC04 | Filter theo ngưỡng tương đồng | 1. Trong tab đạo văn\n2. Chọn ngưỡng ≥ 70%\n3. Xem kết quả | Chỉ hiển thị các cặp có điểm tương đồng ≥ 70% | Không có | Pending | Pending | Pending | |
| F19-TC05 | Không có submissions để so sánh | 1. Ca thi có 0 hoặc 1 submission\n2. Mở tab đạo văn | Hiển thị thông báo "Chưa có đủ submissions để so sánh" | < 2 submissions | Pending | Pending | Pending | |

---

## 23. F20 — QUẢN LÝ PHIÊN THI (STUDENT EXAM SESSION)

**Feature:** F20_StudentExamSession — Quản lý trạng thái phiên thi của sinh viên
**Mô tả yêu cầu:** Hệ thống quản lý phiên thi với các phase: Active, Submitted. Kiểm tra trạng thái phiên trước khi cho phép nộp bài.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F20-TC01 | Tạo phiên thi thành công | 1. Sinh viên bắt đầu thi\n2. Quan sát trạng thái | Phiên thi được tạo với Phase = Active, StartTime = now | Ca thi ONGOING | Pending | Pending | Pending | |
| F20-TC02 | Kiểm tra phiên thi không tồn tại khi nộp bài | 1. Không có phiên thi (chưa bắt đầu)\n2. Thử nộp bài | Ném lỗi "Exam session is not active. Start the exam from the exam page before submitting." | Không có phiên thi | Pending | Pending | Pending | |
| F20-TC03 | Kiểm tra phiên thi đã nộp | 1. Sinh viên đã nộp bài\n2. Thử nộp lại | Ném lỗi hoặc idempotent (tùy impl) — không tạo submission mới | Phiên thi Submitted | Pending | Pending | Pending | |
| F20-TC04 | Kiểm tra hết giờ tự động nộp | 1. Timer hết giờ\n2. Quan sát | Phiên thi tự động chuyển Submitted, bài được nộp | Timer = 0 | Pending | Pending | Pending | |
| F20-TC05 | Xem trạng thái phiên thi hiện tại | 1. Sinh viên đang thi\n2. Mở lại trang thi | Hiển thị trạng thái Active, thời gian còn lại, các bài đã nộp | Phiên thi Active | Pending | Pending | Pending | |
| F20-TC06 | Sync trạng thái phiên với server | 1. Local có phiên thi cũ\n2. Server có phiên thi mới hơn\n3. Load trang | Local được sync với server, hiển thị trạng thái mới nhất | Có phiên thi ở cả local và server | Pending | Pending | Pending | |

---

## 24. F21 — NỘP BÀI (SUBMISSION)

**Feature:** F21_Submission — Sinh viên nộp bài code
**Mô tả yêu cầu:** Sinh viên nộp bài code cho bài toán. Hệ thống tạo submission mới với version tăng dần. Kiểm tra phiên thi trong chế độ EXAMINATION.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F21-TC01 | Nộp bài lần đầu tiên | 1. Chưa có submission nào\n2. Nộp code\n3. Quan sát | Submission được tạo với Version = 1, Status = PENDING | Không có submission trước đó | Pending | Pending | Pending | |
| F21-TC02 | Nộp bài lần thứ 2 | 1. Đã có Version = 1\n2. Nộp lại code\n3. Quan sát | Submission mới được tạo với Version = 2 | Đã có submission | Pending | Pending | Pending | |
| F21-TC03 | Nộp bài với code rỗng | 1. Code = ""\n2. Nộp bài | Tùy validation: hiển thị lỗi hoặc cho nộp rỗng | Không có | Pending | Pending | Pending | |
| F21-TC04 | Nộp bài trong chế độ PRACTICAL (không cần phiên thi) | 1. Ca thi mode = PRACTICAL\n2. Nộp bài mà không bắt đầu phiên thi | Submission được tạo bình thường | Ca thi PRACTICAL | Pending | Pending | Pending | |
| F21-TC05 | Nộp bài trong chế độ EXAMINATION với phiên thi Active | 1. Ca thi mode = EXAMINATION\n2. Đã bắt đầu phiên thi\n3. Nộp bài | Submission được tạo | Phiên thi Active | Pending | Pending | Pending | |
| F21-TC06 | Nộp bài trong chế độ EXAMINATION khi chưa bắt đầu phiên | 1. Ca thi mode = EXAMINATION\n2. Chưa bắt đầu phiên thi\n3. Nộp bài | Hiển thị lỗi "Exam session is not active. Start the exam from the exam page before submitting." | Phiên thi không Active | Pending | Pending | Pending | |
| F21-TC07 | Nộp bài khi phiên thi đã Submitted | 1. Phiên thi Submitted\n2. Thử nộp bài | Hiển thị lỗi "Exam session is not active..." | Phiên thi Submitted | Pending | Pending | Pending | |
| F21-TC08 | Xem lịch sử submissions | 1. Mở trang bài toán\n2. Chuyển tab "Submissions" | Hiển thị danh sách tất cả submissions với version, thời gian, điểm | Có submissions | Pending | Pending | Pending | |
| F21-TC09 | Xem chi tiết submission | 1. Chọn submission\n2. Nhấn "Xem chi tiết" | Hiển thị: code đã nộp, kết quả chạy public test case, thời gian chạy | Submission đã tồn tại | Pending | Pending | Pending | |
| F21-TC10 | Nộp bài khi server trả về lỗi | 1. Gửi submission request\n2. Server trả về 500\n3. Quan sát | Hiển thị thông báo lỗi, submission không được tạo | Server đang có lỗi | Pending | Pending | Pending | |

---

## 25. F22 — CHẤM ĐIỂM TỰ ĐỘNG (AUTO-GRADING)

**Feature:** F22_AutoGrading — Chấm điểm tự động bằng hidden test cases
**Mô tả yêu cầu:** Hệ thống tự động chấm điểm submissions bằng cách chạy code trên hidden test cases. Điểm được tính dựa trên số test case passed.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F22-TC01 | Tất cả test cases đều passed | 1. Code đúng cho tất cả test cases\n2. Nộp bài\n3. Chờ grading | FinalScore = điểm tối đa, Status = GRADED, Passed = total | Tất cả hidden test cases passed | Pending | Pending | Pending | |
| F22-TC02 | Một số test cases passed | 1. Code đúng cho 3/5 test cases\n2. Nộp bài\n3. Chờ grading | FinalScore = (3/5) × điểm bài toán, Status = GRADED | 3/5 passed | Pending | Pending | Pending | |
| F22-TC03 | Không có test case nào passed | 1. Code sai cho tất cả test cases\n2. Nộp bài\n3. Chờ grading | FinalScore = 0, Status = GRADED | 0/5 passed | Pending | Pending | Pending | |
| F22-TC04 | Compilation error | 1. Code có lỗi biên dịch\n2. Nộp bài\n3. Quan sát | FinalScore = 0, Status = GRADED, hiển thị thông báo lỗi compile | Code không biên dịch được | Pending | Pending | Pending | |
| F22-TC05 | Runtime error | 1. Code chạy sinh runtime error\n2. Nộp bài\n3. Quan sát | FinalScore = 0, hiển thị lỗi runtime, Status = GRADED | Code có runtime error | Pending | Pending | Pending | |
| F22-TC06 | Time limit exceeded | 1. Code chạy quá thời gian cho phép\n2. Nộp bài\n3. Quan sát | FinalScore = 0, hiển thị "Time Limit Exceeded" | Code vượt time limit | Pending | Pending | Pending | |
| F22-TC07 | Memory limit exceeded | 1. Code sử dụng quá bộ nhớ\n2. Nộp bài\n3. Quan sát | FinalScore = 0, hiển thị "Memory Limit Exceeded" | Code vượt memory limit | Pending | Pending | Pending | |
| F22-TC08 | Thông báo cho sinh viên sau khi chấm xong | 1. Submission được chấm điểm\n2. Sinh viên online | Sinh viên nhận thông báo realtime qua SignalR với NotificationType.GRADE_RESULT | Student đang online | Pending | Pending | Pending | |
| F22-TC09 | Giảng viên chấm lại một submission | 1. Giảng viên chọn submission\n2. Nhấn "Chấm lại"\n3. Quan sát | Submission được chấm lại, điểm và test results được cập nhật | Submission đã tồn tại | Pending | Pending | Pending | |
| F22-TC10 | Giảng viên chấm lại tất cả submissions của một bài toán | 1. Giảng viên chọn bài toán\n2. Nhấn "Chấm lại tất cả"\n3. Quan sát | Tất cả submissions được chấm lại, thống kê kết quả được hiển thị | Có submissions chờ chấm | Pending | Pending | Pending | |
| F22-TC11 | Giảng viên ghi đè điểm thủ công | 1. Giảng viên chọn submission\n2. Nhấn "Ghi đè điểm"\n3. Nhập điểm mới (≤ maxMark)\n4. Lưu | Điểm được cập nhật, thông báo gửi cho sinh viên | Submission đã graded | Pending | Pending | Pending | |
| F22-TC12 | Ghi đè điểm vượt maxMark | 1. Nhập điểm mới > maxMark\n2. Lưu | Hiển thị lỗi "Score cannot exceed max mark" | Không có | Pending | Pending | Pending | |
| F22-TC13 | Kết quả chấm với CompareMode = CaseInsensitive | 1. Output: "HELLO", Expected: "hello"\n2. Submit\n3. Quan sát | Test case passed (so sánh không phân biệt hoa thường) | CompareMode = CaseInsensitive | Pending | Pending | Pending | |
| F22-TC14 | Kết quả chấm với CompareMode = FloatingPoint | 1. Output: "3.14159", Expected: "3.14160" với tolerance 0.001\n2. Submit\n3. Quan sát | Test case passed (trong dung sai) | CompareMode = FloatingPoint | Pending | Pending | Pending | |

---

## 26. F23 — TRÌNH SOẠN THẢO CODE (CODE EDITOR)

**Feature:** F23_CodeEditor — Soạn và chạy code trong trình soạn thảo
**Mô tả yêu cầu:** Sinh viên sử dụng Monaco Editor để viết code với syntax highlighting, autocomplete. Code được auto-save vào localStorage.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F23-TC01 | Viết code với syntax highlighting | 1. Mở code editor\n2. Viết code Python\n3. Quan sát | Syntax highlighting hoạt động đúng cho Python | Không có | Pending | Pending | Pending | |
| F23-TC02 | Đổi ngôn ngữ lập trình | 1. Viết code\n2. Chọn ngôn ngữ: Java\n3. Quan sát | Editor chuyển sang Java syntax, code template thay đổi | Ca thi hỗ trợ Java | Pending | Pending | Pending | |
| F23-TC03 | Auto-save code vào localStorage | 1. Viết code\n2. Đợi 2-3 giây\n3. Refresh trang\n4. Quan sát | Code được khôi phục sau khi refresh | Đang trong phiên thi | Pending | Pending | Pending | |
| F23-TC04 | Chạy code với public test case | 1. Viết code\n2. Nhấn "Run"\n3. Xem kết quả | Hiển thị output, so sánh với expected output, hiển thị Passed/Failed | Code đã viết | Pending | Pending | Pending | |
| F23-TC05 | Format code | 1. Viết code không format\n2. Nhấn "Format" (Alt+Shift+F)\n3. Quan sát | Code được format theo chuẩn ngôn ngữ (clang-format cho C) | Không có | Pending | Pending | Pending | |
| F23-TC06 | Reset code về template ban đầu | 1. Viết code\n2. Nhấn "Reset"\n3. Xác nhận\n4. Quan sát | Code quay về template ban đầu, các thay đổi bị mất | Không có | Pending | Pending | Pending | |
| F23-TC07 | Fullscreen mode | 1. Nhấn "Fullscreen"\n2. Quan sát | Editor mở rộng full màn hình | Không có | Pending | Pending | Pending | |
| F23-TC08 | Font size adjustment | 1. Thay đổi font size\n2. Quan sát | Font size của editor được thay đổi | Không có | Pending | Pending | Pending | |
| F23-TC09 | Xem console output | 1. Chạy code\n2. Quan sát panel console | Console hiển thị output, lỗi (stderr) | Code đã chạy | Pending | Pending | Pending | |
| F23-TC10 | Xem đề bài trong cùng trang | 1. Mở bài thi\n2. Quan sát | Đề bài hiển thị ở panel bên trái, code editor ở giữa | Đang thi | Pending | Pending | Pending | |

---

## 27. F24 — THẢO LUẬN (DISCUSSION)

**Feature:** F24_Discussion — Sinh viên đặt câu hỏi, giảng viên trả lời trong lớp học
**Mô tả yêu cầu:** Sinh viên và giảng viên có thể tạo và tham gia thảo luận về bài tập, vấn đề trong lớp học. Giảng viên có thể đánh dấu đã giải quyết.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F24-TC01 | Tạo thảo luận mới | 1. Truy cập lớp học\n2. Chuyển tab "Thảo luận"\n3. Nhấn "Tạo thảo luận"\n4. Nhập tiêu đề, nội dung\n5. Nhấn "Đăng" | Thảo luận được tạo, hiển thị trong danh sách | Lớp học đã có | Pending | Pending | Pending | |
| F24-TC02 | Trả lời thảo luận | 1. Chọn thảo luận\n2. Nhập nội dung trả lời\n3. Nhấn "Gửi" | Reply được thêm vào thảo luận | Thảo luận đã tồn tại | Pending | Pending | Pending | |
| F24-TC03 | Đánh dấu đã giải quyết | 1. Giảng viên chọn thảo luận\n2. Nhấn "Đánh dấu đã giải quyết" | IsResolved = true, hiển thị badge | Giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F24-TC04 | Xóa thảo luận của mình | 1. Sinh viên xóa thảo luận do mình tạo\n2. Xác nhận | Thảo luận bị xóa | Thảo luận do user tạo | Pending | Pending | Pending | |
| F24-TC05 | Xóa thảo luận của người khác | 1. Sinh viên thử xóa thảo luận của người khác | Không cho phép xóa, hiển thị thông báo lỗi | Thảo luận thuộc user khác | Pending | Pending | Pending | |
| F24-TC06 | Xem chi tiết thảo luận | 1. Chọn thảo luận\n2. Nhấn "Chi tiết" | Hiển thị đầy đủ: tiêu đề, nội dung, replies | Thảo luận đã tồn tại | Pending | Pending | Pending | |
| F24-TC07 | Filter thảo luận đã giải quyết / chưa giải quyết | 1. Trong danh sách thảo luận\n2. Chọn filter | Chỉ hiển thị thảo luận theo trạng thái được chọn | Không có | Pending | Pending | Pending | |

---

## 28. F25 — QUIZ

**Feature:** F25_Quiz — Làm quiz trắc nghiệm
**Mô tả yêu cầu:** Giảng viên tạo quiz với câu hỏi trắc nghiệm. Sinh viên làm quiz, hệ thống chấm điểm tự động.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F25-TC01 | Bắt đầu làm quiz | 1. Chọn quiz\n2. Nhấn "Bắt đầu" | QuizAttempt được tạo, hiển thị câu hỏi đầu tiên | Quiz đã tồn tại | Pending | Pending | Pending | |
| F25-TC02 | Chọn đáp án | 1. Đọc câu hỏi\n2. Chọn một đáp án | Đáp án được highlight/chọn | Đang làm quiz | Pending | Pending | Pending | |
| F25-TC03 | Chuyển câu hỏi tiếp theo | 1. Làm xong câu 1\n2. Nhấn "Câu tiếp theo" | Hiển thị câu hỏi tiếp theo, đáp án câu trước được lưu | Đang làm quiz | Pending | Pending | Pending | |
| F25-TC04 | Quay lại câu trước | 1. Đang ở câu 3\n2. Nhấn "Câu trước" | Quay lại câu 2, đáp án đã chọn được hiển thị | Đang làm quiz | Pending | Pending | Pending | |
| F25-TC05 | Nộp quiz với tất cả câu trả lời | 1. Làm hết các câu\n2. Nhấn "Nộp bài"\n3. Xác nhận | Quiz được chấm điểm, hiển thị kết quả | Hoàn thành tất cả câu hỏi | Pending | Pending | Pending | |
| F25-TC06 | Nộp quiz khi chưa trả lời hết | 1. Chỉ trả lời 5/10 câu\n2. Nhấn "Nộp bài"\n3. Xác nhận | Câu chưa trả lời được tính 0 điểm, hiển thị kết quả với cảnh báo | Chưa trả lời hết | Pending | Pending | Pending | |
| F25-TC07 | Hết giờ tự động nộp | 1. Quiz có time limit\n2. Timer hết giờ | Quiz được nộp tự động với các câu đã trả lời | Timer = 0 | Pending | Pending | Pending | |
| F25-TC08 | Xem lại kết quả quiz | 1. Đã nộp quiz\n2. Mở lại quiz | Hiển thị điểm, các đáp án đúng/sai | QuizAttempt đã submit | Pending | Pending | Pending | |

---

## 29. F26 — TÀI LIỆU HỌC TẬP (MATERIAL)

**Feature:** F26_Material — Upload và xem tài liệu học tập
**Mô tả yêu cầu:** Giảng viên upload tài liệu (PDF, DOCX, PPT) lên lớp học. Sinh viên xem và tải tài liệu.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F26-TC01 | Upload tài liệu PDF thành công | 1. Giảng viên truy cập tab "Tài liệu"\n2. Nhấn "Upload"\n3. Chọn file PDF\n4. Nhấn "Tải lên" | File được upload lên S3, hiển thị trong danh sách | Giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F26-TC02 | Upload file không hỗ trợ | 1. Thử upload file .exe\n2. Nhấn "Tải lên" | Hiển thị lỗi "Định dạng file không được hỗ trợ" | File không đúng định dạng | Pending | Pending | Pending | |
| F26-TC03 | Upload file vượt kích thước cho phép | 1. Upload file > 50MB\n2. Nhấn "Tải lên" | Hiển thị lỗi "File vượt kích thước cho phép (50MB)" | File > 50MB | Pending | Pending | Pending | |
| F26-TC04 | Xóa tài liệu | 1. Giảng viên chọn tài liệu\n2. Nhấn "Xóa"\n3. Xác nhận | Tài liệu bị xóa khỏi lớp và S3 | Tài liệu đã upload | Pending | Pending | Pending | |
| F26-TC05 | Sinh viên xem danh sách tài liệu | 1. Sinh viên truy cập tab "Tài liệu"\n2. Quan sát | Hiển thị danh sách tài liệu, tên file, ngày upload, người upload | Sinh viên đã tham gia lớp | Pending | Pending | Pending | |
| F26-TC06 | Sinh viên tải tài liệu | 1. Chọn tài liệu\n2. Nhấn "Tải xuống" | File được tải về máy | Sinh viên đã tham gia lớp | Pending | Pending | Pending | |

---

## 30. F27 — THÔNG BÁO (NOTIFICATION)

**Feature:** F27_Notification — Nhận và xem thông báo
**Mô tả yêu cầu:** Người dùng nhận thông báo realtime qua SignalR khi có sự kiện quan trọng (kết quả chấm điểm, thảo luận mới, ca thi bắt đầu...).
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F27-TC01 | Nhận thông báo khi có kết quả chấm điểm | 1. Submission được chấm xong\n2. Quan sát notification bell\n3. Click notification bell | Badge hiển thị số mới, notification được list, nội dung đúng | Submission graded | Pending | Pending | Pending | |
| F27-TC02 | Nhận thông báo realtime | 1. User đang online\n2. Giảng viên nộp điểm cho user\n3. Quan sát | Notification xuất hiện ngay lập tức (realtime), không cần refresh trang | User đang online | Pending | Pending | Pending | |
| F27-TC03 | Nhận thông báo ca thi sắp bắt đầu | 1. Ca thi bắt đầu trong 5 phút\n2. Quan sát | Notification được gửi "Ca thi [Tên] sẽ bắt đầu trong 5 phút" | Ca thi PENDING, gần đến giờ | Pending | Pending | Pending | |
| F27-TC04 | Nhận thông báo khi có reply trong thảo luận | 1. Sinh viên có thảo luận\n2. Giảng viên trả lời\n3. Quan sát | Notification: "Giảng viên đã trả lời thảo luận [Tiêu đề]" | Giảng viên reply | Pending | Pending | Pending | |
| F27-TC05 | Xem danh sách thông báo | 1. Nhấn notification bell\n2. Xem danh sách | Hiển thị tất cả notifications, mới nhất trước, phân biệt đã đọc/chưa đọc | Có notifications | Pending | Pending | Pending | |
| F27-TC06 | Đánh dấu đã đọc | 1. Click vào notification\n2. Xem lại | Notification được đánh dấu đã đọc, badge giảm | Thông báo chưa đọc | Pending | Pending | Pending | |
| F27-TC07 | Xóa thông báo | 1. Chọn notification\n2. Nhấn "Xóa" | Notification bị xóa khỏi danh sách | Thông báo đã tồn tại | Pending | Pending | Pending | |

---

## 31. F28 — THEO DÕI HÀNH VI THI (EXAM PROCTORING)

**Feature:** F28_ExamProctoring — Ghi nhận hành vi bất thường khi thi
**Mô tả yêu cầu:** Hệ thống ghi nhận các hành vi bất thường như: chuyển tab, copy-paste, right-click để phát hiện gian lận. Dữ liệu keystroke log và exam log được lưu.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực iện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F28-TC01 | Ghi nhận keystroke log | 1. Đang thi\n2. Gõ code\n3. Kiểm tra dữ liệu keystroke | Keystroke logs được lưu với timestamp, keyCode | Đang trong phiên thi | Pending | Pending | Pending | |
| F28-TC02 | Ghi nhận sự kiện chuyển tab | 1. Đang thi\n2. Nhấn Alt+Tab hoặc chuyển tab trình duyệt\n3. Quan sát | ExamLog được tạo với Event = "TabSwitch", Suspicious = true (nếu nhiều lần) | Đang trong phiên thi | Pending | Pending | Pending | |
| F28-TC03 | Ghi nhận sự kiện copy-paste | 1. Copy code bên ngoài\n2. Paste vào editor\n3. Quan sát | ExamLog được ghi, Suspicious = true nếu paste > ngưỡng cho phép | Đang trong phiên thi | Pending | Pending | Pending | |
| F28-TC04 | Ghi nhận right-click | 1. Right-click trong trang thi\n2. Quan sát | ExamLog được ghi với Event = "RightClick" | Đang trong phiên thi | Pending | Pending | Pending | |
| F28-TC05 | Giảng viên xem log hành vi của sinh viên | 1. Giảng viên mở chi tiết ca thi\n2. Chọn sinh viên\n3. Xem tab "Hành vi thi" | Hiển thị danh sách ExamLog: thời gian, loại sự kiện, suspicious flag | Sinh viên đang/have đã thi | Pending | Pending | Pending | |
| F28-TC06 | Highlight các sinh viên có hành vi bất thường | 1. Trong danh sách sinh viên đang thi\n2. Quan sát | Sinh viên có suspicious flag hiển thị màu khác hoặc badge cảnh báo | Có sinh viên suspicious | Pending | Pending | Pending | |

---

## 32. F29 — QUẢN LÝ SLOT

**Feature:** F29_SlotManagement — CRUD slot thời gian thi
**Mô tả yêu cầu:** Admin/giảng viên quản lý slot thời gian thi cho việc đặt lịch thi. Mỗi slot có ngày, giờ bắt đầu/kết thúc, phòng học.
**Số lượng TC:** TBD

### Testing Round

| Round | Passed | Failed | Pending | N/A |
|-------|--------|--------|---------|-----|
| Round 1 | - | - | - | - |
| Round 2 | - | - | - | - |
| Round 3 | - | - | - | - |

### Test Cases

| Test Case ID | Mô tả Test Case | Quy trình thực hiện | Kết quả mong đợi | Điều kiện tiên quyết | Round 1 | Round 2 | Round 3 | Ghi chú |
|--------------|-----------------|---------------------|-------------------|----------------------|---------|---------|---------|---------|
| F29-TC01 | Tạo slot thành công | 1. Truy cập quản lý slot\n2. Nhấn "Tạo slot"\n3. Điền: ngày, giờ bắt đầu, giờ kết thúc, phòng\n4. Nhấn "Lưu" | Slot được tạo, hiển thị trong danh sách | Admin/giảng viên đã đăng nhập | Pending | Pending | Pending | |
| F29-TC02 | Tạo slot trùng thời gian với phòng đã có | 1. Phòng A đã có slot 8h-10h\n2. Thử tạo slot 9h-11h cùng phòng A\n3. Lưu | Hiển thị lỗi "Phòng đã có slot trong khoảng thời gian này" | Phòng đã booked | Pending | Pending | Pending | |
| F29-TC03 | Sửa slot | 1. Chọn slot\n2. Nhấn "Sửa"\n3. Thay đổi thời gian\n4. Lưu | Slot được cập nhật | Slot đã tồn tại | Pending | Pending | Pending | |
| F29-TC04 | Xóa slot | 1. Chọn slot\n2. Nhấn "Xóa"\n3. Xác nhận | Slot bị xóa | Slot đã tồn tại | Pending | Pending | Pending | |
| F29-TC05 | Xóa slot đang được ca thi sử dụng | 1. Slot đang được ca thi reference\n2. Nhấn "Xóa" | Hiển thị cảnh báo "Slot đang được sử dụng bởi X ca thi" | Slot có ca thi | Pending | Pending | Pending | |

---

## TỔNG HỢP SỐ LƯỢNG TEST CASES

| Module | Số lượng Test Cases |
|--------|---------------------|
| F01_Login | 14 |
| F02_Register | 12 |
| F03_ForgotPassword | 9 |
| F04_ResetPassword | 13 |
| F05_GoogleOAuth | 6 |
| F06_EmailVerification | 9 |
| F07_ProfileManagement | 13 |
| F08_ChangePassword | 6 |
| F09_ClassroomCRUD | 13 |
| F10_StudentEnrollment | 10 |
| F11_ClassroomEnroll | 9 |
| F12_SubjectManagement | 5 |
| F13_ProblemManagement | 13 |
| F14_TestCaseManagement | 13 |
| F15_ProgrammingLanguage | 5 |
| F16_ExaminationManagement | 15 |
| F17_ExaminationTemplate | 5 |
| F18_StartEndExamination | 11 |
| F19_Plagiarism | 5 |
| F20_StudentExamSession | 6 |
| F21_Submission | 10 |
| F22_AutoGrading | 14 |
| F23_CodeEditor | 10 |
| F24_Discussion | 7 |
| F25_Quiz | 8 |
| F26_Material | 6 |
| F27_Notification | 7 |
| F28_ExamProctoring | 6 |
| F29_SlotManagement | 5 |
| **Tổng cộng** | **~271 test cases** |
