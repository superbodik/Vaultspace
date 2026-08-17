import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

try {
  process.loadEnvFile(path.resolve(__dirname, '../.env'));
} catch {
  // no .env yet — fall back to defaults / already-exported env vars
}

const dataDir = path.resolve(__dirname, '../.pgdata');
const port = Number(process.env.PGLITE_PORT ?? 5432);
const host = process.env.PGLITE_HOST ?? '127.0.0.1';

async function main() {
  const db = new PGlite(dataDir);
  await db.waitReady;

  const server = new PGLiteSocketServer({ db, port, host });
  await server.start();

  console.log(`[dev-db] Postgres-compatible PGlite server listening on ${host}:${port}`);
  console.log(`[dev-db] data directory: ${dataDir}`);
  console.log('[dev-db] connection string: postgresql://postgres:postgres@127.0.0.1:' + port + '/dataroom');

  const shutdown = async () => {
    console.log('\n[dev-db] shutting down...');
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[dev-db] failed to start', err);
  process.exit(1);
});
