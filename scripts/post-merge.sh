#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-spec run codegen

# Apply schema additions. Using psql with DATABASE_URL is simpler and more
# reliable than drizzle-kit push (which prompts on pre-existing constraint changes).
# All statements are idempotent (IF NOT EXISTS / ON CONFLICT).
psql "$DATABASE_URL" <<'SQL'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_ip TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_ip TEXT;
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limit_windows_key_window ON rate_limit_windows (key, window_start);
CREATE INDEX IF NOT EXISTS leads_client_ip_created_at ON leads (client_ip, created_at) WHERE client_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_client_ip_direction_created_at ON messages (client_ip, direction, created_at) WHERE client_ip IS NOT NULL;
SQL
