import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isNetworkError } from '../services/api';

interface Props {
  onSwitchToRegister: () => void;
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

/* ════════════════════════════════════════════════════════
   Background — low-saturation warm gradient + ambient orbs
   ════════════════════════════════════════════════════════ */
const BackgroundLayer = ({ children }: { children: React.ReactNode }) => (
  <div className="login-bg relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    {/* Ambient orbs */}
    <div className="login-ambient">
      <div className="absolute w-[500px] h-[500px] rounded-full border opacity-[0.04]"
        style={{ borderColor: 'var(--kon-main)', top: '-8%', right: '-10%', animation: 'drift 22s ease-in-out infinite' }} />
      <div className="absolute w-[360px] h-[360px] rounded-full opacity-[0.04]"
        style={{ background: 'var(--accent-warm)', bottom: '-10%', left: '-6%', animation: 'drift 26s ease-in-out infinite reverse' }} />
      <div className="absolute w-[260px] h-[260px] rounded-full opacity-[0.05]"
        style={{ background: 'var(--accent-orange)', top: '55%', right: '-8%', animation: 'drift 30s ease-in-out infinite 5s' }} />
      <div className="absolute w-[340px] h-[340px] rounded-full opacity-[0.05]"
        style={{ background: 'var(--kon-main)', top: '20%', left: '-10%', animation: 'drift 28s ease-in-out infinite reverse 3s' }} />
    </div>

    {children}
  </div>
);

/* ════════════════════════════════════════════════════════
   Login Card
   ════════════════════════════════════════════════════════ */
export default function LoginPage({ onSwitchToRegister }: Props) {
  const { login, loginOffline } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!account.trim()) { setError('请输入账户'); return; }
    if (!password) { setError('请输入密码'); return; }
    setLoading(true); setError('');
    try {
      await login(account.trim(), password);
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        setIsOffline(true);
        setError('无法连接到服务器');
      } else {
        setError(err instanceof Error ? err.message : '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = () => {
    if (!account.trim()) { setError('请至少输入账户名'); return; }
    loginOffline(account.trim());
  };

  /* ── Offline Mode ── */
  if (isOffline) {
    return (
      <BackgroundLayer>
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 py-8 animate-fade-up">
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Top gradient accent line */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--kon-main), var(--accent-orange), var(--accent-warm))' }} />

            <div className="p-8 md:p-10">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden"
                  style={{ boxShadow: '0 4px 20px rgba(153,167,188,0.25)' }}
                >
                  <img src="/ito.jpg" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              {/* Brand */}
              <div className="text-center mb-6">
                <h1 className="font-serif text-[26px] font-normal text-fg mb-1 tracking-[-0.01em]">个人工作台</h1>
                <p className="text-xs tracking-[0.12em] uppercase" style={{ color: 'var(--text-dim)' }}>Ririgannnn</p>
              </div>

              <h2 className="text-base font-medium text-center text-fg-mid mb-1">离线模式</h2>
              <p className="text-sm text-center text-fg-dim mb-6">数据保存在本设备，暂不支持跨设备同步</p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-shake"
                  style={{ background: 'rgba(184,151,157,0.12)', color: 'var(--accent-dust)', border: '1px solid rgba(184,151,157,0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-mid mb-1.5">账户名（仅本地显示）</label>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="login-input"
                    placeholder="输入一个名称"
                  />
                </div>

                <button
                  onClick={handleOfflineLogin}
                  className="login-btn login-btn-primary"
                >
                  进入离线模式
                </button>

                <button
                  onClick={() => setIsOffline(false)}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
                >
                  返回重试登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </BackgroundLayer>
    );
  }

  /* ── Main Login ── */
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
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--kon-main), var(--accent-orange), var(--accent-warm))' }} />

          {/* Corner dots */}
          <span className="absolute w-2 h-2 rounded-full top-4 left-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full top-4 right-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full bottom-4 left-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />
          <span className="absolute w-2 h-2 rounded-full bottom-4 right-4" style={{ background: 'var(--kon-main)', opacity: 0.25 }} />

          <div className="p-8 md:p-10">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden transition-all duration-400 hover:scale-105"
                style={{ boxShadow: '0 4px 20px rgba(153,167,188,0.25)' }}
              >
                <img src="/ito.jpg" alt="头像" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500"
                  style={{ border: '1px solid var(--kon-main)', opacity: 0.3 }} />
              </div>
            </div>

            {/* Brand */}
            <div className="text-center mb-8">
              <h1 className="font-serif text-[26px] font-normal text-fg mb-1 tracking-[-0.01em]">个人工作台</h1>
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

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-fg-mid mb-1.5">账户</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-dim)' }}>
                    <IconUser />
                  </div>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="login-input pl-10"
                    placeholder="请输入账户"
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
                    placeholder="请输入密码"
                    autoComplete="current-password"
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

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-kon-main" defaultChecked />
                  <span className="text-sm text-fg-dim">记住我</span>
                </label>
                <button type="button" className="text-sm transition-all duration-300 hover:underline underline-offset-4"
                  style={{ color: 'var(--text-dim)' }}
                >
                  忘记密码？
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn login-btn-primary !rounded-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> 登录中...
                  </span>
                ) : (
                  '登  录'
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} />
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>或</span>
                <div className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} />
              </div>

              {/* Offline */}
              <button
                type="button"
                onClick={handleOfflineLogin}
                className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-black/3"
                style={{ color: 'var(--text-mid)', border: '1px solid var(--line)' }}
              >
                离线模式（跳过登录）
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--text-dim)' }}>
              还没有账号？
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="ml-1 font-medium hover:underline underline-offset-4 transition-all"
                style={{ color: 'var(--kon-dark)' }}
              >
                立即注册
              </button>
            </p>
          </div>
        </div>
      </div>
    </BackgroundLayer>
  );
}
