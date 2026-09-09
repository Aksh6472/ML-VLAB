import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initDatabase } from './db.js';

const PORT = process.env.PORT || 5001;

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

// Only start listener in non-Vercel environments
if (!process.env.VERCEL) {
  start();
}

export default app;
