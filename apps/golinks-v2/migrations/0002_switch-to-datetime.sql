-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL DEFAULT 'https://wiki.andreijiroh.xyz/golinks',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL
);
INSERT INTO "new_GoLink" ("created_on", "id", "is_active", "slug", "targetUrl", "updated_on") SELECT "created_on", "id", "is_active", "slug", "targetUrl", "updated_on" FROM "GoLink";
DROP TABLE "GoLink";
ALTER TABLE "new_GoLink" RENAME TO "GoLink";
CREATE UNIQUE INDEX "GoLink_slug_key" ON "GoLink"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
