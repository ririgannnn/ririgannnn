import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Note, CalendarEvent, Inspiration, KnowledgeEntry, AppSettings, ModuleType, SubTask, FocusSession, Project, TaskPriority, Habit, HabitRecord, VtuberEntry } from '../types';
import syncEngine from '../services/syncEngine';
import api from '../services/api';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ── Timer runtime state (in-memory, NOT persisted) ──
export interface TimerState {
  taskId: string;
  taskTitle: string;
  startTime: number;
  accumulatedMs: number;
  isPaused: boolean;
  tick: number;
}

// Parse tags from various formats (array, JSON string, undefined)
function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[];
  if (typeof tags === 'string') {
    try { return JSON.parse(tags) as string[]; } catch { return []; }
  }
  return [];
}

// Parse images from various formats (array, JSON string, undefined)
function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return images as string[];
  if (typeof images === 'string') {
    try { return JSON.parse(images) as string[]; } catch { return []; }
  }
  return [];
}

// Parse subtasks from various formats (array, JSON string, undefined)
function parseSubtasks(subtasks: unknown): SubTask[] {
  if (Array.isArray(subtasks)) return subtasks as SubTask[];
  if (typeof subtasks === 'string') {
    try { return JSON.parse(subtasks) as SubTask[]; } catch { return []; }
  }
  return [];
}

// Parse focusSession from various formats
function parseFocusSession(data: unknown): FocusSession | undefined {
  if (!data) return undefined;
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as FocusSession;
  }
  if (typeof data === 'string') {
    try { return JSON.parse(data) as FocusSession; } catch { return undefined; }
  }
  return undefined;
}

// Track if sync engine is initialized
let syncInitialized = false;

interface AppState {
  // Navigation
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;

  // Settings (local only, not synced)
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, partial: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  batchApplyTask: (id: string, action: string, data: unknown) => void;

