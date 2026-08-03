import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onSwitchToLogin }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('请填写所有字段');
      return;
    }
    if (username.trim().length < 2) {
      setError('用户名至少需要 2 个字符');
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
          <h2 className="text-lg font-semibold text-fg mb-4">注册</h2>

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
                placeholder="2-30 个字符"
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
                placeholder="至少 6 位"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                  placeholder:text-muted-fg transition-colors"
                placeholder="再次输入密码"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-bg-brand text-white text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-fg mt-4">
          已有账号？
          <button
            onClick={onSwitchToLogin}
            className="ml-1 text-accent font-medium hover:underline"
          >
            去登录
          </button>
        </p>
      </div>
    </div>
  );
}
