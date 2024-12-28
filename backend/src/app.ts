import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { ENV } from './config/environment';

import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors(corsOptions));

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send(`Video Chat Backend is running in ${ENV} mode over HTTPS.`);
});

export default app;