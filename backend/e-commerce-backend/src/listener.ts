import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database';
import { broadcast } from './index';

const startListener = async () => {
  const client = await pool.connect();

  try {
    await client.query('LISTEN new_order');

    client.on('notification', (msg) => {
      if (msg.channel === 'new_order') {
        console.log('Received new order notification:', msg.payload);
        broadcast(msg.payload || 'New order received');
      }
    });

    console.log('Database listener active on "new_order" channel');
  } catch (err) {
    console.error('Error setting up DB listener:', err);
  }
};

startListener();
