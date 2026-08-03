import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isNetworkError } from '../services/api';

interface Props {
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onSwitchToRegister }: Props) {
  const { login, loginOffline } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('请填写用户名和密码');
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

  if (isOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 mb-4">
              <span className="text-lg font-bold text-amber-600">!</span>
            </div>
            <h1 className="text-xl font-bold text-fg">服务器不可达</h1>
            <p className="text-xs text-muted-fg mt-2 max-w-xs mx-auto">
              无法连接到后端服务器。数据将保存在本设备上，暂不支持跨设备同步。
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-amber-200">
            <h2 className="text-lg font-semibold text-fg mb-4">离线模式</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">用户名（仅本地显示）</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400
                    placeholder:text-muted-fg transition-colors"
                  placeholder="输入一个名称"
                />
              </div>

              <button
                onClick={handleOfflineLogin}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-white text-sm font-medium
                  hover:bg-amber-600 transition-colors"
              >
                进入离线模式
              </button>

              <button
                onClick={() => setIsOffline(false)}
                className="w-full py-2 rounded-lg text-sm text-muted-fg hover:text-fg transition-colors"
              >
                返回重试登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-bg-brand mb-4">
            <span className="text-lg font-bold text-white">荔</span>
          </div>
          <h1 className="text-xl font-bold text-fg">荔荔绀工作台</h1>
          <p className="text-xs text-muted-fg mt-1">RIRIGANNNN</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-fg mb-4">登录</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                  placeholder:text-muted-fg transition-colors"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                  placeholder:text-muted-fg transition-colors"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-bg-brand text-white text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-muted-fg">或</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loginOffline(username.trim() || '本地用户')}
              className="w-full py-2.5 rounded-lg border border-border text-fg text-sm font-medium
                hover:bg-muted transition-colors"
            >
              离线模式（跳过登录）
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-fg mt-4">
          还没有账号？
          <button
            onClick={onSwitchToRegister}
            className="ml-1 text-accent font-medium hover:underline"
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  );
}
