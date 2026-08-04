import { useState, useRef, useEffect, useCallback } from 'react';
import type { FocusSession } from '../types';
import { Play, Pause, Square, RotateCcw, Timer, Minimize2, X, ChevronDown, ChevronRight, CheckCircle, Clock } from 'lucide-react';

interface FocusTimerProps {
  taskId: string;
  taskTitle: string;
  focusSession: FocusSession | undefined;
  onSaveSession: (session: FocusSession) => void;
  /** Only render when timer should be active (started by parent) */
  started: boolean;
  /** Called when user clicks "stop" — parent should set started=false */
  onStop?: () => void;
  /** Called when user clicks "restart" from stopped state */
  onRestart?: () => void;
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function sessionSummary(durationMs: number): string {
  const mins = Math.floor(durationMs / 60000);
  if (mins < 5) return '短时专注（< 5 分钟）';
  if (mins < 15) return '快速专注';
  if (mins < 30) return '中等专注';
  if (mins < 60) return '深度专注';
  if (mins < 120) return '长时间专注';
  return '超长专注';
}

export default function FocusTimer({
  taskId: _taskId,
  taskTitle,
  focusSession,
  onSaveSession,
  started,
  onStop,
  onRestart,
}: FocusTimerProps) {
  const [mode, setMode] = useState<'running' | 'paused'>('running');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const totalAccumulated = focusSession?.totalDuration ?? 0;
  const sessions = focusSession?.sessions ?? [];

  // Reset when started becomes true (new session)
  useEffect(() => {
    if (started) {
      startTimeRef.current = Date.now();
      pausedAtRef.current = 0;
      setElapsedMs(0);
      setMode('running');
      setMinimized(false);
      setShowDetails(false);
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
    onStop?.();
  }, [saveSession, onStop]);

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

  // ── Running / Paused Timer Card ──
  if (started) {
    return (
      <>
        {!minimized && (
          <div className="animate-scale-in rounded-xl p-3.5 border shadow-md"
            style={{
              background: 'linear-gradient(135deg, #e8f0fe, #dbe4ff)',
              borderColor: 'rgba(66,133,244,0.25)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${mode === 'running' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-semibold" style={{ color: '#1e40af' }}>专注中</span>
              </div>
              <button
                onClick={() => setMinimized(true)}
                className="p-0.5 rounded hover:bg-white/60 transition-colors"
                title="最小化"
              >
                <Minimize2 size={13} style={{ color: '#4b6cb7' }} />
              </button>
            </div>

            <div className="text-center mb-3">
              <span className="font-mono font-bold tracking-widest select-none"
                style={{ fontSize: '2rem', color: '#1e3a5f', textShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                {formatTime(elapsedMs)}
              </span>
              {totalAccumulated > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(30,58,95,0.55)' }}>
                  累计 {formatTotal(totalAccumulated)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {mode === 'running' ? (
                <button onClick={handlePause}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(245,158,11,0.18)', color: '#b45309' }}>
                  <Pause size={14} /> 暂停
                </button>
              ) : (
                <button onClick={handleResume}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(59,130,246,0.18)', color: '#1d4ed8' }}>
                  <Play size={14} /> 继续
                </button>
              )}
              <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-white/70 transition-colors" title="重置"
                style={{ color: '#6b7280' }}>
                <RotateCcw size={14} />
              </button>
              <button onClick={handleStop}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#b91c1c' }}>
                <Square size={13} /> 停止
              </button>
            </div>
          </div>
        )}

        {/* Minimized Floating Badge */}
        {minimized && (
          <div
            className="fixed bottom-6 right-6 z-[70] animate-scale-in rounded-full px-4 py-2.5 shadow-xl border flex items-center gap-2 cursor-pointer hover:shadow-2xl transition-shadow select-none"
            style={{
              background: 'linear-gradient(135deg, #e8f0fe, #dbe4ff)',
              borderColor: 'rgba(66,133,244,0.3)',
              boxShadow: '0 6px 24px rgba(59,130,246,0.15)',
            }}
            onClick={() => setMinimized(false)}>
            <div className={`w-2 h-2 rounded-full ${mode === 'running' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-mono font-bold" style={{ color: '#1e3a5f' }}>{formatTime(elapsedMs)}</span>
            <span className="text-xs max-w-[80px] truncate" style={{ color: 'rgba(30,58,95,0.6)' }}>{taskTitle}</span>
            <button onClick={(e) => { e.stopPropagation(); handleStop(); }} className="ml-1 p-0.5 rounded-full hover:bg-red-100 transition-colors" title="停止计时">
              <X size={12} className="text-red-400" />
            </button>
          </div>
        )}
      </>
    );
  }

  // ── Stopped / Completed State ──
  if (sessions.length === 0 && totalAccumulated === 0) {
    return null; // No history at all → don't show anything
  }

  const lastSession = sessions[sessions.length - 1];
  const reversedSessions = [...sessions].reverse();

  return (
    <div
      className="rounded-xl p-3.5 border cursor-pointer hover:shadow-sm transition-all select-none animate-scale-in"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderColor: 'rgba(34,197,94,0.2)',
        boxShadow: '0 2px 8px rgba(34,197,94,0.06), 0 1px 3px rgba(0,0,0,0.03)',
      }}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-xs font-semibold" style={{ color: '#166534' }}>专注记录</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-fg mr-1">{sessions.length} 次</span>
          {showDetails ? <ChevronDown size={14} style={{ color: '#166534' }} /> : <ChevronRight size={14} style={{ color: '#166534' }} />}
        </div>
      </div>

      {/* Clock Display — same size as running timer */}
      <div className="text-center mb-3">
        <span className="font-mono font-bold tracking-widest select-none"
          style={{ fontSize: '2rem', color: '#14532d', textShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          {formatTime(totalAccumulated)}
        </span>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(20,83,45,0.5)' }}>
          累计 {formatTotal(totalAccumulated)}
        </div>
      </div>

      {/* Action buttons — same layout as running timer */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onRestart?.(); }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(34,197,94,0.18)', color: '#166534' }}
        >
          <Play size={14} /> 继续专注
        </button>
      </div>

      {/* ── Expanded Details Panel ── */}
      {showDetails && (
        <div
          className="mt-3 pt-3 border-t animate-scale-in"
          style={{ borderColor: 'rgba(34,197,94,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Summary cards */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-[10px] text-muted-fg mb-0.5">总专注次数</div>
              <div className="text-sm font-bold" style={{ color: '#166534' }}>{sessions.length}</div>
            </div>
            <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-[10px] text-muted-fg mb-0.5">总时长</div>
              <div className="text-sm font-bold" style={{ color: '#166534' }}>{formatTotal(totalAccumulated)}</div>
            </div>
            {lastSession && (
              <div className="flex-1 rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <div className="text-[10px] text-muted-fg mb-0.5">最后记录</div>
                <div className="text-sm font-bold" style={{ color: '#166534' }}>{formatTotal(lastSession.duration)}</div>
              </div>
            )}
          </div>

          {/* Session list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {reversedSessions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/60"
                style={{ background: 'rgba(255,255,255,0.45)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock size={11} className="text-muted-fg shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] truncate" style={{ color: '#14532d' }}>
                      {formatDateTime(s.start)} → {formatDateTime(s.end)}
                    </span>
                    <span className="text-[10px] text-muted-fg mt-0.5">
                      {sessionSummary(s.duration)}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-semibold text-[11px] shrink-0 ml-2" style={{ color: '#166534' }}>
                  {formatTotal(s.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// Helper to externally stop a task's timer
export function stopTaskTimer(taskId: string) {
  const map = (window as unknown as Record<string, Record<string, () => void>>).__focusTimers;
  map?.[taskId]?.stop?.();
}
