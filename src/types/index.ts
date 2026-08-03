export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  due_date?: string | null;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
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
  color: string;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export type ModuleType = 'dashboard' | 'tasks' | 'notes' | 'knowledge' | 'calendar' | 'data' | 'inspiration';

export interface AppSettings {
  primaryHue: number;
  primarySaturation: number;
  sidebarCollapsed: boolean;
}
