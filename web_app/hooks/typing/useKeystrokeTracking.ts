import { useState, useEffect, useRef, useCallback } from 'react';

// Key dùng để lưu batch tạm trên localStorage.
// Dữ liệu này giúp không mất log khi người dùng refresh hoặc mất mạng tạm thời.
const STORAGE_KEY = 'proctoring_batch_logs';
// Cứ mỗi 5 phút sẽ thử đẩy batch hiện có lên backend (Redis checkpoint).
const SYNC_INTERVAL = 5 * 60 * 1000;
// Cửa sổ đo chính: mỗi 5 giây sẽ chốt 1 record (nếu có nhập ký tự).
const CYCLE_DURATION = 5000;

export type KeystrokeRecord = {
  timeStartSet: string;
  timeOffSet: string;
  duration: number;
  cps: number;
  charCount: number;
  content: string;
};

type UseKeystrokeTrackingResult = {
  keystrokeCount: number;
  batchLogs: KeystrokeRecord[];
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  flush: () => Promise<void>;
};

export const useKeystrokeTracking = (
  examinationId: string,
  studentId: string,
  texts: string | string[],
): UseKeystrokeTrackingResult => {
  // Hook này chấp nhận cả 1 ô nhập hoặc nhiều ô nhập.
  // Nếu chỉ có 1 text thì chuẩn hóa thành mảng 1 phần tử để xử lý đồng nhất.
  const normalizedTexts = Array.isArray(texts) ? texts : [texts];

  // keystrokeCount: số ký tự đang tích lũy trong CỬA SỔ 5 GIÂY HIỆN TẠI (để hiển thị realtime).
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  // batchLogs: danh sách record 5 giây đang giữ ở client, chờ sync Redis hoặc flush khi submit.
  const [batchLogs, setBatchLogs] = useState<KeystrokeRecord[]>(() => {
    // Khôi phục batch cũ nếu người dùng từng gõ và reload trang giữa chừng.
    // Nhờ đó log không bị mất ngay cả khi chưa kịp gửi lên server.
    const saved = localStorage.getItem(STORAGE_KEY); // đọc dữ liệu cũ (nếu có)
    return saved ? (JSON.parse(saved) as KeystrokeRecord[]) : [];
  });

  // countRef: tổng ký tự mới thêm trong cửa sổ 5 giây hiện tại.
  // Dùng ref để không bị reset mỗi lần re-render.
  const countRef = useRef(0);
  // typedContentRef: chuỗi nội dung mới đã gõ trong cửa sổ 5 giây hiện tại.
  const typedContentRef = useRef('');
  // lastTextsRef: snapshot text của lần render trước, dùng để so sánh chênh lệch.
  const lastTextsRef = useRef<string[]>([]);
  // cycleStartTimeRef: mốc bắt đầu của cửa sổ đo hiện tại.
  const cycleStartTimeRef = useRef<number | null>(null);
  // lastSyncRef: mốc lần gần nhất đã thử sync batch lên Redis.
  const lastSyncRef = useRef<number | null>(null);

  useEffect(() => {
    // Khởi tạo mốc thời gian một lần khi hook mount.
    // Từ đây hệ thống có thể tính timeStart/timeOffSet và điều kiện sync 5 phút.
    if (cycleStartTimeRef.current === null) cycleStartTimeRef.current = Date.now(); // mốc bắt đầu chu kỳ đầu tiên
    if (lastSyncRef.current === null) lastSyncRef.current = Date.now(); // mốc sync đầu tiên
  }, []);

  // Chuyển timestamp (ms) thành HH:MM:SS để lưu log gọn, dễ đọc.
  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp); // tạo Date từ milliseconds
    return [
      d.getHours().toString().padStart(2, '0'),
      d.getMinutes().toString().padStart(2, '0'),
      d.getSeconds().toString().padStart(2, '0'),
    ].join(':');
  };

  // Mỗi lần batchLogs đổi thì ghi đè localStorage để luôn giữ bản mới nhất.
  // Cơ chế này hoạt động như "autosave" cho log client-side.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batchLogs)); // autosave batch hiện tại
  }, [batchLogs]);

  // Snapshot hóa mảng text để làm dependency ổn định cho useEffect.
  // Khi nội dung bất kỳ ô nào thay đổi, chuỗi JSON này sẽ thay đổi theo.
  const textsSnapshot = JSON.stringify(normalizedTexts);

  // Bắt sự thay đổi text và chỉ tính PHẦN KÝ TỰ MỚI THÊM.
  // Lưu ý: logic hiện tại tập trung vào chiều tăng độ dài (thêm ký tự),
  // không trừ ngược khi người dùng xóa ký tự.
  useEffect(() => {
    // Parse snapshot về mảng text hiện tại để so với snapshot trước đó.
    const currentTexts = JSON.parse(textsSnapshot) as string[]; // text mới nhất từ UI
    const prevTexts = lastTextsRef.current; // text snapshot lần trước
    let addedChars = 0;
    let addedContent = '';

    currentTexts.forEach((text, i) => {
      const prev = prevTexts[i] || ''; // nếu chưa có snapshot cũ thì coi như rỗng
      if (text.length > prev.length) {
        // Phần mới thêm nằm từ vị trí prev.length trở đi.
        // Ví dụ: prev="abc", current="abcdef" => added="def".
        addedChars += text.length - prev.length;
        addedContent += text.slice(prev.length);
      }
    });

    if (addedChars > 0) {
      // Cộng dồn vào cửa sổ 5 giây hiện tại.
      // keystrokeCount dùng cho UI realtime, còn countRef/typedContentRef dùng để chốt record khi tick.
      countRef.current += addedChars;
      typedContentRef.current += addedContent;
      setKeystrokeCount(countRef.current); // cập nhật số realtime hiển thị trên UI
    }

    // Cập nhật snapshot chuẩn cho lần so sánh tiếp theo.
    lastTextsRef.current = currentTexts;
  }, [textsSnapshot]);

  // Endpoint backend cho các API cache/flush log.
  const BASE_URL = 'http://localhost:5068/api/proctoring';

  // Gửi batch hiện có lên endpoint cache để backend append vào Redis.
  // Trả về true/false để bên gọi quyết định có xóa local batch hay không.
  const sendToCache = useCallback(async (batch: KeystrokeRecord[]) => {
    if (!batch || batch.length === 0) return false; // không có gì để gửi
    try {
      const res = await fetch(`${BASE_URL}/keystroke-logs/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examinationId, studentId, keystroke_data: batch }), // payload backend yêu cầu
      });
      if (res.ok) {
        console.log('Batch cached to Redis.');
        return true;
      }
      console.error('Cache failed:', res.statusText);
      return false;
    } catch (e) {
      console.error('Cache error:', e);
      return false;
    }
  }, [examinationId, studentId]);

  // Gửi lệnh flush khi submit:
  // Backend sẽ gom dữ liệu đang ở Redis + finalBatch nhận từ frontend,
  // rồi ghi xuống DB thành một bản ghi tổng hợp theo flow hiện tại của backend.
  const sendToFlush = useCallback(async (finalBatch: KeystrokeRecord[]) => {
    try {
      const res = await fetch(`${BASE_URL}/keystroke-logs/flush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examinationId, studentId, keystroke_data: finalBatch ?? [] }), // gửi cả phần local cuối cùng
      });
      if (res.ok) {
        console.log('Flushed Redis -> DB.');
        return true;
      }
      console.error('Flush failed:', res.statusText);
      return false;
    } catch (e) {
      console.error('Flush error:', e);
      return false;
    }
  }, [examinationId, studentId]);

  // Giữ hàm này để tương thích với nơi gọi trong App (onKeyDown).
  // Logic đếm thật sự đang dựa trên so sánh text trong useEffect ở trên.
  const handleKeyDown = useCallback((_event: React.KeyboardEvent<HTMLTextAreaElement>) => {}, []);

  // Bộ timer chính của hook.
  // Mỗi 5 giây:
  // 1) Chốt 1 record nếu có ký tự mới.
  // 2) Reset cửa sổ đo.
  // 3) Nếu đủ 5 phút thì sync batch lên Redis.
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now(); // thời điểm chốt chu kỳ hiện tại
      const count = countRef.current; // tổng ký tự mới trong chu kỳ hiện tại
      const content = typedContentRef.current; // nội dung mới trong chu kỳ hiện tại
      const duration = CYCLE_DURATION / 1000; // 5 giây

      // Lấy snapshot batch hiện tại để thêm record mới (nếu có).
      let currentBatch = [...batchLogs]; // clone để thao tác an toàn

      if (count > 0) {
        // cps = số ký tự / giây trong cửa sổ 5 giây.
        const cps = count / duration; // chars per second
        const timeStartStr = formatTime(cycleStartTimeRef.current ?? now); // đầu khoảng
        const timeOffStr = formatTime(now); // cuối khoảng

        // Record đại diện cho 1 cửa sổ 5 giây vừa kết thúc.
        const newRecord: KeystrokeRecord = {
          timeStartSet: timeStartStr,
          timeOffSet: timeOffStr,
          duration, // luôn 5s với tick định kỳ
          cps: parseFloat(cps.toFixed(2)), // làm tròn để dễ đọc
          charCount: count,
          content,
        };

        currentBatch = [...currentBatch, newRecord]; // thêm record mới vào batch
        setBatchLogs(currentBatch); // trigger autosave localStorage
      }

      // Reset biến đếm cho cửa sổ kế tiếp.
      countRef.current = 0;
      typedContentRef.current = '';
      setKeystrokeCount(0); // UI về 0 cho chu kỳ tiếp theo
      cycleStartTimeRef.current = now; // mốc bắt đầu chu kỳ mới

      // Nếu đã qua 5 phút từ lần sync gần nhất thì thử đẩy toàn bộ currentBatch lên Redis.
      if (now - (lastSyncRef.current ?? now) >= SYNC_INTERVAL) {
        if (currentBatch.length > 0) {
          // Redis đóng vai trò checkpoint định kỳ trong lúc làm bài.
          const success = await sendToCache(currentBatch);
          if (success) {
            // Thành công thì xóa batch local để tránh gửi trùng ở lần sync sau.
            setBatchLogs([]);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Dù có dữ liệu hay không vẫn cập nhật mốc sync để đếm chu kỳ tiếp theo.
        lastSyncRef.current = now;
      }
    }, CYCLE_DURATION);

    // Cleanup interval để tránh tạo nhiều timer chồng nhau khi effect re-run/unmount.
    return () => clearInterval(interval);
  }, [batchLogs, sendToCache]);

  // Hàm gọi khi người dùng submit bài.
  // Ý tưởng:
  // 1) Thu luôn phần dữ liệu lẻ chưa đủ 5 giây.
  // 2) Gửi flush để backend hợp nhất Redis + local batch thành dữ liệu cuối.
  const flush = useCallback(async () => {
    const now = Date.now(); // thời điểm user bấm submit
    const count = countRef.current; // phần ký tự chưa chốt 5s
    const content = typedContentRef.current; // nội dung chưa chốt 5s

    // Bắt đầu bằng toàn bộ batch đã chốt trước đó.
    let finalLogs = [...batchLogs]; // lấy toàn bộ record đã chốt trước đó

    // Nếu người dùng vừa gõ nhưng chưa đến tick 5 giây tiếp theo,
    // ta vẫn phải lưu phần này để không mất dữ liệu cuối bài.
    if (count > 0) {
      // Với cửa sổ lẻ khi submit, duration là thời gian thực đã trôi qua
      // kể từ cycleStartTimeRef, có thể < 5 giây.
      const duration = (now - (cycleStartTimeRef.current ?? now)) / 1000; // thời lượng thực của đoạn lẻ
      const cps = count / (duration || 1); // tránh chia 0
      const timeStartStr = formatTime(cycleStartTimeRef.current ?? now);
      const timeOffStr = formatTime(now);

      finalLogs.push({
        timeStartSet: timeStartStr,
        timeOffSet: timeOffStr,
        duration: parseFloat(duration.toFixed(2)), // làm tròn 2 số thập phân
        cps: parseFloat(cps.toFixed(2)),
        charCount: count,
        content,
      });
    }

    // Luôn gọi flush: backend sẽ tự merge phần Redis + finalLogs nhận từ client.
    const success = await sendToFlush(finalLogs);
    if (success) {
      // Flush thành công: reset toàn bộ trạng thái phía client về trạng thái sạch.
      localStorage.removeItem(STORAGE_KEY);
      setBatchLogs([]);
      countRef.current = 0;
      typedContentRef.current = '';
      setKeystrokeCount(0);
      cycleStartTimeRef.current = Date.now(); // bắt đầu phiên mới
      lastSyncRef.current = Date.now(); // reset mốc sync
    }
  }, [batchLogs, sendToFlush]);

  return { keystrokeCount, batchLogs, handleKeyDown, flush };
};