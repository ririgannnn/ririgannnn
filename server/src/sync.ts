import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, AuthUser } from './auth.js';
import type { Server } from 'http';

// User room: userId -> Set of WebSocket connections
const rooms = new Map<string, Set<WebSocket>>();

export function createSyncServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    // Extract token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing auth token');
      return;
    }

    let user: AuthUser;
    try {
      user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    // Join user's room
    if (!rooms.has(user.id)) {
      rooms.set(user.id, new Set());
    }
    rooms.get(user.id)!.add(ws);

    console.log(`[WS] User ${user.username} connected (${rooms.get(user.id)!.size} sessions)`);

    // Send initial connected message
    ws.send(JSON.stringify({ type: 'connected', userId: user.id }));

    ws.on('close', () => {
      const userRoom = rooms.get(user.id);
      if (userRoom) {
        userRoom.delete(ws);
        if (userRoom.size === 0) {
          rooms.delete(user.id);
        }
      }
      console.log(`[WS] User ${user.username} disconnected`);
    });

    ws.on('error', () => {
      // Handle silently
    });
  });

  console.log('[WS] Sync server initialized on /ws');
  return wss;
}

// Broadcast a change to all other connected sessions of the same user
export function broadcastChange(
  userId: string,
  entity: string,
  action: 'create' | 'update' | 'delete',
  data: unknown
): void {
  const userRoom = rooms.get(userId);
  if (!userRoom || userRoom.size === 0) return;

  const message = JSON.stringify({
    type: 'change',
    entity,
    action,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const ws of userRoom) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
