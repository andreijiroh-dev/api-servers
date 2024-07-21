-- AlterTable
ALTER TABLE "DiscordInviteLink" ADD COLUMN "deactivation_reason" TEXT;

-- AlterTable
ALTER TABLE "GoLink" ADD COLUMN "deactivation_reason" TEXT;

-- AlterTable
ALTER TABLE "WikiLinks" ADD COLUMN "deactivation_reason" TEXT;
