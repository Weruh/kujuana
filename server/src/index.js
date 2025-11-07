import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ensureDatabase } from './utils/database.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import matchRoutes from './routes/match.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

ensureDatabase();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

app.get('/', (_, res) => {
  res.json({
    name: 'Kujuana API',
    version: '1.0.0',
    slogan: 'Dating with Intention',
    status: 'online',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/payments', paymentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Kujuana API listening on port ${PORT}`);
});
