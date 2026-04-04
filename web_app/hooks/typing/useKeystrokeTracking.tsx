'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';

const SYNC_INTERVAL = 5 * 60 * 1000;
const CYCLE_DURATION = 5000;

export type KeystrokeRecord = {
  TimeStartSet: string;
  TimeOffSet: string;
  Duration: number;
  Cps: number;
  CharCount: number;
  Content: string;
};

type UseKeystrokeTrackingResult = {
  keystrokeCount: number;
  batchLogs: KeystrokeRecord[];
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  flush: (submissionId: string) => Promise<void>;
};

// --- HELPER FUNCTIONS ---

const getStorageKey = (examId: string, probId: string) => {
  if (!examId || !probId) return null;
  return `proctoring_logs_${examId}_${probId}`;
};

const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  return [
    d.getHours().toString().padStart(2, '0'),
    d.getMinutes().toString().padStart(2, '0'),
    d.getSeconds().toString().padStart(2, '0'),
  ].join(':');
};

const getDiffAddedContent = (current: string, prev: string): string => {
  if (!current || !prev) return current || '';
  if (current.length <= prev.length) return '';

  let start = 0;
  while (start < prev.length && start < current.length && prev[start] === current[start]) {
    start++;
  }
  
  let endPrev = prev.length - 1;
  let endCurr = current.length - 1;
  while (endPrev >= start && endCurr >= start && prev[endPrev] === current[endCurr]) {
    endPrev--;
    endCurr--;
  }

  return current.slice(start, endCurr + 1);
};

const getAddedContent = (currentTexts: string[], prevTexts: string[]) => {
  let addedChars = 0;
  let addedContent = '';

  currentTexts.forEach((text, i) => {
    const prev = prevTexts[i] || '';
    if (text.length > prev.length) {
      addedChars += text.length - prev.length;
      addedContent += getDiffAddedContent(text, prev);
    }
  });

  return { addedChars, addedContent };
};

const createRecord = (
  now: number,
  cycleStartTime: number,
  count: number,
  content: string,
  durationSecs: number
): KeystrokeRecord | null => {
  if (count <= 0) return null;
  const cps = count / (durationSecs || 1);
  return {
    TimeStartSet: formatTime(cycleStartTime),
    TimeOffSet: formatTime(now),
    Duration: parseFloat(durationSecs.toFixed(2)),
    Cps: parseFloat(cps.toFixed(2)),
    CharCount: count,
    Content: content,
  };
};

const isValidRecord = (record: KeystrokeRecord | null | undefined): record is KeystrokeRecord => {
  if (!record) return false;
  return (
    record.CharCount > 0 &&
    record.Duration > 0 &&
    record.Cps > 0 &&
    !!record.TimeStartSet &&
    !!record.TimeOffSet
  );
};

const sanitizeRecords = (records: KeystrokeRecord[] | null | undefined): KeystrokeRecord[] => {
  if (!records || records.length === 0) return [];
  return records.filter(isValidRecord);
};

