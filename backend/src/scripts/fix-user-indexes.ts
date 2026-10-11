import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function fixUserIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raise_db';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);

  const usersColl = mongoose.connection.db!.collection('users');

  // 1. Drop old non-partial or broken phoneHash index if exists
  try {
    await usersColl.dropIndex('phoneHash_1');
    console.log('Dropped old phoneHash_1 index');
  } catch (err: any) {
    console.log('Note on drop phoneHash_1:', err.message);
  }

  // 2. Unset null phoneHash / emailHash values in existing documents
  const unsetPhone = await usersColl.updateMany(
    { phoneHash: null },
    { $unset: { phoneHash: '', phoneEnc: '', phoneMasked: '' } }
  );
  console.log(`Unset phoneHash on ${unsetPhone.modifiedCount} documents with null phoneHash`);

  const unsetEmail = await usersColl.updateMany(
    { emailHash: null },
    { $unset: { emailHash: '', emailEnc: '' } }
  );
  console.log(`Unset emailHash on ${unsetEmail.modifiedCount} documents with null emailHash`);

  // 3. Create robust partial unique indexes that only index non-null string values
  await usersColl.createIndex(
    { phoneHash: 1 },
    {
      name: 'phoneHash_1',
      unique: true,
      partialFilterExpression: { phoneHash: { $type: 'string' } },
      background: true,
    }
  );
  console.log('Created robust partial unique index on phoneHash');

  try {
    await usersColl.dropIndex('emailHash_1');
  } catch (err: any) {
    console.log('Note on drop emailHash_1:', err.message);
  }

  await usersColl.createIndex(
    { emailHash: 1 },
    {
      name: 'emailHash_1',
      unique: true,
      partialFilterExpression: { emailHash: { $type: 'string' } },
      background: true,
    }
  );
  console.log('Created robust partial unique index on emailHash');

  const indexes = await usersColl.indexes();
  console.log('Current collection indexes:', JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
  console.log('Done fixing user indexes.');
}

fixUserIndexes().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
