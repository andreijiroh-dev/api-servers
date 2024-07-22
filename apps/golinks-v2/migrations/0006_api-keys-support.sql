-- CreateTable
CREATE TABLE "SlackBotToken" (
    "teamId" TEXT NOT NULL PRIMARY KEY,
    "enterprise_install" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "site_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_on" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackBotToken_teamId_key" ON "SlackBotToken"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
