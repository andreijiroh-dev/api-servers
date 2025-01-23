-- CreateTable
CREATE TABLE "WikiLinks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WikiLinks_slug_key" ON "WikiLinks"("slug");
