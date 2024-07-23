-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GitHubOAuthChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "code" TEXT,
    "metadata" TEXT NOT NULL,
    "username" TEXT,
    "userId" TEXT,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL,
    "expires_on" DATETIME NOT NULL
);
INSERT INTO "new_GitHubOAuthChallenge" ("challenge", "code", "id", "metadata", "userId", "username") SELECT "challenge", "code", "id", "metadata", "userId", "username" FROM "GitHubOAuthChallenge";
DROP TABLE "GitHubOAuthChallenge";
ALTER TABLE "new_GitHubOAuthChallenge" RENAME TO "GitHubOAuthChallenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
