-- CreateTable
CREATE TABLE "DiscordInviteLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordInviteLink_slug_key" ON "DiscordInviteLink"("slug");
