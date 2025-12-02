-- CreateTable
CREATE TABLE "Episode" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "View" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "View_slug_fkey" FOREIGN KEY ("slug") REFERENCES "Episode" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_slug_fkey" FOREIGN KEY ("slug") REFERENCES "Episode" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "View_slug_idx" ON "View"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "View_slug_sessionId_key" ON "View"("slug", "sessionId");

-- CreateIndex
CREATE INDEX "Like_slug_idx" ON "Like"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Like_slug_sessionId_key" ON "Like"("slug", "sessionId");
