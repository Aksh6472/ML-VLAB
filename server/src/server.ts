import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { authRouter } from './routes/auth.js';
import { progressRouter } from './routes/progress.js';
import { quizzesRouter } from './routes/quizzes.js';
import { notesRouter } from './routes/notes.js';
import { bookmarksRouter } from './routes/bookmarks.js';
import { teacherRouter } from './routes/teacher.js';
import { classesRouter } from './routes/classes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/classes', classesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ML V-Lab Server' });
});

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 ML V-Lab Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

start();
