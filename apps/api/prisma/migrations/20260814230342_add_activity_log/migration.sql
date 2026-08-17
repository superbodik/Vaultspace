-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('UPLOADED', 'VIEWED', 'DOWNLOADED', 'RENAMED', 'MOVED', 'DELETED', 'CREATED_FOLDER', 'SHARED', 'REVOKED_SHARE');

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "actorId" TEXT,
    "viaShareId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "resourceType" "ShareResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_dataRoomId_createdAt_idx" ON "ActivityEvent"("dataRoomId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_viaShareId_fkey" FOREIGN KEY ("viaShareId") REFERENCES "Share"("id") ON DELETE SET NULL ON UPDATE CASCADE;