export const useKeystrokeTracking = (
  examinationId: string,
  studentId: string,
  problemId: string,
  texts: string | string[],
): UseKeystrokeTrackingResult => {
  const normalizedTexts = Array.isArray(texts) ? texts : [texts];
  const axiosInstance = useAxios();
  
  const storageKey = useMemo(
    () => getStorageKey(examinationId, problemId), 
    [examinationId, problemId]
  );

  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [batchLogs, setBatchLogs] = useState<KeystrokeRecord[]>([]);

  const countRef = useRef(0);
  const typedContentRef = useRef('');
  const lastTextsRef = useRef<string[]>([]);
  const isInitializedRef = useRef(false);
  const cycleStartTimeRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number | null>(null);

  useEffect(() => {
    if (cycleStartTimeRef.current === null) cycleStartTimeRef.current = Date.now();
    if (lastSyncRef.current === null) lastSyncRef.current = Date.now();
  }, []);

  // Sync state with localStorage when IDs change (problem switch)
  useEffect(() => {
    if (!storageKey) return;

    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const initialLogs = saved ? sanitizeRecords(JSON.parse(saved) as KeystrokeRecord[]) : [];
    
    setBatchLogs(initialLogs);
    setKeystrokeCount(0);
    countRef.current = 0;
    typedContentRef.current = '';
    isInitializedRef.current = false; 
    cycleStartTimeRef.current = Date.now();
    lastSyncRef.current = Date.now();
  }, [storageKey]);

  // Persist current logs to problem-specific storage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(batchLogs));
    }
  }, [batchLogs, storageKey]);

  const textsSnapshot = JSON.stringify(normalizedTexts);

  // Measure text diffs incrementally
  useEffect(() => {
    if (!storageKey) return;

    const currentTexts = JSON.parse(textsSnapshot) as string[];

    // Baseline initialization: treat the first non-empty code state as "Already existed"
    if (!isInitializedRef.current) {
      if (currentTexts.some((t) => t.length > 0)) {
        isInitializedRef.current = true;
        lastTextsRef.current = currentTexts;
      } else {
        lastTextsRef.current = currentTexts;
      }
      return;
    }

    const prevTexts = lastTextsRef.current;
    const { addedChars, addedContent } = getAddedContent(currentTexts, prevTexts);

    if (addedChars > 0) {
      countRef.current += addedChars;
      typedContentRef.current += addedContent;
      setKeystrokeCount(countRef.current);
    }
    
    lastTextsRef.current = currentTexts;
  }, [textsSnapshot, storageKey]);

  const sendToCache = useCallback(
    async (batch: KeystrokeRecord[]) => {
      if (!storageKey || !studentId) return false;
      const sanitizedBatch = sanitizeRecords(batch);
      if (sanitizedBatch.length === 0) return false;
      try {
        await axiosInstance.post(Api.Proctoring.CACHE, {
          examinationId,
          studentId,
          problemId,
          keystroke_data: sanitizedBatch,
        });
        return true;
      } catch (e) {
        console.error('Cache error:', e);
        return false;
      }
    },
    [examinationId, studentId, problemId, axiosInstance, storageKey]
  );

  const sendToFlush = useCallback(
    async (submissionId: string, finalBatch: KeystrokeRecord[]) => {
      if (!storageKey || !studentId) return false;
      const sanitizedBatch = sanitizeRecords(finalBatch);
      try {
        await axiosInstance.post(Api.Proctoring.FLUSH, {
          submissionId,
          examinationId,
          studentId,
          problemId,
          keystroke_data: sanitizedBatch,
        });
        return true;
      } catch (e) {
        console.error('Flush error:', e);
        return false;
      }
    },
    [examinationId, studentId, problemId, axiosInstance, storageKey]
  );

  const handleKeyDown = useCallback(() => {}, []);

  useEffect(() => {
    if (!storageKey) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const count = countRef.current;
      const content = typedContentRef.current;
      const durationSecs = CYCLE_DURATION / 1000;
      const cycleStart = cycleStartTimeRef.current ?? now;

      // Capture record for the last 5s
      const nextRecord = createRecord(now, cycleStart, count, content, durationSecs);

      setBatchLogs((prev) => {
        const nextBatch = nextRecord ? [...prev, nextRecord] : prev;
        
        // Auto-sync to Redis every 5 mins
        if (now - (lastSyncRef.current ?? now) >= SYNC_INTERVAL && nextBatch.length > 0) {
          sendToCache(nextBatch).then(success => {
            if (success) {
              setBatchLogs([]);
              if (typeof window !== 'undefined') localStorage.removeItem(storageKey);
              lastSyncRef.current = Date.now();
            }
          });
        }
        return nextBatch;
      });

      countRef.current = 0;
      typedContentRef.current = '';
      setKeystrokeCount(0);
      cycleStartTimeRef.current = now;
    }, CYCLE_DURATION);

    return () => clearInterval(interval);
  }, [sendToCache, storageKey, studentId, examinationId, problemId]);

  const flush = useCallback(
    async (submissionId: string) => {
      if (!storageKey) return;

      const now = Date.now();
      const count = countRef.current;
      const content = typedContentRef.current;
      const cycleStart = cycleStartTimeRef.current ?? now;
      
      const finalLogs = [...batchLogs];
      const durationSecs = (now - cycleStart) / 1000;
      
      const pendingRecord = createRecord(now, cycleStart, count, content, durationSecs);
      if (pendingRecord) finalLogs.push(pendingRecord);

      const success = await sendToFlush(submissionId, sanitizeRecords(finalLogs));
      if (success) {
        if (typeof window !== 'undefined') localStorage.removeItem(storageKey);
        setBatchLogs([]);
        countRef.current = 0;
        typedContentRef.current = '';
        setKeystrokeCount(0);
        cycleStartTimeRef.current = Date.now();
        lastSyncRef.current = Date.now();
      }
    },
    [batchLogs, sendToFlush, storageKey]
  );

  return { keystrokeCount, batchLogs, handleKeyDown, flush };
};
