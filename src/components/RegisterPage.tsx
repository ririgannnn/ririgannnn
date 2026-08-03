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

const Spinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
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
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (username.trim().length < 2) {
      setError('用户名至少需要 2 个字符');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

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
    <div className="min-h-screen flex login-split">

      {/* ════════════════════════════════════════════════════════
          Left: Brand Panel
          ════════════════════════════════════════════════════════ */}
      <div className="login-brand-panel w-full md:w-5/12 lg:w-2/5 flex flex-col items-center justify-center p-6 md:p-10 login-gradient-bg relative overflow-hidden select-none">

        <div className="login-accent-blob w-56 h-56 bg-accent-teal top-[-6%] right-[-8%] animate-float-slow" />
        <div className="login-accent-blob w-72 h-72 bg-accent-pink bottom-[-10%] left-[-10%] animate-float-slower" style={{ animationDelay: '2s' }} />
        <div className="login-accent-blob w-40 h-40 bg-accent-purple top-[50%] left-[20%] animate-float" style={{ animationDelay: '3s' }} />
        <div className="login-accent-blob w-32 h-32 bg-accent-lime bottom-[25%] right-[20%] animate-float-slow" style={{ animationDelay: '1s' }} />

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl mb-5 animate-float-slower"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-lime)), hsl(var(--accent-purple)))',
              backgroundSize: '200% 200%',
              animation: 'colorShift 6s ease infinite, floatSlower 10s ease-in-out infinite',
              boxShadow: '0 12px 40px hsl(var(--accent-teal) / 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            <span className="text-3xl md:text-4xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>荔</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">加入工作台</h1>

          <p className="text-base md:text-lg font-black tracking-[0.12em] uppercase mb-4"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-purple)), hsl(var(--accent-pink)))',
              backgroundSize: '300% 300%',
              animation: 'colorShift 6s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            RIRIGANNNN
          </p>

          <p className="text-xs md:text-sm text-white/40 max-w-[240px]">
            创建一个账号，开始你的高效之旅
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          Right: Form Panel
          ════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-7/12 lg:w-3/5 flex items-center justify-center p-4 md:p-10 bg-bg">
        <div className="w-full max-w-[380px] animate-slide-in-right" style={{ animationDelay: '0.15s' }}>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-fg tracking-tight mb-1.5">创建账号</h2>
            <p className="text-sm text-muted-fg">注册荔荔绀工作台，开始高效管理</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
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
                    placeholder="2-30 个字符"
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
                    placeholder="至少 6 位"
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-fg mb-2">确认密码</label>
                <div className={`relative rounded-xl border transition-all duration-200 login-input ${
                  focusedField === 'confirm'
                    ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                    : 'border-border hover:border-muted-fg/40'
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-fg">
                    <IconCheck />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-11 py-3 bg-transparent text-fg text-sm placeholder:text-muted-fg/60 outline-none rounded-xl"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-fg hover:text-fg transition-colors"
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
                    注册中...
                  </span>
                ) : (
                  '注  册'
                )}
                {!loading && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-fg mt-5">
            已有账号？
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="ml-1 text-primary font-semibold hover:underline underline-offset-4 transition-all"
            >
              去登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
