# 🎯 KỊCH BẢN BẢO VỆ ĐỒ ÁN (DEFENSE GUIDE) - EDUACAS

Tài liệu này hướng dẫn nhóm bạn cách demo các tính năng quan trọng nhất của hệ thống bằng bộ dữ liệu **SLIM** (tinh gọn).

---

## 🛠 1. Chuẩn bị trước khi Demo
Trước khi vào phòng hội đồng, hãy chạy file `SWITCH_TO_DEFENSE_MODE.ps1` để hệ thống nạp dữ liệu tinh gọn. Sau đó gọi API `/api/dev/reset-db`.

---

## 🛡 2. Demo Giám thị & Chống gian lận (Proctoring)
**Mục tiêu**: Show log vi phạm của sinh viên trong phòng thi.

*   **Tài khoản Giảng viên**: `lecturer1@edu-acas.com` / `123456`
*   **Lớp học**: `Lớp thực hành mẫu` - Mã: `cls-007` (Lớp đã được đồng bộ dữ liệu)
*   **Kỳ thi**: Chọn bất kỳ kỳ thi nào trong danh sách của lớp `cls-007`.
*   **Sinh viên mục tiêu**: `Vo Minh Khoi` (ID: `usr-stu-001`) 
    *   **Hành vi demo**: Vào danh sách bài nộp của Lớp `cls-007` -> Xem Log của Khôi.
    *   **Dữ liệu show**: Thấy log vi phạm màu đỏ (F12, Chuyển tab...).

---

## 📝 3. Demo Chấm điểm & Phúc khảo (Regrading)
**Mục tiêu**: Show quy trình sinh viên khiếu nại và giảng viên phản hồi.

*   **Tài khoản Sinh viên**: `student1@edu-acas.com` (Võ Minh Khôi)
*   **Đơn phúc khảo**: Đã có sẵn 1 đơn cho bài nộp `subm-377`.
*   **Kịch bản**: 
    1. Đăng nhập Sinh viên -> Xem kết quả bài thi -> Thấy nút "Đã gửi phúc khảo".
    2. Đăng nhập Giảng viên -> Vào mục "Phúc khảo" -> Thấy đơn của Khôi với nội dung: *"Thưa thầy, em bị sai testcase biên nhưng máy em chạy đúng..."* -> Thấy giảng viên đã phản hồi: *"Em xử lý sai logic ở trường hợp biên. Kết quả FAIL là đúng."*

---

## 🔍 4. Demo Kiểm tra Đạo văn (Plagiarism / JPlag)
**Mục tiêu**: Show khả năng phát hiện mã nguồn giống nhau.

*   **Lớp học**: `Cấu trúc dữ liệu (CS101)` - Mã: `cls-002`
*   **Hành vi**: Vào mục "Phát hiện đạo văn" -> Xem Nhóm lỗi `eg-001`.
*   **Dữ liệu show**: Thấy danh sách sinh viên có bài nộp giống nhau. Chọn 2 sinh viên (VD: `subm-301` và `subm-310`) -> Show so sánh mã nguồn (Similarity Score) mà JPlag đã tính toán.

---

## ⚠️ 5. Demo Cảnh báo học vụ (Academic Warning)
**Mục tiêu**: Hệ thống tự động cảnh báo sinh viên điểm thấp.

*   **Kịch bản**: Vào mục "Cảnh báo học vụ" trên Dashboard Giảng viên.
*   **Dữ liệu show**: Thấy danh sách 45 cảnh báo. Chọn 1 cái tên -> Xem phân tích của AI (LLM Analysis) về lý do sinh viên này bị cảnh báo (Ví dụ: *"Điểm trung bình dưới 4.0 qua 3 kỳ thi liên tiếp"*).

## 📋 6. DỮ LIỆU COPY-PASTE KHI DEMO (Dành cho tính năng Tạo mới)
**Mục tiêu**: Có sẵn dữ liệu để Paste khi hội đồng yêu cầu tạo thử Problem hoặc nộp bài trực tiếp.

### 🔹 A. Dữ liệu tạo Problem mới (Bài toán: Tính tổng A+B)
*   **Tiêu đề**: `Tính tổng hai số nguyên`
*   **Nội dung**: `Viết chương trình nhập vào hai số nguyên a và b từ bàn phím. In ra tổng của hai số đó.`
*   **Input mẫu**: `5 10`
*   **Output mẫu**: `15`

### 🔹 B. Mã nguồn nộp bài (Ngôn ngữ: Python)
**1. Bản chạy ĐÚNG (Pass all testcases):**
```python
import sys

try:
    line = sys.stdin.read().split()
    if len(line) >= 2:
        a = int(line[0])
        b = int(line[1])
        print(a + b)
except:
    pass
```

**2. Bản chạy SAI (Fail - Để demo phúc khảo/chấm điểm):**
```python
# Sai logic: In ra hiệu thay vì tổng
a = int(input())
b = int(input())
print(a - b) 
```

**3. Bản GIAN LẬN (Để demo Log giám thị phát hiện Paste):**
*(Bạn hãy Copy đoạn này và Paste vào Editor trên Web để hệ thống ghi nhận log `EXTERNAL_PASTE`)*
```python
# --- ĐOẠN CODE COPY TỪ INTERNET ---
def solve():
    import sys
    data = sys.stdin.read().split()
    print(int(data[0]) + int(data[1]))
solve()
# ----------------------------------
```

### 🔹 C. Dữ liệu tạo Kỳ thi (Examination) mới
*   **Tên kỳ thi**: `Kiểm tra cuối kỳ - Học kỳ Spring 2026`
*   **Mô tả**: `Bài kiểm tra tổng hợp kiến thức từ chương 1 đến chương 10. Sinh viên có 90 phút để hoàn thành.`
*   **Tổng điểm**: `10`
*   **Cấu hình**: (Chọn 2-3 bài tập có sẵn trong danh sách như `Tính tổng`, `Tìm số lớn nhất`).

### 🔹 D. Dữ liệu tạo Template đề thi (Exam Template)
*   **Tên Template**: `Mẫu đề thi Java nâng cao - PE`
*   **Mô tả**: `Cấu trúc đề thi gồm 3 bài: 1 bài dễ (2đ), 1 bài trung bình (3đ), 1 bài khó (5đ).`
*   **Cấu trúc dự kiến**:
    *   *Phần 1*: Array & String (3 điểm)
    *   *Phần 2*: OOP & Interface (4 điểm)
    *   *Phần 3*: IO Stream & Exception (3 điểm)

### 🔹 E. Nội dung gửi Phúc khảo (Dành cho Sinh viên)
*(Copy đoạn này khi demo tính năng Gửi yêu cầu phúc khảo)*
*   **Lý do phúc khảo**: `Thưa thầy/cô, em đã kiểm tra lại mã nguồn bài làm của mình. Ở testcase số 3, em tin rằng logic của mình đã xử lý đúng trường hợp số âm nhưng hệ thống vẫn báo FAIL. Kính mong thầy/cô xem xét chấm lại thủ công bài làm này của em giúp em ạ. Em xin cảm ơn!`

---

祝 bạn và nhóm bảo vệ đồ án thành công rực rỡ! 🚀
