# SCRIPT CHUYỂN ĐỔI SANG CHẾ ĐỘ BẢO VỆ ĐỒ ÁN (DEFENSE MODE)
# Tác dụng: Tráo đổi dữ liệu Seed Data bằng bộ dữ liệu tinh gọn (Slim)

$SeedDir = "d:\Capstone-Sp26-EduACAS\servers\Services\AcasService\Dev\seed-data"

Write-Host "--- Bắt đầu chuyển đổi dữ liệu sang chế độ Demo Bảo vệ ---" -ForegroundColor Cyan

$Files = @(
    "submissions",
    "exam-logs",
    "keystroke-logs",
    "regrading-requests",
    "academic-warnings",
    "error-groups"
)

foreach ($File in $Files) {
    $SlimFile = "$SeedDir\$File-slim.json"
    $MainFile = "$SeedDir\$File.json"
    $BackupFile = "$SeedDir\$File-backup.json"

    if (Test-Path $SlimFile) {
        # Sao lưu file hiện tại nếu chưa có bản backup
        if (-not (Test-Path $BackupFile)) {
            Copy-Item $MainFile $BackupFile
            Write-Host "  [Backup] Đã sao lưu $File.json" -ForegroundColor Gray
        }

        # Ghi đè file chính bằng file slim
        Copy-Item $SlimFile $MainFile -Force
        Write-Host "  [Success] Đã chuyển đổi $File.json sang chế độ SLIM" -ForegroundColor Green
    } else {
        Write-Host "  [Error] Không tìm thấy file $File-slim.json" -ForegroundColor Red
    }
}

Write-Host "--- CHÚC MỪNG: Hệ thống đã sẵn sàng để Demo! ---" -ForegroundColor Yellow
Write-Host "BƯỚC TIẾP THEO: Hãy gọi API GET /api/dev/reset-db để nạp dữ liệu này vào Database." -ForegroundColor White
