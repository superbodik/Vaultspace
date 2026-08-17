import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Uses the pg driver adapter (plain node-postgres wire protocol) instead of
// Prisma's bundled Rust query engine, which isn't fully compatible with the
// embedded PGlite server used for zero-install local dev (see prisma/README notes).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // PGlite's embedded socket server only reliably handles one connection at a
    // time; capping the pool avoids it dropping concurrent connections mid-query.
    // A real Postgres in staging/production has no such limitation.
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