  // Notes
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Partial<Note>) => Note;
  updateNote: (id: string, partial: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  batchApplyNote: (id: string, action: string, data: unknown) => void;

  // Calendar
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: Partial<CalendarEvent>) => CalendarEvent;
  updateEvent: (id: string, partial: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  batchApplyEvent: (id: string, action: string, data: unknown) => void;

  // Inspiration
  inspirations: Inspiration[];
  setInspirations: (items: Inspiration[]) => void;
  addInspiration: (insp: Partial<Inspiration>) => Inspiration;
  deleteInspiration: (id: string) => void;
  batchApplyInspiration: (id: string, action: string, data: unknown) => void;

  // Knowledge
  knowledge: KnowledgeEntry[];
  setKnowledge: (items: KnowledgeEntry[]) => void;
  addKnowledge: (entry: Partial<KnowledgeEntry>) => KnowledgeEntry;
  updateKnowledge: (id: string, partial: Partial<KnowledgeEntry>) => void;
  deleteKnowledge: (id: string) => void;
  batchApplyKnowledge: (id: string, action: string, data: unknown) => void;

  // Sync initialization
  initSync: (token: string) => Promise<void>;
  stopSync: () => void;

  // ── Focus Timer (runtime, not persisted) ──
  activeTimer: TimerState | null;
  startTimer: (taskId: string, taskTitle: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  addManualFocusSession: (taskId: string, durationMs: number, date?: string) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, partial: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  batchApplyProject: (id: string, action: string, data: unknown) => void;

  // Project navigation
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // Habits
  habits: Habit[];
  habitRecords: HabitRecord[];
  setHabits: (habits: Habit[]) => void;
  setHabitRecords: (records: HabitRecord[]) => void;
  addHabit: (habit: Partial<Habit>) => Habit;
  updateHabit: (id: string, partial: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitRecord: (habitId: string, date: string) => void;
  batchApplyHabit: (id: string, action: string, data: unknown) => void;

  // VTuber entries
  vtuberEntries: VtuberEntry[];
  setVtuberEntries: (entries: VtuberEntry[]) => void;
  addVtuberEntry: (entry: Partial<VtuberEntry>) => VtuberEntry;
  updateVtuberEntry: (id: string, partial: Partial<VtuberEntry>) => void;
  deleteVtuberEntry: (id: string) => void;
  batchApplyVtuberEntry: (id: string, action: string, data: unknown) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeModule: 'dashboard',
      setActiveModule: (m) => set({ activeModule: m }),

      settings: { primaryHue: 220, primarySaturation: 52, sidebarCollapsed: false },
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      // === Tasks ===
      tasks: [],
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newTask: Task = {
          ...task,
          id: task.id || newId,
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          category: task.category || '',
          startDate: task.startDate ?? null,
          dueDate: task.dueDate ?? null,
          subtasks: parseSubtasks(task.subtasks),
          focusSession: parseFocusSession(task.focusSession),
          projectId: (task as any).projectId ?? task.projectId ?? null,
          parentId: (task as any).parentId ?? task.parentId ?? null,
          createdAt: task.createdAt || now,
          updatedAt: task.updatedAt || now,
        };
        set((s) => ({ tasks: [...s.tasks, newTask] }));

        if (syncInitialized) {
          // Map camelCase → snake_case for API compatibility
          const apiPayload: Record<string, unknown> = {
            ...newTask,
            project_id: newTask.projectId,
            parent_id: newTask.parentId,
            start_date: newTask.startDate,
            due_date: newTask.dueDate,
            focus_session: newTask.focusSession ? JSON.stringify(newTask.focusSession) : JSON.stringify({ totalDuration: 0, sessions: [] }),
            subtasks: JSON.stringify(newTask.subtasks || []),
            updated_at: newTask.updatedAt,
            created_at: newTask.createdAt,
          };
          api.createTask(apiPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'tasks', action: 'create',
              entityId: newId, data: apiPayload, timestamp: now,
            });
          });
        }

        return newTask;
      },
      updateTask: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, ...partial, updatedAt: now } : t),
        }));

        if (syncInitialized) {
          // Map camelCase → snake_case for API compatibility
          const apiPayload: Record<string, unknown> = { ...partial, updated_at: now };
          if (partial.projectId !== undefined) apiPayload.project_id = partial.projectId;
          if (partial.parentId !== undefined) apiPayload.parent_id = partial.parentId;
          if (partial.dueDate !== undefined) apiPayload.due_date = partial.dueDate;
          if (partial.startDate !== undefined) apiPayload.start_date = partial.startDate;
          if (partial.focusSession !== undefined) apiPayload.focus_session = JSON.stringify(partial.focusSession);
          if (partial.subtasks !== undefined) apiPayload.subtasks = JSON.stringify(partial.subtasks);
          api.updateTask(id, apiPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'tasks', action: 'update',
              entityId: id, data: apiPayload, timestamp: now,
            });
          });
        }
      },
      deleteTask: (id) => {
        set((s) => {
          // Cascade: collect all descendant task IDs
          const toDelete = new Set<string>();
          const collectDescendants = (parentId: string) => {
            s.tasks.forEach((t) => {
              if (t.parentId === parentId) {
                toDelete.add(t.id);
                collectDescendants(t.id);
              }
            });
          };
          toDelete.add(id);
          collectDescendants(id);
          return { tasks: s.tasks.filter((t) => !toDelete.has(t.id)) };
        });

        if (syncInitialized) {
          api.deleteTask(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'tasks', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyTask: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const task: Task = {
            id: d.id as string,
            title: d.title as string,
            description: (d.description as string) || '',
            status: (d.status as Task['status']) || 'todo',
            priority: (d.priority as Task['priority']) || 'medium',
            startDate: (d.start_date || d.startDate || null) as string | null,
            dueDate: (d.due_date || d.dueDate || null) as string | null,
            category: (d.category as string) || '',
            tags: Array.isArray(d.tags) ? d.tags as string[] : [],
            subtasks: parseSubtasks(d.subtasks),
            projectId: (d.project_id || d.projectId || null) as string | null,
            parentId: (d.parent_id || d.parentId || null) as string | null,
            focusSession: parseFocusSession(d.focusSession ?? d.focus_session),
            createdAt: (d.created_at || d.createdAt || '') as string,
            updatedAt: (d.updated_at || d.updatedAt || '') as string,
          };
          set((s) => {
            if (s.tasks.find((t) => t.id === task.id)) return s;
            return { tasks: [...s.tasks, task] };
          });
        } else {
          const d = data as Record<string, unknown>;
          set((s) => ({
            tasks: s.tasks.map((t) => t.id === id ? {
              ...t,
              ...(d.title !== undefined ? { title: d.title as string } : {}),
              ...(d.description !== undefined ? { description: d.description as string } : {}),
              ...(d.status !== undefined ? { status: d.status as Task['status'] } : {}),
              ...(d.priority !== undefined ? { priority: d.priority as Task['priority'] } : {}),
              ...(d.start_date !== undefined || d.startDate !== undefined ? { startDate: (d.start_date || d.startDate) as string | null } : {}),
              ...(d.due_date !== undefined ? { dueDate: d.due_date as string | null } : {}),
              ...(d.category !== undefined ? { category: d.category as string } : {}),
              ...(d.subtasks !== undefined ? { subtasks: parseSubtasks(d.subtasks) } : {}),
              ...(d.project_id !== undefined || d.projectId !== undefined ? { projectId: (d.project_id || d.projectId) as string | null } : {}),
              ...(d.parent_id !== undefined || d.parentId !== undefined ? { parentId: (d.parent_id || d.parentId) as string | null } : {}),
              ...(d.focusSession !== undefined || d.focus_session !== undefined ? { focusSession: parseFocusSession(d.focusSession ?? d.focus_session) } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : t),
          }));
        }
      },

      // === Notes ===
      notes: [],
      setNotes: (notes) => set({ notes }),
      addNote: (note) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newNote: Note = {
          ...note,
          id: note.id || newId,
          title: note.title || '',
          content: note.content || '',
          folder: note.folder || '',
          tags: parseTags(note.tags),
          images: parseImages(note.images),
          createdAt: note.createdAt || now,
          updatedAt: note.updatedAt || now,
        };
        set((s) => ({ notes: [...s.notes, newNote] }));

        if (syncInitialized) {
          api.createNote(newNote as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'notes', action: 'create',
              entityId: newId, data: newNote, timestamp: now,
            });
          });
        }

        return newNote;
      },
      updateNote: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          notes: s.notes.map((n) => n.id === id ? { ...n, ...partial, updatedAt: now } : n),
        }));

        if (syncInitialized) {
          api.updateNote(id, { ...partial, updated_at: now } as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'notes', action: 'update',
              entityId: id, data: { ...partial, updated_at: now }, timestamp: now,
            });
          });
        }
      },
      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));

        if (syncInitialized) {
          api.deleteNote(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'notes', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyNote: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const note: Note = {
            id: (d.id as string) || id,
            title: (d.title as string) || '',
            content: (d.content as string) || '',
            folder: (d.folder as string) || '',
            tags: parseTags(d.tags),
            images: parseImages(d.images),
            createdAt: (d.createdAt || d.created_at || '') as string,
            updatedAt: (d.updatedAt || d.updated_at || '') as string,
          };
          set((s) => {
            if (s.notes.find((n) => n.id === note.id)) return s;
            return { notes: [...s.notes, note] };
          });
        } else {
          const d = data as Record<string, unknown>;
          set((s) => ({
            notes: s.notes.map((n) => n.id === id ? {
              ...n,
              ...(d.title !== undefined ? { title: d.title as string } : {}),
              ...(d.content !== undefined ? { content: d.content as string } : {}),
              ...(d.folder !== undefined ? { folder: d.folder as string } : {}),
              ...(d.tags !== undefined ? { tags: parseTags(d.tags) } : {}),
              ...(d.images !== undefined ? { images: parseImages(d.images) } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : n),
          }));
        }
      },

      // === Events ===
      events: [],
      setEvents: (events) => set({ events }),
      addEvent: (event) => {
        const newId = uid();
        const now = new Date().toISOString();
        const mergedEvent: CalendarEvent = {
          ...event,
          id: event.id || newId,
          title: event.title || '',
          description: event.description || '',
          allDay: event.allDay ?? false,
          color: event.color || '#3b82f6',
          createdAt: event.createdAt || now,
          startDate: event.startDate || event.startTime || now,
          endDate: event.endDate || event.endTime || now,
        };
        set((s) => ({ events: [...s.events, mergedEvent] }));

        if (syncInitialized) {
          const eventPayload: Record<string, unknown> = {
            ...mergedEvent,
            start_time: mergedEvent.startDate,
            end_time: mergedEvent.endDate,
            all_day: mergedEvent.allDay,
          };
          api.createEvent(eventPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'events', action: 'create',
              entityId: mergedEvent.id, data: eventPayload, timestamp: now,
            });
          });
        }

        return mergedEvent;
      },
      updateEvent: (id, partial) => {
        set((s) => ({
          events: s.events.map((e) => e.id === id ? { ...e, ...partial } : e),
        }));

        if (syncInitialized) {
          const eventPayload: Record<string, unknown> = { ...partial };
          if (partial.startDate !== undefined) eventPayload.start_time = partial.startDate;
          if (partial.endDate !== undefined) eventPayload.end_time = partial.endDate;
          if (partial.allDay !== undefined) eventPayload.all_day = partial.allDay;
          api.updateEvent(id, eventPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'events', action: 'update',
              entityId: id, data: eventPayload, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));

        if (syncInitialized) {
          api.deleteEvent(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'events', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyEvent: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const event: CalendarEvent = {
            id: d.id as string,
            title: d.title as string,
            description: (d.description as string) || '',
            startDate: (d.start_time || d.startTime || d.startDate || '') as string,
            endDate: (d.end_time || d.endTime || d.endDate || '') as string,
            allDay: !!(d.all_day ?? d.allDay),
            color: (d.color as string) || '#3b82f6',
            createdAt: (d.created_at || d.createdAt || '') as string,
          };
          set((s) => {
            if (s.events.find((e) => e.id === event.id)) return s;
            return { events: [...s.events, event] };
          });
        } else {
          set((s) => ({
            events: s.events.map((e) => e.id === id ? { ...e, ...(data as Partial<CalendarEvent>) } : e),
          }));
        }
      },

      // === Inspirations ===
      inspirations: [],
      setInspirations: (items) => set({ inspirations: items }),
      addInspiration: (insp) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newInsp: Inspiration = {
          ...insp,
          id: insp.id || newId,
          content: insp.content || '',
          tags: parseTags(insp.tags),
          images: parseImages(insp.images),
          color: insp.color || '#6366f1',
          createdAt: insp.createdAt || now,
        };
        set((s) => ({ inspirations: [...s.inspirations, newInsp] }));

        if (syncInitialized) {
          api.createInspiration(newInsp as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'inspirations', action: 'create',
              entityId: newId, data: newInsp, timestamp: now,
            });
          });
        }

        return newInsp;
      },
      deleteInspiration: (id) => {
        set((s) => ({ inspirations: s.inspirations.filter((i) => i.id !== id) }));

        if (syncInitialized) {
          api.deleteInspiration(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'inspirations', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyInspiration: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ inspirations: s.inspirations.filter((i) => i.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const insp: Inspiration = {
            id: (d.id as string) || id,
            content: (d.content as string) || '',
            tags: parseTags(d.tags),
            images: parseImages(d.images),
            color: (d.color as string) || '#6366f1',
            createdAt: (d.createdAt || d.created_at || '') as string,
          };
          set((s) => {
            if (s.inspirations.find((i) => i.id === insp.id)) return s;
            return { inspirations: [...s.inspirations, insp] };
          });
        } else {
          const d = data as Record<string, unknown>;
          set((s) => ({
            inspirations: s.inspirations.map((i) => i.id === id ? {
              ...i,
              ...(d.content !== undefined ? { content: d.content as string } : {}),
              ...(d.tags !== undefined ? { tags: parseTags(d.tags) } : {}),
              ...(d.images !== undefined ? { images: parseImages(d.images) } : {}),
              ...(d.color !== undefined ? { color: d.color as string } : {}),
            } : i),
          }));
        }
      },

      // === Knowledge ===
      knowledge: [],
      setKnowledge: (items) => set({ knowledge: items }),
      addKnowledge: (entry) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newEntry: KnowledgeEntry = {
          ...entry,
          id: entry.id || newId,
          title: entry.title || '',
          content: entry.content || '',
          category: entry.category || '',
          tags: parseTags(entry.tags),
          images: parseImages(entry.images),
          createdAt: entry.createdAt || now,
          updatedAt: entry.updatedAt || now,
        };
        set((s) => ({ knowledge: [...s.knowledge, newEntry] }));

        if (syncInitialized) {
          api.createKnowledge(newEntry as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'knowledge', action: 'create',
              entityId: newId, data: newEntry, timestamp: now,
            });
          });
        }

        return newEntry;
      },
      updateKnowledge: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          knowledge: s.knowledge.map((k) => k.id === id ? { ...k, ...partial, updatedAt: now } : k),
        }));

        if (syncInitialized) {
          api.updateKnowledge(id, { ...partial, updated_at: now } as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'knowledge', action: 'update',
              entityId: id, data: { ...partial, updated_at: now }, timestamp: now,
            });
          });
        }
      },
      deleteKnowledge: (id) => {
        set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) }));

        if (syncInitialized) {
          api.deleteKnowledge(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'knowledge', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyKnowledge: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ knowledge: s.knowledge.filter((k) => k.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const entry: KnowledgeEntry = {
            id: (d.id as string) || id,
            title: (d.title as string) || '',
            content: (d.content as string) || '',
            category: (d.category as string) || '',
            tags: parseTags(d.tags),
            images: parseImages(d.images),
            createdAt: (d.createdAt || d.created_at || '') as string,
            updatedAt: (d.updatedAt || d.updated_at || '') as string,
          };
          set((s) => {
            if (s.knowledge.find((k) => k.id === entry.id)) return s;
            return { knowledge: [...s.knowledge, entry] };
          });
        } else {
          const d = data as Record<string, unknown>;
          set((s) => ({
            knowledge: s.knowledge.map((k) => k.id === id ? {
              ...k,
              ...(d.title !== undefined ? { title: d.title as string } : {}),
              ...(d.content !== undefined ? { content: d.content as string } : {}),
              ...(d.category !== undefined ? { category: d.category as string } : {}),
              ...(d.tags !== undefined ? { tags: parseTags(d.tags) } : {}),
              ...(d.images !== undefined ? { images: parseImages(d.images) } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : k),
          }));
        }
      },

      // === Projects ===
      projects: [],
      setProjects: (projects) => set({ projects }),
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      addProject: (project) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newProject: Project = {
          id: project.id || newId,
          name: project.name || '',
          description: project.description || '',
          type: project.type || 'short-term',
          status: project.status || 'active',
          startDate: project.startDate ?? null,
          endDate: project.endDate ?? null,
          coverColor: project.coverColor || '#3b82f6',
          icon: project.icon || '',
          tags: parseTags(project.tags),
          priority: project.priority || 'medium',
          createdAt: project.createdAt || now,
          updatedAt: project.updatedAt || now,
        };
        set((s) => ({ projects: [...s.projects, newProject] }));

        if (syncInitialized) {
          const projectPayload: Record<string, unknown> = {
            ...newProject,
            start_date: newProject.startDate,
            end_date: newProject.endDate,
            cover_color: newProject.coverColor,
          };
          api.createProject(projectPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'projects', action: 'create',
              entityId: newId, data: projectPayload, timestamp: now,
            });
          });
        }

        return newProject;
      },
      updateProject: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          projects: s.projects.map((p) => p.id === id ? { ...p, ...partial, updatedAt: now } : p),
        }));

        if (syncInitialized) {
          const projectPayload: Record<string, unknown> = { ...partial, updated_at: now };
          if (partial.startDate !== undefined) projectPayload.start_date = partial.startDate;
          if (partial.endDate !== undefined) projectPayload.end_date = partial.endDate;
          if (partial.coverColor !== undefined) projectPayload.cover_color = partial.coverColor;
          api.updateProject(id, projectPayload).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'projects', action: 'update',
              entityId: id, data: projectPayload, timestamp: now,
            });
          });
        }
      },
      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));

        if (syncInitialized) {
          api.deleteProject(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'projects', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      batchApplyProject: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const project: Project = {
            id: (d.id as string) || id,
            name: (d.name as string) || '',
            description: (d.description as string) || '',
            type: ((d.type as string) || 'short-term') as Project['type'],
            status: ((d.status as string) || 'active') as Project['status'],
            startDate: (d.start_date || d.startDate || null) as string | null,
            endDate: (d.end_date || d.endDate || null) as string | null,
            coverColor: (d.cover_color || d.coverColor || '#3b82f6') as string,
            icon: (d.icon as string) || '',
            tags: parseTags(d.tags),
            priority: ((d.priority as string) || 'medium') as TaskPriority,
            createdAt: (d.created_at || d.createdAt || '') as string,
            updatedAt: (d.updated_at || d.updatedAt || '') as string,
          };
          set((s) => {
            if (s.projects.find((p) => p.id === project.id)) return s;
            return { projects: [...s.projects, project] };
          });
        } else {
          const d = data as Record<string, unknown>;
          set((s) => ({
            projects: s.projects.map((p) => p.id === id ? {
              ...p,
              ...(d.name !== undefined ? { name: d.name as string } : {}),
              ...(d.description !== undefined ? { description: d.description as string } : {}),
              ...(d.type !== undefined ? { type: d.type as Project['type'] } : {}),
              ...(d.status !== undefined ? { status: d.status as Project['status'] } : {}),
              ...(d.start_date !== undefined || d.startDate !== undefined ? { startDate: (d.start_date || d.startDate) as string | null } : {}),
              ...(d.end_date !== undefined || d.endDate !== undefined ? { endDate: (d.end_date || d.endDate) as string | null } : {}),
              ...(d.cover_color !== undefined || d.coverColor !== undefined ? { coverColor: (d.cover_color || d.coverColor) as string } : {}),
              ...(d.icon !== undefined ? { icon: d.icon as string } : {}),
              ...(d.tags !== undefined ? { tags: parseTags(d.tags) } : {}),
              ...(d.priority !== undefined ? { priority: d.priority as TaskPriority } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : p),
          }));
        }
      },

      // === Habits ===
      habits: [],
      habitRecords: [],
      setHabits: (habits) => set({ habits }),
      setHabitRecords: (habitRecords) => set({ habitRecords }),
      addHabit: (habit) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newHabit: Habit = {
          ...habit,
          id: habit.id || newId,
          name: habit.name || '',
          color: habit.color || '#99a7bc',
          createdAt: habit.createdAt || now,
          updatedAt: habit.updatedAt || now,
        };
        set((s) => ({ habits: [...s.habits, newHabit] }));

        if (syncInitialized) {
          api.createHabit(newHabit as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'habits', action: 'create',
              entityId: newId, data: newHabit, timestamp: now,
            });
          });
        }

        return newHabit;
      },
      updateHabit: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          habits: s.habits.map((h) => h.id === id ? { ...h, ...partial, updatedAt: now } : h),
        }));

        if (syncInitialized) {
          api.updateHabit(id, { ...partial, updated_at: now } as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'habits', action: 'update',
              entityId: id, data: { ...partial, updated_at: now }, timestamp: now,
            });
          });
        }
      },
      deleteHabit: (id) => {
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          habitRecords: s.habitRecords.filter((r) => r.habitId !== id),
        }));

        if (syncInitialized) {
          api.deleteHabit(id).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'habits', action: 'delete',
              entityId: id, data: null, timestamp: new Date().toISOString(),
            });
          });
        }
      },
      toggleHabitRecord: (habitId, date) => {
        const existing = get().habitRecords.find((r) => r.habitId === habitId && r.date === date);
        const now = new Date().toISOString();

        if (existing) {
          set((s) => ({
            habitRecords: s.habitRecords.filter((r) => r.id !== existing.id),
          }));
        } else {
          const newRecord: HabitRecord = {
            id: uid(),
            habitId,
            date,
            createdAt: now,
          };
          set((s) => ({ habitRecords: [...s.habitRecords, newRecord] }));
        }

        if (syncInitialized) {
          const payload = { habit_id: habitId, date, id: uid() };
          api.toggleHabitRecord(payload).catch(() => {
            if (existing) {
              set((s) => ({ habitRecords: [...s.habitRecords, existing] }));
            } else {
              set((s) => ({ habitRecords: s.habitRecords.filter((r) => r.habitId !== habitId || r.date !== date) }));
            }
          });
        }
      },
      batchApplyHabit: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({
            habits: s.habits.filter((h) => h.id !== id),
            habitRecords: s.habitRecords.filter((r) => r.habitId !== id),
          }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const habit: Habit = {
            id: (d.id as string) || id,
            name: (d.name as string) || '',
            color: (d.color as string) || '#99a7bc',
            createdAt: (d.createdAt || d.created_at || '') as string,
            updatedAt: (d.updatedAt || d.updated_at || '') as string,
          };
          set((s) => {
            if (s.habits.find((h) => h.id === habit.id)) return s;
            return { habits: [...s.habits, habit] };
          });
        } else if (action === 'update') {
          const d = data as Record<string, unknown>;
          set((s) => ({
            habits: s.habits.map((h) => h.id === id ? {
              ...h,
              ...(d.name !== undefined ? { name: d.name as string } : {}),
              ...(d.color !== undefined ? { color: d.color as string } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : h),
          }));
        } else if (action === 'createRecord') {
          const d = data as Record<string, unknown>;
          const record: HabitRecord = {
            id: (d.id as string) || uid(),
            habitId: (d.habit_id || d.habitId || '') as string,
            date: (d.date as string) || '',
            createdAt: (d.createdAt || d.created_at || '') as string,
          };
          set((s) => {
            if (s.habitRecords.find((r) => r.id === record.id)) return s;
            return { habitRecords: [...s.habitRecords, record] };
          });
        } else if (action === 'deleteRecord') {
          set((s) => ({ habitRecords: s.habitRecords.filter((r) => r.id !== id) }));
        }
      },

      // === VTuber entries ===
      vtuberEntries: [],
      setVtuberEntries: (vtuberEntries) => set({ vtuberEntries }),

      addVtuberEntry: (entry) => {
        const newId = uid();
        const now = new Date().toISOString();
        const newEntry: VtuberEntry = {
          id: entry.id || newId,
          type: entry.type || 'topic',
          title: entry.title || '',
          status: entry.status || '',
          data: entry.data || {},
          tags: entry.tags || [],
          sortOrder: entry.sortOrder || 0,
          createdAt: entry.createdAt || now,
          updatedAt: entry.updatedAt || now,
        };
        set((s) => ({ vtuberEntries: [...s.vtuberEntries, newEntry] }));
        const apiPayload: Record<string, unknown> = {
          ...newEntry,
          data: JSON.stringify(newEntry.data),
          tags: JSON.stringify(newEntry.tags),
        };
        api.createVtuberEntry(apiPayload).catch(() => {
          syncEngine.addToQueue({
            id: uid(), entity: 'vtuberEntries', action: 'create',
            entityId: newEntry.id, data: apiPayload, timestamp: now,
          });
        });
        return newEntry;
      },

      updateVtuberEntry: (id, partial) => {
        const now = new Date().toISOString();
        set((s) => ({
          vtuberEntries: s.vtuberEntries.map((e) => e.id === id ? { ...e, ...partial, updatedAt: now } : e),
        }));
        const apiPayload: Record<string, unknown> = { ...partial };
        if (partial.data) apiPayload.data = JSON.stringify(partial.data);
        if (partial.tags) apiPayload.tags = JSON.stringify(partial.tags);
        api.updateVtuberEntry(id, apiPayload).catch(() => {
          syncEngine.addToQueue({
            id: uid(), entity: 'vtuberEntries', action: 'update',
            entityId: id, data: apiPayload, timestamp: now,
          });
        });
      },

      deleteVtuberEntry: (id) => {
        set((s) => ({ vtuberEntries: s.vtuberEntries.filter((e) => e.id !== id) }));
        api.deleteVtuberEntry(id).catch(() => {
          syncEngine.addToQueue({
            id: uid(), entity: 'vtuberEntries', action: 'delete',
            entityId: id, data: { id }, timestamp: new Date().toISOString(),
          });
        });
      },

      batchApplyVtuberEntry: (id, action, data) => {
        if (action === 'delete') {
          set((s) => ({ vtuberEntries: s.vtuberEntries.filter((e) => e.id !== id) }));
        } else if (action === 'create') {
          const d = data as Record<string, unknown>;
          const parseData = (raw: unknown) => {
            if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
            if (typeof raw === 'string') { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; } }
            return {};
          };
          const parseTags = (raw: unknown) => {
            if (Array.isArray(raw)) return raw as string[];
            if (typeof raw === 'string') { try { return JSON.parse(raw) as string[]; } catch { return []; } }
            return [];
          };
          const entry: VtuberEntry = {
            id: (d.id as string) || uid(),
            type: (d.type as VtuberEntry['type']) || 'topic',
            title: (d.title as string) || '',
            status: (d.status as string) || '',
            data: (d.data as Record<string, unknown>) || parseData(d.data),
            tags: parseTags(d.tags),
            sortOrder: (d.sort_order ?? d.sortOrder ?? 0) as number,
            createdAt: (d.createdAt || d.created_at || '') as string,
            updatedAt: (d.updatedAt || d.updated_at || '') as string,
          };
          set((s) => {
            if (s.vtuberEntries.find((e) => e.id === entry.id)) return s;
            return { vtuberEntries: [...s.vtuberEntries, entry] };
          });
        } else if (action === 'update') {
          const d = data as Record<string, unknown>;
          const parseData = (raw: unknown) => {
            if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
            if (typeof raw === 'string') { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; } }
            return undefined;
          };
          set((s) => ({
            vtuberEntries: s.vtuberEntries.map((e) => e.id === id ? {
              ...e,
              ...(d.title !== undefined ? { title: d.title as string } : {}),
              ...(d.status !== undefined ? { status: d.status as string } : {}),
              ...(d.type !== undefined ? { type: d.type as VtuberEntry['type'] } : {}),
              ...(d.data !== undefined ? { data: parseData(d.data) || e.data } : {}),
              ...(d.tags !== undefined ? { tags: (Array.isArray(d.tags) ? d.tags : (typeof d.tags === 'string' ? JSON.parse(d.tags) : e.tags)) as string[] } : {}),
              ...(d.sort_order ?? d.sortOrder !== undefined ? { sortOrder: (d.sort_order ?? d.sortOrder) as number } : {}),
              ...(d.updatedAt || d.updated_at ? { updatedAt: (d.updatedAt || d.updated_at) as string } : {}),
            } : e),
          }));
        }
      },

      initSync: async (token: string) => {
        await syncEngine.start(token);

        // Load cached data into store, normalizing any old cached data
        const cache = await syncEngine.getLocalCache();
        const batchApply = get();

        if (cache.tasks?.length) {
          batchApply.setTasks(cache.tasks.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            title: (t.title as string) || '',
            description: (t.description as string) || '',
            status: (t.status as Task['status']) || 'todo',
            priority: (t.priority as Task['priority']) || 'medium',
            startDate: (t.startDate ?? t.start_date ?? null) as string | null,
            dueDate: (t.dueDate ?? t.due_date ?? null) as string | null,
            category: (t.category as string) || '',
            tags: parseTags(t.tags),
            subtasks: parseSubtasks(t.subtasks),
            projectId: (t.projectId ?? t.project_id ?? null) as string | null,
            parentId: (t.parentId ?? t.parent_id ?? null) as string | null,
            focusSession: parseFocusSession(t.focusSession ?? t.focus_session),
            createdAt: (t.createdAt || t.created_at || '') as string,
            updatedAt: (t.updatedAt || t.updated_at || '') as string,
          }) as Task[]));
        }
        if (cache.notes?.length) {
          batchApply.setNotes(cache.notes.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            title: (n.title as string) || '',
            content: (n.content as string) || '',
            folder: (n.folder as string) || '',
            tags: parseTags(n.tags),
            images: parseImages(n.images),
            createdAt: (n.createdAt || n.created_at || '') as string,
            updatedAt: (n.updatedAt || n.updated_at || '') as string,
          }) as Note[]));
        }
        if (cache.events?.length) {
          batchApply.setEvents(cache.events.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: (e.title as string) || '',
            description: (e.description as string) || '',
            startDate: (e.startDate || e.start_time || '') as string,
            endDate: (e.endDate || e.end_time || '') as string,
            allDay: !!(e.allDay ?? e.all_day),
            color: (e.color as string) || '#3b82f6',
            createdAt: (e.createdAt || e.created_at || '') as string,
          }) as CalendarEvent[]));
        }
        if (cache.inspirations?.length) {
          batchApply.setInspirations(cache.inspirations.map((i: Record<string, unknown>) => ({
            id: i.id as string,
            content: (i.content as string) || '',
            tags: parseTags(i.tags),
            images: parseImages(i.images),
            color: (i.color as string) || '#6366f1',
            createdAt: (i.createdAt || i.created_at || '') as string,
          }) as Inspiration[]));
        }
        if (cache.knowledge?.length) {
          batchApply.setKnowledge(cache.knowledge.map((k: Record<string, unknown>) => ({
            id: k.id as string,
            title: (k.title as string) || '',
            content: (k.content as string) || '',
            category: (k.category as string) || '',
            tags: parseTags(k.tags),
            images: parseImages(k.images),
            createdAt: (k.createdAt || k.created_at || '') as string,
            updatedAt: (k.updatedAt || k.updated_at || '') as string,
          }) as KnowledgeEntry[]));
        }
        if (cache.projects?.length) {
          batchApply.setProjects(cache.projects.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: (p.name as string) || '',
            description: (p.description as string) || '',
            type: ((p.type as string) || 'short-term') as Project['type'],
            status: ((p.status as string) || 'active') as Project['status'],
            startDate: (p.startDate || p.start_date || null) as string | null,
            endDate: (p.endDate || p.end_date || null) as string | null,
            coverColor: (p.coverColor || p.cover_color || '#3b82f6') as string,
            icon: (p.icon as string) || '',
            tags: parseTags(p.tags),
            priority: ((p.priority as string) || 'medium') as TaskPriority,
            createdAt: (p.createdAt || p.created_at || '') as string,
            updatedAt: (p.updatedAt || p.updated_at || '') as string,
          }) as Project[]));
        }
        if (cache.habits?.length) {
          batchApply.setHabits(cache.habits.map((h: Record<string, unknown>) => ({
            id: h.id as string,
            name: (h.name as string) || '',
            color: (h.color as string) || '#99a7bc',
            createdAt: (h.createdAt || h.created_at || '') as string,
            updatedAt: (h.updatedAt || h.updated_at || '') as string,
          }) as Habit[]));
        }
        if (cache.habitRecords?.length) {
          batchApply.setHabitRecords(cache.habitRecords.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            habitId: (r.habitId || r.habit_id || '') as string,
            date: (r.date as string) || '',
            createdAt: (r.createdAt || r.created_at || '') as string,
          }) as HabitRecord[]));
        }
        if (cache.vtuberEntries?.length) {
          batchApply.setVtuberEntries(cache.vtuberEntries.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            type: (e.type as VtuberEntry['type']) || 'topic',
            title: (e.title as string) || '',
            status: (e.status as string) || '',
            data: typeof e.data === 'object' && e.data !== null ? e.data as Record<string, unknown> : {},
            tags: parseTags(e.tags),
            sortOrder: (e.sortOrder ?? e.sort_order ?? 0) as number,
            createdAt: (e.createdAt || e.created_at || '') as string,
            updatedAt: (e.updatedAt || e.updated_at || '') as string,
          }) as VtuberEntry[]));
        }

        // Listen for WebSocket updates
        syncEngine.onDataChange((entity, action, data) => {
          const id = (data as Record<string, string>)?.id;
          if (!id) return;

          const apply = get();
          const batchMethods: Record<string, (id: string, action: string, data: unknown) => void> = {
            tasks: apply.batchApplyTask,
            notes: apply.batchApplyNote,
            events: apply.batchApplyEvent,
            inspirations: apply.batchApplyInspiration,
            knowledge: apply.batchApplyKnowledge,
            projects: apply.batchApplyProject,
            habits: apply.batchApplyHabit,
            vtuberEntries: apply.batchApplyVtuberEntry,
          };

          batchMethods[entity]?.(id, action, data);
        });

        syncInitialized = true;
      },

      stopSync: () => {
        syncEngine.stop();
        syncInitialized = false;
      },

      // ── Focus Timer ──
      activeTimer: null,

      startTimer: (taskId, taskTitle) => {
        const current = get().activeTimer;
        if (current && current.taskId !== taskId) {
          get().stopTimer();
        }
        if (current && current.taskId === taskId && !current.isPaused) return;
        if (current && current.taskId === taskId && current.isPaused) {
          get().resumeTimer();
          return;
        }
        set({
          activeTimer: {
            taskId,
            taskTitle,
            startTime: Date.now(),
            accumulatedMs: 0,
            isPaused: false,
            tick: 0,
          },
        });
      },

      pauseTimer: () => {
        const current = get().activeTimer;
        if (!current || current.isPaused) return;
        set({
          activeTimer: {
            ...current,
            accumulatedMs: Date.now() - current.startTime + current.accumulatedMs,
            isPaused: true,
          },
        });
      },

      resumeTimer: () => {
        const current = get().activeTimer;
        if (!current || !current.isPaused) return;
        set({
          activeTimer: {
            ...current,
            startTime: Date.now(),
            isPaused: false,
          },
        });
      },

      stopTimer: () => {
        const current = get().activeTimer;
        if (!current) return;
        const duration = current.isPaused
          ? current.accumulatedMs
          : Date.now() - current.startTime + current.accumulatedMs;
        set({ activeTimer: null });
        if (duration > 1000) {
          const { tasks, updateTask } = get();
          const task = tasks.find((t) => t.id === current.taskId);
          if (task) {
            const now = new Date().toISOString();
            const newSession = {
              start: new Date(Date.now() - duration).toISOString(),
              end: now,
              duration,
            };
            const currentTotal = task.focusSession?.totalDuration ?? 0;
            const currentSessions = task.focusSession?.sessions ?? [];
            const updated: FocusSession = {
              totalDuration: currentTotal + duration,
              sessions: [...currentSessions, newSession],
            };
            updateTask(current.taskId, { focusSession: updated });
          }
        }
      },

      resetTimer: () => {
        const current = get().activeTimer;
        if (!current) return;
        set({
          activeTimer: {
            ...current,
            startTime: Date.now(),
            accumulatedMs: 0,
            isPaused: false,
          },
        });
      },

      tickTimer: () => {
        const current = get().activeTimer;
        if (!current || current.isPaused) return;
        set({ activeTimer: { ...current, tick: current.tick + 1 } });
      },

      addManualFocusSession: (taskId, durationMs, date) => {
        const { tasks, updateTask } = get();
        const task = tasks.find((t) => t.id === taskId);
        if (!task || durationMs <= 0) return;
        const sessionDate = date ? new Date(date) : new Date();
        const end = sessionDate.toISOString();
        const start = new Date(sessionDate.getTime() - durationMs).toISOString();
        const newSession = { start, end, duration: durationMs };
        const currentTotal = task.focusSession?.totalDuration ?? 0;
        const currentSessions = task.focusSession?.sessions ?? [];
        const updated: FocusSession = {
          totalDuration: currentTotal + durationMs,
          sessions: [...currentSessions, newSession],
        };
        updateTask(taskId, { focusSession: updated });
      },
    }),
    {
      name: 'personal-workspace',
      partialize: (state) => ({
        settings: state.settings,
        activeModule: state.activeModule,
      }),
    }
  )
);
