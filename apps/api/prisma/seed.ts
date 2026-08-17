import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

try {
  process.loadEnvFile(path.resolve(__dirname, '../.env'));
} catch {
  // no .env yet — fall back to defaults / already-exported env vars
}

const prisma = new PrismaClient();

// A minimal, valid one-page PDF so the seeded data room has something real to open.
const SAMPLE_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 92>>stream
BT /F1 20 Tf 72 700 Td (Acme Corp. -- Data Room Sample Document) Tj ET
BT /F1 12 Tf 72 670 Td (Seed data) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`,
  'utf-8',
);

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'demo@acme.test' },
    update: {},
    create: { email: 'demo@acme.test', name: 'Demo Owner', passwordHash },
  });

  await prisma.user.upsert({
    where: { email: 'reviewer@acme.test' },
    update: {},
    create: { email: 'reviewer@acme.test', name: 'Demo Reviewer', passwordHash },
  });

  const existingRoom = await prisma.dataRoom.findFirst({ where: { ownerId: owner.id, name: 'Project Falcon — Acquisition' } });
  if (existingRoom) {
    console.log('Seed data already present, skipping.');
    return;
  }

  const room = await prisma.dataRoom.create({
    data: { name: 'Project Falcon — Acquisition', ownerId: owner.id },
  });

  const financials = await prisma.folder.create({
    data: { name: 'Financials', dataRoomId: room.id, path: '/', depth: 0, createdById: owner.id },
  });

  await prisma.folder.create({
    data: {
      name: '2023 Statements',
      dataRoomId: room.id,
      parentId: financials.id,
      path: `/${financials.id}/`,
      depth: 1,
      createdById: owner.id,
    },
  });

  await prisma.folder.create({
    data: { name: 'Legal', dataRoomId: room.id, path: '/', depth: 0, createdById: owner.id },
  });

  const storageDir = path.resolve(process.env.LOCAL_STORAGE_DIR ?? './uploads', room.id);
  await fsp.mkdir(storageDir, { recursive: true });
  const key = `${room.id}/${randomUUID()}`;
  await fsp.writeFile(path.resolve('./uploads', key), SAMPLE_PDF);

  await prisma.file.create({
    data: {
      name: 'Company Overview.pdf',
      size: BigInt(SAMPLE_PDF.byteLength),
      mimeType: 'application/pdf',
      storageKey: key,
      dataRoomId: room.id,
      folderId: null,
      uploaderId: owner.id,
    },
  });

  console.log('Seeded demo account: demo@acme.test / password123');
  console.log('Seeded reviewer account (for testing shares): reviewer@acme.test / password123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
