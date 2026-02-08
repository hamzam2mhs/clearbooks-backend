import express from 'express';

const app = express();

// Middleware
app.use(express.json());

// Public health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

