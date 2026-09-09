import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from '../server/src/db.js';
import { authRouter } from '../server/src/routes/auth.js';
import { progressRouter } from '../server/src/routes/progress.js';
import { quizzesRouter } from '../server/src/routes/quizzes.js';
import { notesRouter } from '../server/src/routes/notes.js';
import { bookmarksRouter } from '../server/src/routes/bookmarks.js';
import { teacherRouter } from '../server/src/routes/teacher.js';
import { classesRouter } from '../server/src/routes/classes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Lazy database initialization for serverless invocations
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize DB in Vercel function:', err);
    }
  }
  next();
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/classes', classesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ML V-Lab Vercel API' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
