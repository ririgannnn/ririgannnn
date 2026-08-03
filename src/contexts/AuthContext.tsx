import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api, { isNetworkError } from '../services/api';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  serverAvailable: boolean | null; // null = checking, true/false = known
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  loginOffline: (username: string) => void;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    isOfflineMode: false,
    serverAvailable: null,
  });

  // Check server availability on mount
  useEffect(() => {
    const checkServer = async () => {
      const available = await api.ping();
      setState((s) => ({ ...s, serverAvailable: available }));
    };
    checkServer();
  }, []);

  // Initialize from stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const offlineUser = localStorage.getItem('offline_user');

    if (storedToken) {
      api.setToken(storedToken);
      // Validate token by fetching user info
      api.getMe()
        .then(({ user }) => {
          api.setOfflineMode(false);
          setState({
            user: { id: user.id, username: user.username },
            token: storedToken,
            isLoading: false,
            isAuthenticated: true,
            isOfflineMode: false,
            serverAvailable: true,
          });
        })
        .catch((err) => {
          if (isNetworkError(err)) {
            // Server unreachable but we have a stored token — fall back to offline with saved user
            if (offlineUser) {
              try {
                const parsed = JSON.parse(offlineUser);
                api.setOfflineMode(true);
                setState({
                  user: parsed,
                  token: storedToken,
                  isLoading: false,
                  isAuthenticated: true,
                  isOfflineMode: true,
                  serverAvailable: false,
                });
                return;
              } catch { /* fall through */ }
            }
          }
          // Token expired or invalid
          api.setToken(null);
          api.setOfflineMode(false);
          setState({ user: null, token: null, isLoading: false, isAuthenticated: false, isOfflineMode: false, serverAvailable: false });
        });
    } else if (offlineUser) {
      // Stored offline user (no server token)
      try {
        const parsed = JSON.parse(offlineUser);
        api.setOfflineMode(true);
        setState({
          user: parsed,
          token: null,
          isLoading: false,
          isAuthenticated: true,
          isOfflineMode: true,
          serverAvailable: false,
        });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token, user } = await api.login(username, password);
    api.setToken(token);
    api.setOfflineMode(false);
    localStorage.setItem('offline_user', JSON.stringify({ id: user.id, username: user.username }));
    setState({
      user: { id: user.id, username: user.username },
      token,
      isLoading: false,
      isAuthenticated: true,
      isOfflineMode: false,
      serverAvailable: true,
    });
  }, []);

  const loginOffline = useCallback((username: string) => {
    const offlineId = generateUUID();
    const user = { id: offlineId, username: username || '本地用户' };
    const offlineToken = `offline_${offlineId}`;

    api.setToken(offlineToken);
    api.setOfflineMode(true);
    localStorage.setItem('offline_user', JSON.stringify(user));

    setState({
      user,
      token: offlineToken,
      isLoading: false,
      isAuthenticated: true,
      isOfflineMode: true,
      serverAvailable: false,
    });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const { token, user } = await api.register(username, password);
    api.setToken(token);
    api.setOfflineMode(false);
    localStorage.setItem('offline_user', JSON.stringify({ id: user.id, username: user.username }));
    setState({
      user: { id: user.id, username: user.username },
      token,
      isLoading: false,
      isAuthenticated: true,
      isOfflineMode: false,
      serverAvailable: true,
    });
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    api.setOfflineMode(false);
    localStorage.removeItem('offline_user');
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isOfflineMode: false,
      serverAvailable: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginOffline, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
