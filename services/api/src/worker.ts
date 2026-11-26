import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { pool } from './database/persistence';
import { putObject } from './services/storage';
import { config } from './config';

async function start() {
  if (!pool || !process.env.REDIS_URL) throw new Error('Worker requires PostgreSQL and Redis');
  const url = new URL(process.env.REDIS_URL);
  const connection = { host: url.hostname, family: 0, port: Number(url.port || 6379), username: url.username || undefined, password: decodeURIComponent(url.password) || undefined, ...(url.protocol === 'rediss:' ? { tls: {} } : {}) };
  const queue = new Queue('notifications', { connection });
  const worker = new Worker('notifications', async job => {
    const notification = job.data;
    // Store one deterministic object per notification. Repeated deliveries overwrite
    // the same sandbox artifact rather than create duplicate messages.
    await putObject(`email-sandbox/${notification.id}.json`, JSON.stringify(notification), 'application/json');
    if (process.env.SMTP_HOST && notification.email) {
      const transport = nodemailer.createTransport({ host: config.email.host, port: config.email.port, secure: config.email.port === 465,
        ...(config.email.user ? { auth: { user: config.email.user, pass: config.email.pass } } : {}) });
      await transport.sendMail({ from: config.email.from, to: notification.email, subject: notification.title, text: notification.message, messageId: `<${notification.id}@edusphere.demo>` });
    }
    return { archived: true };
  }, { connection, concurrency: 2 });
  worker.on('failed', (job, error) => console.error(JSON.stringify({ event: 'notification_failed', jobId: job?.id, error: error.message })));
  worker.on('error', error => console.error('Worker error:', error.message));
  queue.on('error', error => console.error('Queue error:', error.message));
  await queue.waitUntilReady();
  await worker.waitUntilReady();
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const pending = await pool!.query('SELECT id, payload FROM notification_outbox WHERE NOT published ORDER BY created_at LIMIT 50');
      for (const item of pending.rows) {
        await queue.add('deliver', item.payload, { jobId: item.id, attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: { age: 7 * 86400 }, removeOnFail: { age: 30 * 86400 } });
        await pool!.query('UPDATE notification_outbox SET published = true WHERE id = $1', [item.id]);
      }
      const redis = await queue.getBackend().connection.client;
      await redis.set('edusphere:worker:heartbeat', new Date().toISOString(), { EX: 60 });
      const day = new Date().toISOString().slice(0, 10);
      if (await redis.runCommand('set', [`edusphere:backup:${day}`, 'running', 'EX', 86400, 'NX'])) {
        try {
          const state = await pool!.query('SELECT payload FROM lms_state WHERE id = 1');
          await putObject(`backups/${day}.json`, JSON.stringify({ schemaVersion: 1, createdAt: new Date().toISOString(), payload: state.rows[0].payload }), 'application/json');
          console.log(JSON.stringify({ event: 'backup_complete', day }));
        } catch (error) { await redis.del(`edusphere:backup:${day}`); throw error; }
      }
    } catch (error) { console.error('Worker dispatch error:', (error as Error).message); }
    finally { running = false; }
  };
  await tick();
  const timer = setInterval(() => { void tick(); }, 5000);
  process.on('SIGTERM', () => { clearInterval(timer); void worker.close().then(() => queue.close()).then(() => pool!.end()).then(() => process.exit(0)); });
  console.log('Redis notification worker started; failed jobs retained for recovery.');
}
void start().catch(error => { console.error(error.message); process.exit(1); });
