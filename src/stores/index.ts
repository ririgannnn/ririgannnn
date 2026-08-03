import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Note, CalendarEvent, Inspiration, KnowledgeEntry, AppSettings, ModuleType } from '../types';
import syncEngine from '../services/syncEngine';
import api from '../services/api';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
          id: newId,
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          category: task.category || '',
          dueDate: null,
          createdAt: now,
          updatedAt: now,
          ...task,
        };
        set((s) => ({ tasks: [...s.tasks, newTask] }));

        if (syncInitialized) {
          api.createTask(newTask as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'tasks', action: 'create',
              entityId: newId, data: newTask, timestamp: now,
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
          api.updateTask(id, { ...partial, updated_at: now } as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'tasks', action: 'update',
              entityId: id, data: { ...partial, updated_at: now }, timestamp: now,
            });
          });
        }
      },
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));

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
            dueDate: (d.due_date || d.dueDate || null) as string | null,
            category: (d.category as string) || '',
            tags: Array.isArray(d.tags) ? d.tags as string[] : [],
            createdAt: (d.created_at || d.createdAt || '') as string,
            updatedAt: (d.updated_at || d.updatedAt || '') as string,
          };
          set((s) => {
            if (s.tasks.find((t) => t.id === task.id)) return s;
            return { tasks: [...s.tasks, task] };
          });
        } else {
          set((s) => ({
            tasks: s.tasks.map((t) => t.id === id ? {
              ...t,
              ...(data as Partial<Task>),
              // Normalize server field names
              ...(data as Record<string, unknown>).due_date !== undefined ? { dueDate: (data as Record<string, unknown>).due_date as string } : {},
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
          id: newId,
          title: note.title || '',
          content: note.content || '',
          folder: note.folder || '',
          tags: note.tags || [],
          createdAt: now,
          updatedAt: now,
          ...note,
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
          const d = data as Note;
          set((s) => {
            if (s.notes.find((n) => n.id === d.id)) return s;
            return { notes: [...s.notes, d] };
          });
        } else {
          set((s) => ({
            notes: s.notes.map((n) => n.id === id ? { ...n, ...(data as Partial<Note>) } : n),
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
          id: newId,
          title: event.title || '',
          description: event.description || '',
          allDay: event.allDay ?? false,
          color: event.color || '#3b82f6',
          createdAt: now,
          startDate: event.startDate || event.startTime || now,
          endDate: event.endDate || event.endTime || now,
        };
        const newEvent: CalendarEvent = { ...mergedEvent, ...event };
        set((s) => ({ events: [...s.events, newEvent] }));

        if (syncInitialized) {
          api.createEvent(newEvent as unknown as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'events', action: 'create',
              entityId: newId, data: newEvent, timestamp: now,
            });
          });
        }

        return newEvent;
      },
      updateEvent: (id, partial) => {
        set((s) => ({
          events: s.events.map((e) => e.id === id ? { ...e, ...partial } : e),
        }));

        if (syncInitialized) {
          api.updateEvent(id, partial as Record<string, unknown>).catch(() => {
            syncEngine.addToQueue({
              id: uid(), entity: 'events', action: 'update',
              entityId: id, data: partial, timestamp: new Date().toISOString(),
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
          id: newId,
          content: insp.content || '',
          tags: insp.tags || [],
          color: insp.color || '#6366f1',
          createdAt: now,
          ...insp,
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
          const d = data as Inspiration;
          set((s) => {
            if (s.inspirations.find((i) => i.id === d.id)) return s;
            return { inspirations: [...s.inspirations, d] };
          });
        } else {
          set((s) => ({
            inspirations: s.inspirations.map((i) => i.id === id ? { ...i, ...(data as Partial<Inspiration>) } : i),
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
          id: newId,
          title: entry.title || '',
          content: entry.content || '',
          category: entry.category || '',
          tags: entry.tags || [],
          createdAt: now,
          updatedAt: now,
          ...entry,
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
          const d = data as KnowledgeEntry;
          set((s) => {
            if (s.knowledge.find((k) => k.id === d.id)) return s;
            return { knowledge: [...s.knowledge, d] };
          });
        } else {
          set((s) => ({
            knowledge: s.knowledge.map((k) => k.id === id ? { ...k, ...(data as Partial<KnowledgeEntry>) } : k),
          }));
        }
      },

      // === Sync ===
      initSync: async (token: string) => {
        await syncEngine.start(token);

        // Load cached data into store
        const cache = await syncEngine.getLocalCache();
        const batchApply = get();

        if (cache.tasks?.length) batchApply.setTasks(cache.tasks as Task[]);
        if (cache.notes?.length) batchApply.setNotes(cache.notes as Note[]);
        if (cache.events?.length) batchApply.setEvents(cache.events as CalendarEvent[]);
        if (cache.inspirations?.length) batchApply.setInspirations(cache.inspirations as Inspiration[]);
        if (cache.knowledge?.length) batchApply.setKnowledge(cache.knowledge as KnowledgeEntry[]);

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
          };

          batchMethods[entity]?.(id, action, data);
        });

        syncInitialized = true;
      },

      stopSync: () => {
        syncEngine.stop();
        syncInitialized = false;
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
