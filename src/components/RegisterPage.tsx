import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
}

/* ── Inline SVG Icons ── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ── Background (shared with LoginPage) ── */
const BackgroundLayer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    <img
      src="/miku-bg.jpg"
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      style={{ objectPosition: 'center 30%' }}
    />
    <div className="absolute inset-0 bg-black/30" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,0.4) 100%)' }}
    />
    {children}
  </div>
);

/* ── Glass Card ── */
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/20 md:border-white/25 shadow-2xl ${className}`}
    style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    }}
  >
    <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
      style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.3)' }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

/* ── Brand Header ── */
const BrandHeader = () => (
  <div className="text-center mb-6 md:mb-8 animate-fade-in-up">
    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-4"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-lime)), hsl(var(--accent-purple)))',
        backgroundSize: '200% 200%',
        animation: 'colorShift 6s ease infinite',
        boxShadow: '0 8px 32px hsl(var(--accent-teal) / 0.35), 0 0 0 1px rgba(255,255,255,0.15) inset',
      }}
    >
      <span className="text-2xl md:text-3xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>荔</span>
    </div>
    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1 drop-shadow-lg">加入工作台</h1>
    <p className="text-sm md:text-base font-black tracking-[0.15em] uppercase"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-purple)), hsl(var(--accent-pink)))',
        backgroundSize: '300% 300%',
        animation: 'colorShift 5s ease infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >RIRIGANNNN</p>
  </div>
);

export default function RegisterPage({ onSwitchToLogin }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (username.trim().length < 2) { setError('用户名至少需要 2 个字符'); return; }
    if (!password) { setError('请输入密码'); return; }
    if (password.length < 6) { setError('密码至少需要 6 个字符'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }

    setLoading(true);
    try {
      await register(username.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundLayer>
      <div className="w-full max-w-sm mx-auto px-4 py-6 md:py-8">
        <GlassCard className="p-6 md:p-8 animate-slide-in-right">
          <BrandHeader />

          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-0.5">创建账号</h2>
            <p className="text-xs text-white/50">注册荔荔绀工作台，开始高效管理</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-400/30 animate-shake flex items-start gap-2">
                <IconWarning />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">用户名</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focusedField === 'username'
                  ? 'border-primary/70 shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]'
                  : 'border-white/15 hover:border-white/30'
              }`}
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <IconUser />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white text-sm placeholder:text-white/40 outline-none rounded-xl"
                  placeholder="2-30 个字符"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">密码</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focusedField === 'password'
                  ? 'border-primary/70 shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]'
                  : 'border-white/15 hover:border-white/30'
              }`}
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <IconLock />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-11 py-2.5 bg-transparent text-white text-sm placeholder:text-white/40 outline-none rounded-xl"
                  placeholder="至少 6 位"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">确认密码</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focusedField === 'confirm'
                  ? 'border-primary/70 shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]'
                  : 'border-white/15 hover:border-white/30'
              }`}
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <IconCheck />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-11 py-2.5 bg-transparent text-white text-sm placeholder:text-white/40 outline-none rounded-xl"
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold relative overflow-hidden disabled:cursor-not-allowed login-btn"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-purple)))',
                backgroundSize: '150% 150%',
                boxShadow: '0 6px 20px hsl(var(--primary) / 0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> 注册中...
                </span>
              ) : (
                '注  册'
              )}
              {!loading && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-5">
            已有账号？
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="ml-1 text-white font-semibold hover:underline underline-offset-4 transition-all"
            >
              去登录
            </button>
          </p>
        </GlassCard>
      </div>
    </BackgroundLayer>
  );
}
