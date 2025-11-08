import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ensureDatabase } from './utils/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import matchRoutes from './routes/match.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// basic health at root and /api
app.get('/', (_req, res) => res.type('text').send('OK'));
app.get('/api', (_req, res) =>
  res.json({ name: 'Kujuana API', version: '1.0.0', slogan: 'Dating with Intention', status: 'online' })
);

// core middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/payments', paymentRoutes);

// errors
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not Found' }));
app.use(errorHandler);

// start only after DB is ready
start().catch((e) => {
  console.error('Fatal start error:', e);
  process.exit(1);
});

async function start() {
  try {
    await ensureDatabase(); // make this throw on failure
  } catch (e) {
    console.error('DB init failed:', e);
    throw e;
  }
  const server = app.listen(PORT, () => {
    console.log(`Kujuana API listening on ${PORT}`);
  });

  // crash guards
  process.on('unhandledRejection', (r) => console.error('unhandledRejection', r));
  process.on('uncaughtException', (e) => {
    console.error('uncaughtException', e);
    server.close(() => process.exit(1));
  });
}
