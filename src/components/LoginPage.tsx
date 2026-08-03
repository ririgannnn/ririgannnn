import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isNetworkError } from '../services/api';

interface Props {
  onSwitchToRegister: () => void;
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

/* ════════════════════════════════════════════════════════
   Background Layer (shared between all screens)
   ════════════════════════════════════════════════════════ */
const BackgroundLayer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    {/* Background illustration */}
    <img
      src="/miku-bg.jpg"
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      style={{ objectPosition: 'center 30%' }}
    />

    {/* Dark overlay — ensure readability */}
    <div className="absolute inset-0 bg-black/30" />

    {/* Bottom gradient — darker at bottom so the form card pops */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

    {/* Subtle animated vignette */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,0.4) 100%)',
      }}
    />

    {children}
  </div>
);

/* ════════════════════════════════════════════════════════
   Glass Card (frosted glass container)
   ════════════════════════════════════════════════════════ */
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`
      relative overflow-hidden rounded-2xl md:rounded-3xl
      border border-white/20 md:border-white/25
      shadow-2xl
      ${className}
    `}
    style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    }}
  >
    {/* Inner glass highlight edge */}
    <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
      style={{
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.3)',
      }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

/* ── Brand Header ── */
const BrandHeader = () => (
  <div className="text-center mb-6 md:mb-8 animate-fade-in-up">
    {/* Logo orb */}
    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-4"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)), hsl(var(--accent-teal)))',
        backgroundSize: '200% 200%',
        animation: 'colorShift 6s ease infinite',
        boxShadow: '0 8px 32px hsl(var(--accent-purple) / 0.35), 0 0 0 1px rgba(255,255,255,0.15) inset',
      }}
    >
      <span className="text-2xl md:text-3xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>荔</span>
    </div>

    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1 drop-shadow-lg">
      荔荔绀工作台
    </h1>

    <p className="text-sm md:text-base font-black tracking-[0.15em] uppercase"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-teal)), hsl(var(--accent-amber)))',
        backgroundSize: '300% 300%',
        animation: 'colorShift 5s ease infinite',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      RIRIGANNNN
    </p>
  </div>
);

export default function LoginPage({ onSwitchToRegister }: Props) {
  const { login, loginOffline } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (!password) { setError('请输入密码'); return; }
    setLoading(true); setError('');
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        setIsOffline(true);
        setError('无法连接到服务器，请检查网络或使用离线模式');
      } else {
        setError(err instanceof Error ? err.message : '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = () => {
    if (!username.trim()) { setError('请至少输入用户名'); return; }
    loginOffline(username.trim());
  };

  /* ════════════════════════════════════════════════════════
     Offline Mode Screen
     ════════════════════════════════════════════════════════ */
  if (isOffline) {
    return (
      <BackgroundLayer>
        <div className="w-full max-w-sm mx-auto px-4 py-8 animate-scale-in">
          <GlassCard className="p-6 md:p-8">
            <BrandHeader />

            <div className="mb-5">
              <h2 className="text-lg font-bold text-white text-center mb-1">离线模式</h2>
              <p className="text-xs text-white/60 text-center">数据保存在本设备，暂不支持跨设备同步</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/20 text-red-200 text-sm border border-red-400/30 animate-shake flex items-start gap-2">
                <IconWarning />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">用户名（仅本地显示）</label>
                <div className={`relative rounded-xl border transition-all duration-200 ${
                  focusedField === 'offline-user'
                    ? 'border-amber-400/70 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]'
                    : 'border-white/15 hover:border-white/30'
                }`}
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                >
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('offline-user')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-2.5 bg-transparent text-white text-sm placeholder:text-white/40 outline-none rounded-xl"
                    placeholder="输入一个名称"
                  />
                </div>
              </div>

              <button
                onClick={handleOfflineLogin}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-coral)))',
                  boxShadow: '0 4px 16px hsl(var(--accent-amber) / 0.3)',
                }}
              >
                进入离线模式
              </button>

              <button
                onClick={() => setIsOffline(false)}
                className="w-full py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                返回重试登录
              </button>
            </div>
          </GlassCard>
        </div>
      </BackgroundLayer>
    );
  }

  /* ════════════════════════════════════════════════════════
     Main Login Screen
     ════════════════════════════════════════════════════════ */
  return (
    <BackgroundLayer>
      <div className="w-full max-w-sm mx-auto px-4 py-6 md:py-8">
        <GlassCard className="p-6 md:p-8 animate-slide-in-right">
          <BrandHeader />

          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-0.5">欢迎回来</h2>
            <p className="text-xs text-white/50">登录你的工作台，继续高效工作</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
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
                  placeholder="请输入用户名"
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
                  placeholder="请输入密码"
                  autoComplete="current-password"
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
                  <Spinner /> 登录中...
                </span>
              ) : (
                '登  录'
              )}
              {!loading && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-white/40" style={{ background: 'transparent' }}>或</span>
              </div>
            </div>

            {/* Offline mode */}
            <button
              type="button"
              onClick={() => loginOffline(username.trim() || '本地用户')}
              className="w-full py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200"
            >
              离线模式（跳过登录）
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-white/50 mt-5">
            还没有账号？
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="ml-1 text-white font-semibold hover:underline underline-offset-4 transition-all"
            >
              立即注册
            </button>
          </p>
        </GlassCard>
      </div>
    </BackgroundLayer>
  );
}
