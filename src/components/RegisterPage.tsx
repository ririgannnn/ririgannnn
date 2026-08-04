import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
}

/* ── Inline SVG Icons ── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

/* ── Background ── */
const BackgroundLayer = ({ children }: { children: React.ReactNode }) => (
  <div className="login-bg relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    <div className="login-ambient">
      <div className="absolute w-[500px] h-[500px] rounded-full border opacity-[0.04]"
        style={{ borderColor: 'var(--kon-main)', top: '-8%', right: '-10%', animation: 'drift 22s ease-in-out infinite' }} />
      <div className="absolute w-[360px] h-[360px] rounded-full opacity-[0.04]"
        style={{ background: 'var(--accent-warm)', bottom: '-10%', left: '-6%', animation: 'drift 26s ease-in-out infinite reverse' }} />
      <div className="absolute w-[240px] h-[240px] rounded-full opacity-[0.05]"
        style={{ background: 'var(--accent-teal)', top: '60%', right: '-6%', animation: 'drift 30s ease-in-out infinite 5s' }} />
      <div className="absolute w-[340px] h-[340px] rounded-full opacity-[0.05]"
        style={{ background: 'var(--kon-main)', top: '20%', left: '-10%', animation: 'drift 28s ease-in-out infinite reverse 3s' }} />
    </div>
    {children}
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
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 py-8 animate-fade-up">
        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Top gradient accent line */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-warm), var(--kon-main))' }} />

          {/* Corner dots */}
          <span className="absolute w-2 h-2 rounded-full top-4 left-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full top-4 right-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full bottom-4 left-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full bottom-4 right-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />

          <div className="p-8 md:p-10">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden"
                style={{ boxShadow: '0 4px 20px rgba(153,167,188,0.25)' }}
              >
                <img src="/ito.jpg" alt="头像" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: '1px solid var(--kon-main)', opacity: 0.3 }} />
              </div>
            </div>

            {/* Brand */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-[26px] font-normal text-fg mb-1 tracking-[-0.01em]">加入工作台</h1>
              <p className="text-xs tracking-[0.12em] uppercase" style={{ color: 'var(--text-dim)' }}>Ririgannnn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-shake"
                  style={{ background: 'rgba(184,151,157,0.12)', color: 'var(--accent-dust)', border: '1px solid rgba(184,151,157,0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-fg-mid mb-1.5">用户名</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-dim)' }}>
                    <IconUser />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input pl-10"
                    placeholder="2-30 个字符"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-fg-mid mb-1.5">密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-dim)' }}>
                    <IconLock />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input pl-10 pr-11"
                    placeholder="至少 6 位"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors hover:opacity-70"
                    style={{ color: 'var(--text-dim)' }}
                    tabIndex={-1}
                  >
                    {showPwd ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-fg-mid mb-1.5">确认密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-dim)' }}>
                    <IconCheck />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input pl-10 pr-11"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors hover:opacity-70"
                    style={{ color: 'var(--text-dim)' }}
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
                className="login-btn login-btn-primary !rounded-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--kon-deeper))' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> 注册中...
                  </span>
                ) : (
                  '注  册'
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-dim)' }}>
              已有账号？
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="ml-1 font-medium hover:underline underline-offset-4 transition-all"
                style={{ color: 'var(--kon-dark)' }}
              >
                去登录
              </button>
            </p>
          </div>
        </div>
      </div>
    </BackgroundLayer>
  );
}
