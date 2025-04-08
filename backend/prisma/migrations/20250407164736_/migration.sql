/*
  Warnings:

  - Added the required column `authTag` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    "inIv" BLOB,
    "outIv" BLOB NOT NULL,
    "authTag" BLOB NOT NULL,
    "type" TEXT NOT NULL
);
INSERT INTO "new_Image" ("data", "id", "inIv", "outIv", "type") SELECT "data", "id", "inIv", "outIv", "type" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
