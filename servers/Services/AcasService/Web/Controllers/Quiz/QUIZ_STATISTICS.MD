# Quiz Statistics - Ghi chú kỹ thuật

## Cách tính Score Distribution

### Backend (`QuizStatisticsQuery.cs`, line 128–137)

1. **Lấy 1 attempt mới nhất của mỗi student** (line 90–93) — `latestByStudent`.
2. **Xếp score vào range** bằng `GetScoreRange(score)` (line 188–195):
   - `>= 9` → `"9-10"`
   - `>= 7` → `"7-8"`
   - `>= 5` → `"5-6"`
   - `>= 3` → `"3-4"`
   - `< 3` → `"0-2"`
3. **Group by range**, đếm `count` và tính `percentage`.

### Frontend (`QuizStatisticsSection.tsx`, line 173–200)

4. Nhận `quizStats` — mảng `QuizScoreStatisticsItem`, mỗi item chứa `scoreDistribution` riêng.
5. **Aggregate toàn bộ** `scoreDistribution` từ **tất cả quiz** vào `rangeMap` (cộng count các range lại).
6. Tính lại `percentage` = `count / totalCount * 100` trên tổng aggregate.

## Tổng kết

- Chart hiển thị phân bố điểm gộp của **tất cả quiz trong classroom** (không phải từng quiz riêng).
- Mỗi student chỉ tính **1 attempt mới nhất** (`latestByStudent`).
- Score được gom vào **5 range**: 9-10, 7-8, 5-6, 3-4, 0-2.
- Pass threshold = **5.0** (`PassThreshold` = 5f, line 24).
