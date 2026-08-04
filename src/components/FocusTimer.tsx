import { useState, useRef, useEffect, useCallback } from 'react';
import type { FocusSession } from '../types';
import { Play, Pause, Square, RotateCcw, Timer, Minimize2, X, ChevronDown, ChevronRight } from 'lucide-react';

interface FocusTimerProps {
  taskId: string;
  taskTitle: string;
  focusSession: FocusSession | undefined;
  onSaveSession: (session: FocusSession) => void;
  started: boolean;
  onStop?: () => void;
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
  const [minimized, setMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // displayTick forces re-renders for the display; actual time lives in refs
  const [displayTick, setDisplayTick] = useState(0);

  // ── Timer state in refs — immune to React re-render resets ──
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const accumulatedBeforePauseRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  const modeRef = useRef<'running' | 'paused'>('running');

  // Persisted session data from props
  const totalAccumulated = focusSession?.totalDuration ?? 0;
  const sessions = focusSession?.sessions ?? [];

  // Compute current elapsed strictly from refs — no useState involved
  const getElapsed = useCallback((): number => {
    if (modeRef.current === 'paused') {
      return accumulatedBeforePauseRef.current;
    }
    return Date.now() - startTimeRef.current + accumulatedBeforePauseRef.current;
  }, []);

  // ── Initialize / Reset on started=true ──
  const didInitRef = useRef(false);
  useEffect(() => {
    if (started && !didInitRef.current) {
      const now = Date.now();
      startTimeRef.current = now;
      accumulatedBeforePauseRef.current = 0;
      pausedAtRef.current = 0;
      stoppedRef.current = false;
      modeRef.current = 'running';
      setMode('running');
      setMinimized(false);
      setShowDetails(false);
      setDisplayTick(0);
      didInitRef.current = true;
    }
    if (!started) {
      didInitRef.current = false;
    }
  }, [started]);

  // ── Manage interval (driven by mode state, not refs alone) ──
  useEffect(() => {
    if (started && mode === 'running' && !stoppedRef.current) {
      intervalRef.current = setInterval(() => {
        setDisplayTick((t) => t + 1);
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [started, mode]);

  const elapsedMs = getElapsed();

  // ── Handlers ──
  const handlePause = useCallback(() => {
    accumulatedBeforePauseRef.current = getElapsed();
    modeRef.current = 'paused';
    setMode('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [getElapsed]);

  const handleResume = useCallback(() => {
    startTimeRef.current = Date.now();
    modeRef.current = 'running';
    setMode('running');
  }, []);

  const saveSession = useCallback((duration: number) => {
    if (duration <= 1000) return;
    const now = new Date().toISOString();
    const newSession = {
      start: new Date(Date.now() - duration).toISOString(),
      end: now,
      duration,
    };
    const currentTotal = focusSession?.totalDuration ?? 0;
    const currentSessions = focusSession?.sessions ?? [];
    const updated: FocusSession = {
      totalDuration: currentTotal + duration,
      sessions: [...currentSessions, newSession],
    };
    onSaveSession(updated);
  }, [focusSession, onSaveSession]);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const duration = getElapsed();
    saveSession(duration);
    modeRef.current = 'running';
    setMode('running');
    setDisplayTick(0);
    onStop?.();
  }, [getElapsed, saveSession, onStop]);

  const handleReset = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    accumulatedBeforePauseRef.current = 0;
    setDisplayTick(0);
  }, []);

  // ── External stop via global map ──
  const stopFn = useCallback(() => {
    if (!stoppedRef.current) {
      handleStop();
    }
  }, [handleStop]);

  useEffect(() => {
    const map = (window as unknown as Record<string, Record<string, () => void>>).__focusTimers ?? {};
    (window as unknown as Record<string, Record<string, () => void>>).__focusTimers = map;
    map[_taskId] = { stop: stopFn };
    return () => {
      delete map[_taskId];
    };
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

  // ── Stopped / Completed → Compact summary card ──
  if (sessions.length === 0 && totalAccumulated === 0) {
    return null;
  }

  const lastSession = sessions[sessions.length - 1];
  const reversedSessions = [...sessions].reverse();

  return (
    <div>
      {/* Compact summary bar — always visible when stopped */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all select-none group"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderColor: 'rgba(34,197,94,0.15)',
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Timer size={13} className="text-green-500 shrink-0" />
        <span className="text-xs font-medium" style={{ color: '#166534' }}>
          上次专注 {formatTotal(totalAccumulated)}
        </span>
        <span className="text-[10px] text-muted-fg/60">· {sessions.length} 次</span>
        <span className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onRestart?.(); }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#166534' }}
        >
          <Play size={10} /> 继续
        </button>
        {showDetails ? (
          <ChevronDown size={13} className="text-green-600 shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-green-600 shrink-0" />
        )}
      </div>

      {/* Expanded details panel */}
      {showDetails && (
        <div
          className="mt-1.5 rounded-lg border p-3 animate-scale-in"
          style={{
            background: 'rgba(255,255,255,0.65)',
            borderColor: 'rgba(34,197,94,0.12)',
          }}
        >
          {/* Summary row */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(240,253,244,0.8)' }}>
              <div className="text-[10px] text-muted-fg">专注次数</div>
              <div className="text-sm font-bold" style={{ color: '#166534' }}>{sessions.length} 次</div>
            </div>
            <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(240,253,244,0.8)' }}>
              <div className="text-[10px] text-muted-fg">累计时长</div>
              <div className="text-sm font-bold" style={{ color: '#166534' }}>{formatTotal(totalAccumulated)}</div>
            </div>
            {lastSession && (
              <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(240,253,244,0.8)' }}>
                <div className="text-[10px] text-muted-fg">最后记录</div>
                <div className="text-sm font-bold" style={{ color: '#166534' }}>{formatTotal(lastSession.duration)}</div>
              </div>
            )}
          </div>

          {/* "Continue" button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRestart?.(); }}
            className="w-full mb-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#166534' }}
          >
            <Play size={12} /> 开始新的专注
          </button>

          {/* Session history */}
          {reversedSessions.length > 0 && (
            <div className="border-t pt-2.5" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
              <div className="text-[10px] font-semibold text-muted-fg mb-2">专注历史</div>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-focus-scroll">
                {reversedSessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 py-1 rounded text-xs"
                    style={{ background: 'rgba(240,253,244,0.5)' }}
                  >
                    <div className="min-w-0">
                      <span className="text-[11px]" style={{ color: '#14532d' }}>
                        {formatDateTime(s.start)} → {formatDateTime(s.end)}
                      </span>
                      <span className="text-[10px] text-muted-fg ml-2">{sessionSummary(s.duration)}</span>
                    </div>
                    <span className="font-mono font-semibold text-[11px] shrink-0 ml-2" style={{ color: '#166534' }}>
                      {formatTotal(s.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollbar styles */}
      <style>{`
        .custom-focus-scroll::-webkit-scrollbar { width: 4px; }
        .custom-focus-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-focus-scroll::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.18); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// Helper to externally stop a task's timer
export function stopTaskTimer(taskId: string) {
  const map = (window as unknown as Record<string, Record<string, () => void>>).__focusTimers;
  map?.[taskId]?.stop?.();
}
