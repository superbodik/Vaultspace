import path from 'node:path';
import * as fs from 'node:fs';
import { Client } from 'pg';

// prisma migrate dev/deploy relies on Prisma's Rust schema-engine, which
// (as of pg-socket 0.2.x) speaks a stricter subset of the wire protocol than
// PGlite's embedded socket server implements, so it fails to connect to our
// local dev database. This script applies the same generated migration.sql
// files with the plain `pg` driver instead (which PGlite handles fine),
// tracking what's already applied so it's safe to re-run.
// Against a real Postgres (staging/production) just use `npm run db:migrate:deploy`.

try {
  process.loadEnvFile(path.resolve(__dirname, '../.env'));
} catch {
  // no .env yet
}

const migrationsDir = path.resolve(__dirname, '../prisma/migrations');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_dataroom_migrations" (
      "name" TEXT PRIMARY KEY,
      "applied_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await client.query('SELECT name FROM "_dataroom_migrations"')).rows.map((r) => r.name),
  );

  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const name of entries) {
    if (applied.has(name)) {
      console.log(`[migrate] skipping already-applied ${name}`);
      continue;
    }
    const sqlPath = path.join(migrationsDir, name, 'migration.sql');
    if (!fs.existsSync(sqlPath)) continue;

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log(`[migrate] applying ${name}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO "_dataroom_migrations" (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  console.log('[migrate] up to date');
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});
