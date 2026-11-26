import { Pool, PoolClient } from 'pg';
import { RequestHandler } from 'express';
import { MemoryDataStore } from './store';

// The existing services use mutable collections. A single-row transaction and a local
// mutex make those operations atomic, including across API replicas. This deliberately
// trades throughput for preserving the existing application without a domain rewrite.
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 })
  : null;
let tail: Promise<void> = Promise.resolve();

export async function initializePersistence() {
  if (!pool) {
    if (process.env.NODE_ENV === 'production') throw new Error('PostgreSQL is required in production');
    return;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS lms_state (
    id integer PRIMARY KEY CHECK (id = 1),
    payload jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query('INSERT INTO lms_state(id, payload) VALUES (1, $1::jsonb) ON CONFLICT DO NOTHING',
    [JSON.stringify(MemoryDataStore.getInstance().snapshot())]);
  await pool.query(`CREATE TABLE IF NOT EXISTS notification_outbox (
    id text PRIMARY KEY, payload jsonb NOT NULL, published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS notification_outbox_pending ON notification_outbox(created_at) WHERE NOT published');
}

export const persistentRequest: RequestHandler = (req, res, next) => {
  if (!pool) return next();
  const previous = tail;
  let unlock!: () => void;
  tail = new Promise<void>(resolve => { unlock = resolve; });
  void (async () => {
    await previous;
    let client: PoolClient | undefined;
    let finished = false;
    const finish = async (commit: boolean) => {
      if (finished) return;
      finished = true;
      try {
        if (client) {
          if (commit) {
            const db = MemoryDataStore.getInstance();
            await client.query('UPDATE lms_state SET payload = $1::jsonb, updated_at = now() WHERE id = 1',
              [JSON.stringify(db.snapshot())]);
            for (const notification of db.notifications) {
              const email = db.users.find(user => user.id === notification.userId)?.email;
              await client.query('INSERT INTO notification_outbox(id, payload) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING',
                [notification.id, JSON.stringify({ ...notification, email })]);
            }
          }
          await client.query(commit ? 'COMMIT' : 'ROLLBACK');
        }
      } catch (error) {
        await client?.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client?.release();
        unlock();
      }
    };
    try {
      if (res.destroyed) { unlock(); return; }
      client = await pool.connect();
      await client.query('BEGIN');
      const result = await client.query('SELECT payload FROM lms_state WHERE id = 1 FOR UPDATE');
      MemoryDataStore.getInstance().restore(result.rows[0].payload);
      const json = res.json.bind(res);
      res.json = ((body: unknown) => {
        void finish(res.statusCode < 400).then(() => json(body)).catch(() => {
          res.status(503);
          json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Unable to save changes. Please retry.' } });
        });
        return res;
      }) as typeof res.json;
      res.once('close', () => { void finish(false).catch(console.error); });
      next();
    } catch (error) {
      await finish(false).catch(console.error);
      next(error);
    }
  })();
};
