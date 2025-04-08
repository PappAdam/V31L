/*
  Warnings:

  - You are about to drop the column `iv` on the `Image` table. All the data in the column will be lost.
  - Added the required column `outIv` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    "inIv" BLOB,
    "outIv" BLOB NOT NULL,
    "type" TEXT NOT NULL
);
INSERT INTO "new_Image" ("data", "id", "type") SELECT "data", "id", "type" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
