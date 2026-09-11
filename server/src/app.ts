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
import { studentTestsRouter } from './routes/studentTests.js';

dotenv.config();

const app = express();

// Production-safe CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Serverless-safe database initialization middleware (runs BEFORE routes)
app.use(async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err: any) {
    console.error('Database connection failed:', err?.message || err);
    res.status(500).json({ error: 'Database connection failed. Please verify configuration.' });
  }
});

// Create unified API router
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ML V-Lab Server' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/quizzes', quizzesRouter);
apiRouter.use('/notes', notesRouter);
apiRouter.use('/bookmarks', bookmarksRouter);
apiRouter.use('/teacher', teacherRouter);
apiRouter.use('/classes', classesRouter);
apiRouter.use('/student', studentTestsRouter);

// Mount with and without /api prefix for maximum Vercel serverless compatibility
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Centralized safe error handler (does not leak stack traces or internal secrets)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
