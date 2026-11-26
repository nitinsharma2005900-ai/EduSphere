import fs from 'node:fs';
import pg from 'pg';
const file = process.argv[2];
if (!file || !process.env.DATABASE_URL) throw new Error('Usage: DATABASE_URL=… node scripts/restore-backup.mjs backup.json');
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
if (backup.schemaVersion !== 1 || !Array.isArray(backup.payload?.users) || !Array.isArray(backup.payload?.courses)) throw new Error('Invalid backup');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT id FROM lms_state WHERE id = 1 FOR UPDATE');
  await client.query('UPDATE lms_state SET payload = $1::jsonb, updated_at = now() WHERE id = 1', [JSON.stringify(backup.payload)]);
  await client.query('COMMIT');
  console.log('Restored application state. Existing API processes reload it on the next request.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
