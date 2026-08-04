import { useState, useRef, useEffect, useCallback } from 'react';
import type { FocusSession } from '../types';
import { Play, Pause, Square, RotateCcw, Timer, Minimize2, X } from 'lucide-react';

interface FocusTimerProps {
  taskId: string;
  taskTitle: string;
  focusSession: FocusSession | undefined;
  onSaveSession: (session: FocusSession) => void;
  /** Only render when timer should be active (started by parent) */
  started: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTotal(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '< 1 分钟';
  if (totalMinutes < 60) return `${totalMinutes} 分钟`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function FocusTimer({
  taskId: _taskId,
  taskTitle,
  focusSession,
  onSaveSession,
  started,
}: FocusTimerProps) {
  const [mode, setMode] = useState<'running' | 'paused'>('running');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const totalAccumulated = focusSession?.totalDuration ?? 0;

  // Reset when started becomes true (new session)
  useEffect(() => {
    if (started) {
      startTimeRef.current = Date.now();
      pausedAtRef.current = 0;
      setElapsedMs(0);
      setMode('running');
      setMinimized(false);
      stoppedRef.current = false;
    }
  }, [started]);

  // Manage interval
  useEffect(() => {
    if (started && mode === 'running' && !stoppedRef.current) {
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current + pausedAtRef.current);
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, mode]);

  const handlePause = useCallback(() => {
    pausedAtRef.current = Date.now() - startTimeRef.current + pausedAtRef.current;
    setMode('paused');
  }, []);

  const handleResume = useCallback(() => {
    startTimeRef.current = Date.now();
    setMode('running');
  }, []);

  const saveSession = useCallback((duration: number) => {
    const now = new Date().toISOString();
    const newSession = {
      start: new Date(Date.now() - duration).toISOString(),
      end: now,
      duration,
    };
    const updated: FocusSession = {
      totalDuration: totalAccumulated + duration,
      sessions: [...(focusSession?.sessions ?? []), newSession],
    };
    onSaveSession(updated);
  }, [totalAccumulated, focusSession, onSaveSession]);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const duration = Date.now() - startTimeRef.current + pausedAtRef.current;
    if (duration > 1000) {
      saveSession(duration);
    }
    setMode('running'); // reset for next start
    setElapsedMs(0);
  }, [saveSession]);

  const handleReset = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;
    setElapsedMs(0);
  }, []);

  // External stop via global map
  const stopFn = useCallback(() => {
    if (!stoppedRef.current) {
      handleStop();
    }
  }, [handleStop]);

  useEffect(() => {
    const map = (window as unknown as Record<string, Record<string, () => void>>).__focusTimers ?? {};
    (window as unknown as Record<string, Record<string, () => void>>).__focusTimers = map;
    map[_taskId] = { stop: stopFn };
    return () => { delete map[_taskId]; };
  }, [_taskId, stopFn]);

  if (!started) return null;

  return (
    <>
      {/* Full Timer Panel */}
      {!minimized && (
        <div className="animate-scale-in rounded-lg p-3 border border-blue-200/60"
          style={{ background: 'linear-gradient(135deg, rgba(239,246,255,0.9), rgba(224,231,255,0.85))', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${mode === 'running' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-blue-700">专注中</span>
            </div>
            <button
              onClick={() => setMinimized(true)}
              className="p-0.5 rounded hover:bg-white/50 transition-colors"
              title="最小化"
            >
              <Minimize2 size={13} className="text-blue-500" />
            </button>
          </div>

          <div className="text-center mb-3">
            <span className="text-3xl font-mono font-bold tracking-wider text-blue-800 select-none">
              {formatTime(elapsedMs)}
            </span>
            {totalAccumulated > 0 && (
              <div className="text-xs text-blue-500/60 mt-0.5">
                累计 {formatTotal(totalAccumulated)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            {mode === 'running' ? (
              <button onClick={handlePause}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                <Pause size={14} /> 暂停
              </button>
            ) : (
              <button onClick={handleResume}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#2563eb' }}>
                <Play size={14} /> 继续
              </button>
            )}
            <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="重置"
              style={{ color: '#6b7280' }}>
              <RotateCcw size={14} />
            </button>
            <button onClick={handleStop}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>
              <Square size={13} /> 停止
            </button>
          </div>
        </div>
      )}

      {/* Minimized Floating Badge */}
      {minimized && (
        <div
          className="fixed bottom-6 right-6 z-[70] animate-scale-in rounded-full px-4 py-2.5 shadow-lg border border-blue-200/60 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-shadow select-none"
          style={{ background: 'linear-gradient(135deg, rgba(239,246,255,0.95), rgba(224,231,255,0.92))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          onClick={() => setMinimized(false)}>
          <div className={`w-2 h-2 rounded-full ${mode === 'running' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-sm font-mono font-bold text-blue-800">{formatTime(elapsedMs)}</span>
          <span className="text-xs text-blue-500/70 max-w-[80px] truncate">{taskTitle}</span>
          <button onClick={(e) => { e.stopPropagation(); handleStop(); }} className="ml-1 p-0.5 rounded-full hover:bg-red-100 transition-colors" title="停止计时">
            <X size={12} className="text-red-400" />
          </button>
        </div>
      )}
    </>
  );
}

// Helper to externally stop a task's timer
export function stopTaskTimer(taskId: string) {
  const map = (window as unknown as Record<string, Record<string, () => void>>).__focusTimers;
  map?.[taskId]?.stop?.();
}
