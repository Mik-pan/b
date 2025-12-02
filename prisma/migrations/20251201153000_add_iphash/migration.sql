-- AlterTable
ALTER TABLE "Like" ADD COLUMN "ipHash" TEXT;

-- AlterTable
ALTER TABLE "View" ADD COLUMN "ipHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Like_slug_ipHash_key" ON "Like"("slug", "ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "View_slug_ipHash_key" ON "View"("slug", "ipHash");
