import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './backend/config/env';
import { router } from './backend/routes';

const app = express();

// Security & Parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// Start Server
app.listen(env.PORT, () => {
  console.log(`
  🚀 PROVIDENCIA SERVER RUNNING
  -----------------------------
  Port: ${env.PORT}
  Env:  ${env.NODE_ENV}
  DB:   SQLite (Prisma)
  -----------------------------
  `);
});