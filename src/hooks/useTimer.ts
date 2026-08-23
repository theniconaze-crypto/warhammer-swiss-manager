/**
 * src/hooks/useTimer.ts
 * Round timer hook with haptic feedback and audio notifications.
 * Supports start, pause, reset, and configurable duration.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  durationMinutes: number;
  onComplete?: () => void;
  onWarning?: (minutesLeft: number) => void;
  warningMinutes?: number[];
}

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  isCompleted: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (minutes: number) => void;
  formattedTime: string;
  progress: number; // 0 to 1
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function useTimer({
  durationMinutes,
  onComplete,
  onWarning,
  warningMinutes = [15, 5],
}: UseTimerOptions): TimerState {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnedAt = useRef<Set<number>>(new Set());
  const totalRef = useRef(totalSeconds);

  useEffect(() => {
    totalRef.current = durationMinutes * 60;
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          vibrate([500, 200, 500, 200, 500]);
          onComplete?.();
          return 0;
        }

        const newSeconds = prev - 1;
        const minutesLeft = Math.floor(newSeconds / 60);

        if (warningMinutes.includes(minutesLeft) && !warnedAt.current.has(minutesLeft)) {
          warnedAt.current.add(minutesLeft);
          vibrate([200, 100, 200]);
          onWarning?.(minutesLeft);
        }

        return newSeconds;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onComplete, onWarning, warningMinutes]);

  const start = useCallback(() => {
    setIsCompleted(false);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsLeft(totalRef.current);
    warnedAt.current.clear();
  }, []);

  const setDuration = useCallback((minutes: number) => {
    const newTotal = minutes * 60;
    totalRef.current = newTotal;
    setSecondsLeft(newTotal);
    setIsRunning(false);
    setIsCompleted(false);
    warnedAt.current.clear();
  }, []);

  return {
    secondsLeft,
    isRunning,
    isCompleted,
    start,
    pause,
    reset,
    setDuration,
    formattedTime: formatTime(secondsLeft),
    progress: totalRef.current > 0 ? secondsLeft / totalRef.current : 0,
  };
}
