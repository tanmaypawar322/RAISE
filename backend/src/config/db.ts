import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', (error as Error).message);
    console.warn('[Database] Running without active MongoDB connection. Start MongoDB (e.g. mongod) or configure Atlas MONGODB_URI in .env.');
    return null;
  }
}
