-- Compatibility persistence for the existing mutable domain services.
-- lms_state is authoritative; Prisma's normalized schema is a future migration target.
CREATE TABLE IF NOT EXISTS lms_state (
  id integer PRIMARY KEY CHECK (id = 1),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notification_outbox (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_outbox_pending ON notification_outbox(created_at) WHERE NOT published;
