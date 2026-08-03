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

const IconWifiOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

/* ── Spinner ── */
const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
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
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    setLoading(true);
    setError('');
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
    if (!username.trim()) {
      setError('请至少输入用户名');
      return;
    }
    loginOffline(username.trim());
  };

  /* ================================================================
     Offline Mode Screen
     ================================================================ */
  if (isOffline) {
    return (
      <div className="min-h-screen flex login-split">
        {/* Left: Brand */}
        <div className="login-brand-panel w-full md:w-5/12 lg:w-2/5 flex flex-col items-center justify-center p-6 md:p-10 login-gradient-bg relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="login-accent-blob w-48 h-48 bg-accent-amber -top-8 -right-8 animate-float-slow" />
          <div className="login-accent-blob w-64 h-64 bg-accent-coral -bottom-12 -left-12 animate-float-slower" />

          <div className="relative z-10 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-coral)))',
                boxShadow: '0 8px 32px hsl(var(--accent-amber) / 0.3)',
              }}
            >
              <IconWifiOff />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">服务器不可达</h1>
            <p className="text-sm text-white/60 max-w-xs">
              无法连接到后端服务器，你可以使用离线模式继续工作
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-7/12 lg:w-3/5 flex items-center justify-center p-4 md:p-10 bg-bg">
          <div className="w-full max-w-sm animate-scale-in">
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8"
              style={{ animationDelay: '0.1s' }}
            >
              <h2 className="text-lg font-bold text-fg mb-1">离线模式</h2>
              <p className="text-sm text-muted-fg mb-6">数据将保存在本设备上，暂不支持跨设备同步</p>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200 animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-fg mb-2">用户名（仅本地显示）</label>
                  <div className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'offline-user'
                      ? 'border-amber-400 shadow-[0_0_0_3px_hsl(38_92%_50%/0.15)]'
                      : 'border-border hover:border-amber-300'
                  }`}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('offline-user')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3 bg-transparent text-fg text-sm placeholder:text-muted-fg outline-none rounded-xl"
                      placeholder="输入一个名称"
                    />
                  </div>
                </div>

                <button
                  onClick={handleOfflineLogin}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-coral)))',
                    boxShadow: '0 4px 16px hsl(var(--accent-amber) / 0.25)',
                  }}
                >
                  进入离线模式
                </button>

                <button
                  onClick={() => setIsOffline(false)}
                  className="w-full py-2.5 rounded-xl text-sm text-muted-fg hover:text-fg hover:bg-muted transition-all duration-200"
                >
                  返回重试登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     Main Login Screen
     ================================================================ */
  return (
    <div className="min-h-screen flex login-split">

      {/* ════════════════════════════════════════════════════════
          Left: Brand Panel (desktop: 5/12, mobile: full-width top)
          ════════════════════════════════════════════════════════ */}
      <div className="login-brand-panel w-full md:w-5/12 lg:w-2/5 flex flex-col items-center justify-center p-6 md:p-10 login-gradient-bg relative overflow-hidden select-none">

        {/* Floating decorative blobs */}
        <div className="login-accent-blob w-56 h-56 bg-accent-pink top-[-6%] left-[-8%] animate-float-slow" />
        <div className="login-accent-blob w-72 h-72 bg-accent-purple bottom-[-10%] right-[-10%] animate-float-slower" style={{ animationDelay: '2s' }} />
        <div className="login-accent-blob w-40 h-40 bg-accent-teal top-[45%] right-[15%] animate-float" style={{ animationDelay: '4s' }} />
        <div className="login-accent-blob w-32 h-32 bg-accent-amber bottom-[20%] left-[25%] animate-float-slow" style={{ animationDelay: '1s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10 text-center animate-fade-in-up">
          {/* Logo gradient orb */}
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl mb-5 animate-float-slower"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)), hsl(var(--accent-teal)))',
              backgroundSize: '200% 200%',
              animation: 'colorShift 6s ease infinite, floatSlower 10s ease-in-out infinite',
              boxShadow: '0 12px 40px hsl(var(--accent-purple) / 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            <span className="text-3xl md:text-4xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              荔
            </span>
          </div>

          {/* App name */}
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
            荔荔绀工作台
          </h1>

          {/* English name with gradient */}
          <p className="text-base md:text-lg font-black tracking-[0.12em] uppercase mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)), hsl(var(--accent-teal)), hsl(var(--accent-amber)))',
              backgroundSize: '300% 300%',
              animation: 'colorShift 6s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            RIRIGANNNN
          </p>

          {/* Tagline */}
          <p className="text-xs md:text-sm text-white/40 max-w-[240px]">
            高效 · 专注 · 优雅的个人工作空间
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          Right: Form Panel
          ════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-7/12 lg:w-3/5 flex items-center justify-center p-4 md:p-10 bg-bg">
        <div className="w-full max-w-[380px] animate-slide-in-right" style={{ animationDelay: '0.15s' }}>

          {/* Welcome heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-fg tracking-tight mb-1.5">欢迎回来</h2>
            <p className="text-sm text-muted-fg">登录你的工作台，继续高效工作</p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200 animate-shake flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-fg mb-2">用户名</label>
                <div className={`relative rounded-xl border transition-all duration-200 login-input ${
                  focusedField === 'username'
                    ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                    : 'border-border hover:border-muted-fg/40'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-fg">
                    <IconUser />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-fg text-sm placeholder:text-muted-fg/60 outline-none rounded-xl"
                    placeholder="请输入用户名"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-fg mb-2">密码</label>
                <div className={`relative rounded-xl border transition-all duration-200 login-input ${
                  focusedField === 'password'
                    ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                    : 'border-border hover:border-muted-fg/40'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-fg">
                    <IconLock />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-11 py-3 bg-transparent text-fg text-sm placeholder:text-muted-fg/60 outline-none rounded-xl"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-fg hover:text-fg transition-colors"
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
                className="w-full py-3 rounded-xl text-white text-sm font-semibold login-btn relative overflow-hidden disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-purple)))',
                  backgroundSize: '150% 150%',
                  boxShadow: '0 6px 20px hsl(var(--primary) / 0.25)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    登录中...
                  </span>
                ) : (
                  '登  录'
                )}
                {/* Shimmer overlay on hover */}
                {!loading && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-fg">或</span>
                </div>
              </div>

              {/* Offline mode */}
              <button
                type="button"
                onClick={() => loginOffline(username.trim() || '本地用户')}
                className="w-full py-3 rounded-xl border border-border text-fg text-sm font-medium
                  hover:bg-muted hover:border-muted-fg/30 transition-all duration-200"
              >
                离线模式（跳过登录）
              </button>
            </div>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-muted-fg mt-5">
            还没有账号？
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="ml-1 text-primary font-semibold hover:underline underline-offset-4 transition-all"
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
