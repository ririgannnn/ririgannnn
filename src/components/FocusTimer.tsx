import { useState } from 'react';
import type { FocusSession } from '../types';
import { useStore } from '../stores';
import { Play, Pause, Square, RotateCcw, Timer, Minimize2, X, ChevronDown, ChevronRight, Plus, Clock } from 'lucide-react';

interface FocusTimerProps {
  taskId: string;
  taskTitle: string;
  focusSession: FocusSession | undefined;
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
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

export default function FocusTimer({ taskId, taskTitle, focusSession, onRestart }: FocusTimerProps) {
  const activeTimer = useStore((s) => s.activeTimer);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const resumeTimer = useStore((s) => s.resumeTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const resetTimer = useStore((s) => s.resetTimer);
  const addManualFocusSession = useStore((s) => s.addManualFocusSession);

  const isThisTimer = activeTimer?.taskId === taskId;
  const isRunning = isThisTimer && !activeTimer?.isPaused;
  const isPaused = isThisTimer && !!activeTimer?.isPaused;

  const [minimized, setMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Manual time entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMins, setManualMins] = useState('25');
  const [manualDate, setManualDate] = useState('');
  const [manualNote, setManualNote] = useState('');

  const totalAccumulated = focusSession?.totalDuration ?? 0;
  const sessions = focusSession?.sessions ?? [];

  // Compute display time from store anchors
  const elapsedMs = isThisTimer && activeTimer
    ? (activeTimer.isPaused
      ? activeTimer.accumulatedMs
      : Date.now() - activeTimer.startTime + activeTimer.accumulatedMs)
    : 0;

  // Force re-render when tick changes (for isRunning display)
  void (activeTimer?.tick);

  const handleManualSubmit = () => {
    const h = parseInt(manualHours, 10) || 0;
    const m = parseInt(manualMins, 10) || 0;
    const totalMs = (h * 60 + m) * 60000;
    if (totalMs <= 0) return;
    addManualFocusSession(taskId, totalMs, manualDate || undefined);
    setManualHours('');
    setManualMins('25');
    setManualDate('');
    setManualNote('');
    setShowManualEntry(false);
  };

  // ── Running / Paused Timer Card ──
  if (isThisTimer && (isRunning || isPaused)) {
    return (
      <>
        {!minimized && (
          <div
            className="animate-scale-in rounded-xl p-3.5 border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--accent-orange)',
              boxShadow: '0 4px 16px rgba(216,107,66,0.08), 0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: isRunning ? 'var(--accent-teal)' : 'var(--accent-warm)',
                    animation: isRunning ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-orange)' }}>
                  {isPaused ? '已暂停' : '专注中'}
                </span>
              </div>
              <button
                onClick={() => setMinimized(true)}
                className="p-0.5 rounded hover:bg-black/5 transition-colors"
                title="最小化"
              >
                <Minimize2 size={13} style={{ color: 'var(--text-dim)' }} />
              </button>
            </div>

            {/* Timer ring */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <div
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(var(--accent-orange) ${Math.min((elapsedMs / (25 * 60 * 1000)) * 100, 100)}%, var(--bg-deep) 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="font-mono font-bold select-none" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                    {formatTime(elapsedMs)}
                  </span>
                  {totalAccumulated > 0 && (
                    <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      累计 {formatTotal(totalAccumulated)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              {isRunning ? (
                <button onClick={pauseTimer} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(184,160,136,0.15)', color: 'var(--accent-warm)' }}>
                  <Pause size={14} /> 暂停
                </button>
              ) : (
                <button onClick={resumeTimer} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(216,107,66,0.12)', color: 'var(--accent-orange)' }}>
                  <Play size={14} /> 继续
                </button>
              )}
              <button onClick={resetTimer} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title="重置" style={{ color: 'var(--text-dim)' }}>
                <RotateCcw size={14} />
              </button>
              <button onClick={stopTimer} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(184,151,157,0.15)', color: 'var(--accent-dust)' }}>
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
              background: 'var(--bg-surface)',
              borderColor: 'var(--accent-orange)',
              boxShadow: '0 6px 24px rgba(216,107,66,0.15)',
            }}
            onClick={() => setMinimized(false)}
          >
            <div className="w-2 h-2 rounded-full"
              style={{ background: isRunning ? 'var(--accent-teal)' : 'var(--accent-warm)', animation: isRunning ? 'pulse 2s infinite' : 'none' }} />
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{formatTime(elapsedMs)}</span>
            <span className="text-[10px] max-w-[80px] truncate" style={{ color: 'var(--text-dim)' }}>{taskTitle}</span>
            <button onClick={(e) => { e.stopPropagation(); stopTimer(); }} className="ml-1 p-0.5 rounded-full hover:bg-red-50 transition-colors" title="停止计时">
              <X size={12} className="text-red-400" />
            </button>
          </div>
        )}
      </>
    );
  }

  // ── Stopped / Completed → Compact summary card ──
  if (sessions.length === 0 && totalAccumulated === 0 && !focusSession) {
    // Show a "start timer" button inline
    return (
      <button
        onClick={() => startTimer(taskId, taskTitle)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: 'rgba(74,138,122,0.08)', color: 'var(--accent-teal)' }}
      >
        <Timer size={12} /> 开始专注计时
      </button>
    );
  }

  const lastSession = sessions[sessions.length - 1];
  const reversedSessions = [...sessions].reverse();

  return (
    <div>
      {/* Compact summary bar */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all select-none group whitespace-nowrap"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--line)' }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Timer size={11} style={{ color: 'var(--accent-teal)' }} className="shrink-0" />
        <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: 'var(--text-mid)' }}>
          专注 {formatTotal(totalAccumulated)}
        </span>
        <span className="text-[10px] whitespace-nowrap shrink-0" style={{ color: 'var(--text-dim)' }}>· {sessions.length} 次</span>
        <span className="flex-1 min-w-[4px]" />
        <button onClick={(e) => { e.stopPropagation(); startTimer(taskId, taskTitle); }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap shrink-0"
          style={{ background: 'rgba(74,138,122,0.12)', color: 'var(--accent-teal)' }}>
          <Play size={9} /> 开始
        </button>
        {showDetails ? (
          <ChevronDown size={11} style={{ color: 'var(--accent-teal)' }} className="shrink-0" />
        ) : (
          <ChevronRight size={11} style={{ color: 'var(--accent-teal)' }} className="shrink-0" />
        )}
      </div>

      {/* Expanded details panel */}
      {showDetails && (
        <div className="mt-1.5 rounded-lg border p-3 animate-scale-in"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--line)' }}>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-deep)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>专注次数</div>
              <div className="text-xs font-bold" style={{ color: 'var(--accent-teal)' }}>{sessions.length} 次</div>
            </div>
            <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-deep)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>累计时长</div>
              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatTotal(totalAccumulated)}</div>
            </div>
            {lastSession && (
              <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-deep)' }}>
                <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>最后记录</div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{formatTotal(lastSession.duration)}</div>
              </div>
            )}
          </div>

          <button onClick={(e) => { e.stopPropagation(); startTimer(taskId, taskTitle); }}
            className="w-full mb-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(74,138,122,0.1)', color: 'var(--accent-teal)' }}>
            <Play size={12} /> 开始新的专注
          </button>

          {/* ── Manual time entry ── */}
          {!showManualEntry ? (
            <button onClick={(e) => { e.stopPropagation(); setShowManualEntry(true); }}
              className="w-full mb-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5"
              style={{ border: '1px dashed var(--line)', color: 'var(--text-dim)' }}>
              <Plus size={11} /> 手动补录专注时间
            </button>
          ) : (
            <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-deep)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} style={{ color: 'var(--text-dim)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-mid)' }}>手动补录专注时间</span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <input
                  type="number" min="0" max="24"
                  value={manualHours} onChange={(e) => setManualHours(e.target.value)}
                  placeholder="0"
                  className="w-12 text-center text-xs px-1 py-1 rounded outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-primary)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>小时</span>
                <input
                  type="number" min="0" max="59"
                  value={manualMins} onChange={(e) => setManualMins(e.target.value)}
                  placeholder="25"
                  className="w-12 text-center text-xs px-1 py-1 rounded outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-primary)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>分钟</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] shrink-0" style={{ color: 'var(--text-dim)' }}>日期</span>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="flex-1 text-[10px] px-2 py-1 rounded outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-primary)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>（留空为今天）</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowManualEntry(false)}
                  className="flex-1 py-1.5 text-[10px] rounded-lg transition-colors"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}>
                  取消
                </button>
                <button onClick={handleManualSubmit}
                  className="flex-1 py-1.5 text-[10px] rounded-lg text-white transition-colors"
                  style={{ background: 'var(--accent-teal)' }}>
                  确认补录
                </button>
              </div>
            </div>
          )}

          {reversedSessions.length > 0 && (
            <div className="border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
              <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>专注历史</div>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-focus-scroll">
                {reversedSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 rounded text-[10px]"
                    style={{ background: 'var(--bg-deep)' }}>
                    <div className="min-w-0">
                      <span className="text-[10px]" style={{ color: 'var(--text-mid)' }}>
                        {formatDateTime(s.start)} → {formatDateTime(s.end)}
                      </span>
                      <span className="text-[10px] ml-2" style={{ color: 'var(--text-dim)' }}>{sessionSummary(s.duration)}</span>
                    </div>
                    <span className="font-mono font-semibold text-[10px] shrink-0 ml-2" style={{ color: 'var(--text-primary)' }}>
                      {formatTotal(s.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-focus-scroll::-webkit-scrollbar { width: 4px; }
        .custom-focus-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-focus-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// Helper to stop a task's timer externally
export { useStore as _useTimerStore };
export function stopTaskTimer(taskId: string) {
  const { activeTimer, stopTimer } = useStore.getState();
  if (activeTimer?.taskId === taskId) {
    stopTimer();
  }
}
