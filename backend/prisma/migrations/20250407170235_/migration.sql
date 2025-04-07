/*
  Warnings:

  - Added the required column `type` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeStamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" BLOB NOT NULL,
    "inIv" BLOB NOT NULL,
    "outIv" BLOB NOT NULL,
    "authTag" BLOB NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("authTag", "chatId", "content", "id", "inIv", "outIv", "pinned", "timeStamp", "userId") SELECT "authTag", "chatId", "content", "id", "inIv", "outIv", "pinned", "timeStamp", "userId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
