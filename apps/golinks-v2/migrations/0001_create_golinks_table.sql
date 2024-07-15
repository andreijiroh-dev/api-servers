-- CreateTable
CREATE TABLE "GoLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL DEFAULT 'https://wiki.andreijiroh.xyz/golinks',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_on" TEXT NOT NULL,
    "updated_on" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GoLink_slug_key" ON "GoLink"("slug");

