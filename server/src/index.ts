import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import authRoutes from './auth.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import eventsRoutes from './routes/events.js';
import knowledgeRoutes from './routes/knowledge.js';
import inspirationsRoutes from './routes/inspirations.js';
import syncRoutes from './routes/sync.js';
import { createSyncServer } from './sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/inspirations', inspirationsRoutes);
app.use('/api/sync', syncRoutes);

// Production: serve the built frontend
if (isProduction) {
  const frontendDist = path.resolve(__dirname, '../../dist');
  app.use(express.static(frontendDist));
  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Async startup
async function start() {
  // Initialize database
  await initDatabase();

  // Create WebSocket sync server
  createSyncServer(server);

  server.listen(PORT, () => {
    console.log(`[Server] Ririgannnn API server running on http://localhost:${PORT}`);
    console.log(`[Server] WebSocket sync available at ws://localhost:${PORT}/ws`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
