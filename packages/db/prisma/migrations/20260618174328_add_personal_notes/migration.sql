-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NOTE_SHARE';

-- CreateTable
CREATE TABLE "PersonalNote" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteAccess" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'READ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalNote_userId_idx" ON "PersonalNote"("userId");

-- CreateIndex
CREATE INDEX "PersonalNote_updatedAt_idx" ON "PersonalNote"("updatedAt");

-- CreateIndex
CREATE INDEX "NoteAccess_userId_idx" ON "NoteAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteAccess_noteId_userId_key" ON "NoteAccess"("noteId", "userId");

-- AddForeignKey
ALTER TABLE "PersonalNote" ADD CONSTRAINT "PersonalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteAccess" ADD CONSTRAINT "NoteAccess_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "PersonalNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteAccess" ADD CONSTRAINT "NoteAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
