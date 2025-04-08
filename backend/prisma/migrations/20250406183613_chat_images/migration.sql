/*
  Warnings:

  - Added the required column `chatImgId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chatImgId" TEXT NOT NULL,
    "lastMessageId" TEXT,
    CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chat" ("id", "lastMessageId", "name") SELECT "id", "lastMessageId", "name" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
CREATE UNIQUE INDEX "Chat_lastMessageId_key" ON "Chat"("lastMessageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
