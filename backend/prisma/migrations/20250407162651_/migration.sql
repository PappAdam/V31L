-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "authKey" BLOB,
    "iv" BLOB,
    "authTag" BLOB,
    "profilePictureId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chatImgId" TEXT NOT NULL,
    "lastMessageId" TEXT,
    CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeStamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" BLOB NOT NULL,
    "inIv" BLOB NOT NULL,
    "outIv" BLOB NOT NULL,
    "authTag" BLOB NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "key" BLOB NOT NULL,
    CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_lastMessageId_key" ON "Chat"("lastMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_userId_chatId_key" ON "ChatMember"("userId", "chatId");
