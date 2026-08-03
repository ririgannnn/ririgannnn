import api, { ApiError } from './api';

const DB_NAME = 'ririgannnn_cache';
const DB_VERSION = 1;
const STORES = ['tasks', 'notes', 'events', 'knowledge', 'inspirations'] as const;
const QUEUE_STORE = 'sync_queue';

type EntityType = typeof STORES[number];

interface QueuedChange {
  id: string;
  entity: EntityType;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data: unknown;
  timestamp: string;
}

type SyncCallback = (entity: EntityType, action: string, data: unknown) => void;

class SyncEngine {
  private db: IDBDatabase | null = null;
  private ws: WebSocket | null = null;
  private listeners: SyncCallback[] = [];
  private isOnline = navigator.onLine;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private lastSyncTimestamp: string = '1970-01-01T00:00:00.000Z';
  private wsReconnectCount = 0;
  private wsReconnectMax = 5;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // === IndexedDB ===

  async initCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        // Entity stores (keyed by id)
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private dbPut(storeName: string, item: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not initialized')); return; }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private dbDelete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not initialized')); return; }
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private dbGetAll(storeName: string): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not initialized')); return; }
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all cached data
  async getLocalCache(): Promise<Record<EntityType, unknown[]>> {
    const result = {} as Record<EntityType, unknown[]>;
    for (const store of STORES) {
      result[store] = await this.dbGetAll(store);
    }
    return result;
  }

  // === Sync Queue ===

  async addToQueue(change: QueuedChange): Promise<void> {
    await this.dbPut(QUEUE_STORE, change);
  }

  async getQueue(): Promise<QueuedChange[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not initialized')); return; }
      const tx = this.db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('DB not initialized')); return; }
      const tx = this.db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // === Server sync ===

  async pullFromServer(): Promise<void> {
    try {
      const data = await api.sync(this.lastSyncTimestamp);
      this.lastSyncTimestamp = data.timestamp;

      // Update local cache with server data
      for (const store of STORES) {
        const items = data[store] as Record<string, unknown>[];
        if (!items || items.length === 0) continue;

        for (const item of items) {
          const deleted = item['deleted_at'];
          if (deleted) {
            await this.dbDelete(store, item['id'] as string);
          } else {
            await this.dbPut(store, item);
          }
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return; // Not authenticated
      console.warn('[Sync] Pull failed:', err);
    }
  }

  async pushQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    for (const change of queue) {
      try {
        const method = this.getApiMethod(change.entity);

        if (change.action === 'delete') {
          await method.delete(change.entityId);
        } else if (change.action === 'create') {
          await method.create(change.data as Record<string, unknown>);
        } else if (change.action === 'update') {
          await method.update(change.entityId, change.data as Record<string, unknown>);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) break; // Stop on auth error
        console.warn(`[Sync] Failed to push ${change.entity}/${change.action}:`, err);
        // Keep in queue for retry
        return;
      }
    }

    // All pushed successfully, clear queue
    await this.clearQueue();
    // Pull fresh data after pushing
    await this.pullFromServer();
  }

  private getApiMethod(entity: EntityType) {
    switch (entity) {
      case 'tasks':
        return {
          create: (data: Record<string, unknown>) => api.createTask(data),
          update: (id: string, data: Record<string, unknown>) => api.updateTask(id, data),
          delete: (id: string) => api.deleteTask(id),
        };
      case 'notes':
        return {
          create: (data: Record<string, unknown>) => api.createNote(data),
          update: (id: string, data: Record<string, unknown>) => api.updateNote(id, data),
          delete: (id: string) => api.deleteNote(id),
        };
      case 'events':
        return {
          create: (data: Record<string, unknown>) => api.createEvent(data),
          update: (id: string, data: Record<string, unknown>) => api.updateEvent(id, data),
          delete: (id: string) => api.deleteEvent(id),
        };
      case 'knowledge':
        return {
          create: (data: Record<string, unknown>) => api.createKnowledge(data),
          update: (id: string, data: Record<string, unknown>) => api.updateKnowledge(id, data),
          delete: (id: string) => api.deleteKnowledge(id),
        };
      case 'inspirations':
        return {
          create: (data: Record<string, unknown>) => api.createInspiration(data),
          update: (id: string, data: Record<string, unknown>) => api.updateInspiration(id, data),
          delete: (id: string) => api.deleteInspiration(id),
        };
    }
  }

  async fullSync(): Promise<void> {
    await this.pushQueue();
    await this.pullFromServer();
  }

  // === WebSocket ===

  connectWebSocket(token: string) {
    // In production, use same-origin WebSocket. In dev, use env var or fallback to localhost.
    let wsUrl: string;
    if (import.meta.env.PROD) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws');
    }
    const url = `${wsUrl}?token=${encodeURIComponent(token)}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected to sync server');
      this.wsReconnectCount = 0; // Reset on successful connection
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'change') {
          const { entity, action, data } = msg;

          // Update local cache
          if (action === 'delete') {
            await this.dbDelete(entity, data.id);
          } else {
            await this.dbPut(entity, data);
          }

          // Notify listeners
          this.listeners.forEach((cb) => cb(entity, action, data));
        }
      } catch (err) {
        console.warn('[WS] Message parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      // Limit reconnection attempts to prevent infinite loops on mobile
      if (this.wsReconnectCount < this.wsReconnectMax) {
        this.wsReconnectCount++;
        const delay = Math.min(5000 * this.wsReconnectCount, 30000); // Exponential backoff
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.wsReconnectCount}/${this.wsReconnectMax})`);
        this.wsReconnectTimer = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CLOSED || !this.ws) {
            this.connectWebSocket(token);
          }
        }, delay);
      } else {
        console.warn('[WS] Max reconnection attempts reached, giving up');
      }
    };

    this.ws.onerror = () => {
      // Will trigger onclose
    };
  }

  disconnectWebSocket() {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    this.wsReconnectCount = this.wsReconnectMax; // Prevent reconnection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // === Listeners ===

  onDataChange(callback: SyncCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // === Network handlers ===

  private async handleOnline() {
    console.log('[Sync] Back online, syncing...');
    this.isOnline = true;
    await this.fullSync();
  }

  private handleOffline() {
    console.log('[Sync] Offline');
    this.isOnline = false;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // === Lifecycle ===

  async start(token: string) {
    this.wsReconnectCount = 0; // Reset reconnection counter on new start
    await this.initCache();
    this.connectWebSocket(token);

    // Pull initial data
    await this.pullFromServer();

    // Periodic sync (every 30 seconds)
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.fullSync();
      }
    }, 30000);
  }

  stop() {
    this.disconnectWebSocket();
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
