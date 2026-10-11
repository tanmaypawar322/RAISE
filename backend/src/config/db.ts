import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Ensure User indexes match partial filter specifications
    try {
      const usersColl = conn.connection.db?.collection('users');
      if (usersColl) {
        const indexes = await usersColl.indexes();
        const stalePhone = indexes.find((idx) => idx.name === 'phoneHash_1' && !idx.partialFilterExpression);
        if (stalePhone) {
          await usersColl.dropIndex('phoneHash_1');
          await usersColl.updateMany({ phoneHash: null }, { $unset: { phoneHash: '', phoneEnc: '', phoneMasked: '' } });
          await usersColl.createIndex(
            { phoneHash: 1 },
            {
              name: 'phoneHash_1',
              unique: true,
              partialFilterExpression: { phoneHash: { $type: 'string' } },
              background: true,
            }
          );
          console.log('[Database] Migrated phoneHash_1 index to partial unique index');
        }
      }
    } catch (e: any) {
      console.warn('[Database] Index sync note:', e.message);
    }

    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', (error as Error).message);
    console.warn('[Database] Running without active MongoDB connection. Start MongoDB (e.g. mongod) or configure Atlas MONGODB_URI in .env.');
    return null;
  }
}
