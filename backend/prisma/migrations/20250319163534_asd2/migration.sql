/*
  Warnings:

  - You are about to alter the column `key` on the `ChatMember` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "key" BLOB NOT NULL,
    CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChatMember" ("chatId", "id", "key", "userId") SELECT "chatId", "id", "key", "userId" FROM "ChatMember";
DROP TABLE "ChatMember";
ALTER TABLE "new_ChatMember" RENAME TO "ChatMember";
CREATE UNIQUE INDEX "ChatMember_userId_chatId_key" ON "ChatMember"("userId", "chatId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
