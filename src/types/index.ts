export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectType = 'short-term' | 'long-term';
export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface FocusSession {
  /** Accumulated focus duration from completed sessions (milliseconds) */
  totalDuration: number;
  /** History of completed focus sessions */
  sessions: { start: string; end: string; duration: number }[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Planned start date for Gantt chart */
  startDate?: string | null;
  start_date?: string | null;
  dueDate: string | null;
  due_date?: string | null;
  tags?: string[];
  category?: string;
  subtasks?: SubTask[];
  /** Project this task belongs to */
  projectId?: string | null;
  project_id?: string | null;
  /** Parent task for tree hierarchy */
  parentId?: string | null;
  parent_id?: string | null;
  /** Focus session data accumulated over time */
  focusSession?: FocusSession;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  coverColor: string;
  icon?: string;
  tags: string[];
  priority: TaskPriority;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'move';
  entityType: 'project' | 'task';
  entityId: string;
  entityTitle: string;
  description: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
  allDay: boolean;
  all_day?: number;
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Inspiration {
  id: string;
  content: string;
  source?: string;
  tags: string[];
  images?: string[];
  color: string;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type ModuleType = 'dashboard' | 'tasks' | 'projects' | 'notes' | 'knowledge' | 'calendar' | 'data' | 'inspiration' | 'habits' | 'vtuber';

export interface AppSettings {
  primaryHue: number;
  primarySaturation: number;
  sidebarCollapsed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitRecord {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
}

// ── VTuber 工作台数据类型 ──
export type VtuberEntryType =
  | 'topic'
  | 'stream_schedule'
  | 'checklist'
  | 'design_todo'
  | 'gift'
  | 'distribution'
  | 'commerce'
  | 'finance'
  | 'analytics'
  | 'okr';

export interface VtuberEntry {
  id: string;
  type: VtuberEntryType;
  title: string;
  status: string;
  data: Record<string, unknown>;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}
