import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

import routes from './routes';
import productRoute from './routes/productRoute';
import usersRoute from './routes/userRoute';
import orderRoute from './routes/orderRoute';
import paymentRoute from './routes/paymentRoute';

// Import Redis to initialize it
import { checkRedisHealth } from './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads',  (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
},express.static(path.resolve('uploads')));

app.use('/api', routes);
app.use('/api/products', productRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/orders', orderRoute); 

app.get('/', (req, res) => {
  res.json({
    message: 'Simple E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      users: '/api/users',
      orders: '/api/orders',
      health: '/api/health'
    }
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = http.createServer(app);

// --- WebSocket server setup ----
import WebSocket, { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ server });
let clients: Set<WebSocket> = new Set();
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});
export function broadcast(message: string) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
// --- End WebSocket server setup ---

import './listener';

server.listen(PORT, async () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔗 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check Redis health on startup
  await checkRedisHealth();
});

export { server };
