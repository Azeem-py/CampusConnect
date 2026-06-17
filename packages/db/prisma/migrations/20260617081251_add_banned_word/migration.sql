-- CreateTable
CREATE TABLE "BannedWord" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "isRegex" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannedWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedWord_pattern_key" ON "BannedWord"("pattern");

-- CreateIndex
CREATE INDEX "BannedWord_pattern_idx" ON "BannedWord"("pattern");
