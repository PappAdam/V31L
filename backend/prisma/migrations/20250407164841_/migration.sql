/*
  Warnings:

  - You are about to drop the column `authTag` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `inIv` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `outIv` on the `Image` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    "type" TEXT NOT NULL
);
INSERT INTO "new_Image" ("data", "id", "type") SELECT "data", "id", "type" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
