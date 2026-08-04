// In production (same-origin), use relative /api. In dev, Vite proxy handles /api → backend.
const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api');

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  if (err instanceof TypeError && err.message === 'Failed to fetch') return true;
  if (err instanceof Error && err.message.includes('NetworkError')) return true;
  return false;
}

class ApiClient {
  private token: string | null = null;
  private isOffline = false;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  setOfflineMode(v: boolean) {
    this.isOffline = v;
  }

  getOfflineMode(): boolean {
    return this.isOffline;
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // In offline mode, skip all network requests immediately
    if (this.isOffline) {
      throw new OfflineError();
    }

    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.error || '请求失败', res.status);
    }

    return data as T;
  }

  // Auth
  async register(username: string, password: string) {
    return this.request<{ token: string; user: { id: string; username: string } }>(
      '/auth/register',
      { method: 'POST', body: { username, password } }
    );
  }

  async login(username: string, password: string) {
    return this.request<{ token: string; user: { id: string; username: string } }>(
      '/auth/login',
      { method: 'POST', body: { username, password } }
    );
  }

  async getMe() {
    return this.request<{ user: { id: string; username: string; created_at: string } }>('/auth/me');
  }

  // Tasks
  getTasks() { return this.request<{ tasks: unknown[] }>('/tasks'); }
  createTask(data: Record<string, unknown>) { return this.request<{ task: unknown }>('/tasks', { method: 'POST', body: data }); }
  updateTask(id: string, data: Record<string, unknown>) { return this.request<{ task: unknown }>(`/tasks/${id}`, { method: 'PUT', body: data }); }
  deleteTask(id: string) { return this.request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }); }

  // Notes
  getNotes() { return this.request<{ notes: unknown[] }>('/notes'); }
  createNote(data: Record<string, unknown>) { return this.request<{ note: unknown }>('/notes', { method: 'POST', body: data }); }
  updateNote(id: string, data: Record<string, unknown>) { return this.request<{ note: unknown }>(`/notes/${id}`, { method: 'PUT', body: data }); }
  deleteNote(id: string) { return this.request<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }); }

  // Events
  getEvents() { return this.request<{ events: unknown[] }>('/events'); }
  createEvent(data: Record<string, unknown>) { return this.request<{ event: unknown }>('/events', { method: 'POST', body: data }); }
  updateEvent(id: string, data: Record<string, unknown>) { return this.request<{ event: unknown }>(`/events/${id}`, { method: 'PUT', body: data }); }
  deleteEvent(id: string) { return this.request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }); }

  // Knowledge
  getKnowledge() { return this.request<{ knowledge: unknown[] }>('/knowledge'); }
  createKnowledge(data: Record<string, unknown>) { return this.request<{ knowledge: unknown }>('/knowledge', { method: 'POST', body: data }); }
  updateKnowledge(id: string, data: Record<string, unknown>) { return this.request<{ knowledge: unknown }>(`/knowledge/${id}`, { method: 'PUT', body: data }); }
  deleteKnowledge(id: string) { return this.request<{ success: boolean }>(`/knowledge/${id}`, { method: 'DELETE' }); }

  // Inspirations
  getInspirations() { return this.request<{ inspirations: unknown[] }>('/inspirations'); }
  createInspiration(data: Record<string, unknown>) { return this.request<{ inspiration: unknown }>('/inspirations', { method: 'POST', body: data }); }
  updateInspiration(id: string, data: Record<string, unknown>) { return this.request<{ inspiration: unknown }>(`/inspirations/${id}`, { method: 'PUT', body: data }); }
  deleteInspiration(id: string) { return this.request<{ success: boolean }>(`/inspirations/${id}`, { method: 'DELETE' }); }

  // Projects
  getProjects() { return this.request<{ projects: unknown[] }>('/projects'); }
  createProject(data: Record<string, unknown>) { return this.request<{ project: unknown }>('/projects', { method: 'POST', body: data }); }
  getProject(id: string) { return this.request<{ project: unknown }>(`/projects/${id}`); }
  updateProject(id: string, data: Record<string, unknown>) { return this.request<{ project: unknown }>(`/projects/${id}`, { method: 'PUT', body: data }); }
  deleteProject(id: string) { return this.request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }); }

  // Project tasks
  getProjectTasks(projectId: string) { return this.request<{ tasks: unknown[] }>(`/projects/${projectId}/tasks`); }
  createProjectTask(projectId: string, data: Record<string, unknown>) { return this.request<{ task: unknown }>(`/projects/${projectId}/tasks`, { method: 'POST', body: data }); }

  // Batch move tasks
  batchMoveTasks(taskIds: string[], targetProjectId: string | null) {
    return this.request<{ success: boolean }>('/tasks/batch-move', { method: 'POST', body: { taskIds, targetProjectId } });
  }

  // Habits
  getHabits() { return this.request<{ habits: unknown[] }>('/habits'); }
  getHabitRecords(from: string, to: string) { return this.request<{ habitRecords: unknown[] }>(`/habits/records?from=${from}&to=${to}`); }
  createHabit(data: Record<string, unknown>) { return this.request<{ habit: unknown }>('/habits', { method: 'POST', body: data }); }
  updateHabit(id: string, data: Record<string, unknown>) { return this.request<{ habit: unknown }>(`/habits/${id}`, { method: 'PUT', body: data }); }
  deleteHabit(id: string) { return this.request<{ success: boolean }>(`/habits/${id}`, { method: 'DELETE' }); }
  toggleHabitRecord(data: Record<string, unknown>) { return this.request<{ habitRecord: unknown | null; toggled: boolean }>('/habits/records', { method: 'POST', body: data }); }

  // Sync
  sync(since: string) {
    return this.request<{
      timestamp: string;
      tasks: unknown[];
      notes: unknown[];
      events: unknown[];
      knowledge: unknown[];
      inspirations: unknown[];
      projects: unknown[];
      habits: unknown[];
      habitRecords: unknown[];
    }>(`/sync?since=${encodeURIComponent(since)}`);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/** Thrown when the API is in offline mode — used to skip network calls silently */
export class OfflineError extends Error {
  constructor() {
    super('Offline mode');
    this.name = 'OfflineError';
  }
}

export const api = new ApiClient();
export default api;
