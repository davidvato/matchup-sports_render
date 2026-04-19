/*
  Warnings:

  - The primary key for the `Tournament` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Tournament` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bracket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bracket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "groupId" TEXT,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Pair_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pair_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "pairAId" TEXT NOT NULL,
    "pairBId" TEXT NOT NULL,
    "pairA2Id" TEXT,
    "pairB2Id" TEXT,
    "winnerId" TEXT,
    "pointsA" INTEGER NOT NULL DEFAULT 0,
    "pointsB" INTEGER NOT NULL DEFAULT 0,
    "set1A" INTEGER NOT NULL DEFAULT 0,
    "set1B" INTEGER NOT NULL DEFAULT 0,
    "set2A" INTEGER NOT NULL DEFAULT 0,
    "set2B" INTEGER NOT NULL DEFAULT 0,
    "set3A" INTEGER NOT NULL DEFAULT 0,
    "set3B" INTEGER NOT NULL DEFAULT 0,
    "set4A" INTEGER NOT NULL DEFAULT 0,
    "set4B" INTEGER NOT NULL DEFAULT 0,
    "set5A" INTEGER NOT NULL DEFAULT 0,
    "set5B" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_pairBId_fkey" FOREIGN KEY ("pairBId") REFERENCES "Pair" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_pairAId_fkey" FOREIGN KEY ("pairAId") REFERENCES "Pair" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_pairA2Id_fkey" FOREIGN KEY ("pairA2Id") REFERENCES "Pair" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_pairB2Id_fkey" FOREIGN KEY ("pairB2Id") REFERENCES "Pair" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BracketMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "pairAId" TEXT,
    "pairBId" TEXT,
    "winnerId" TEXT,
    "pointsA" INTEGER NOT NULL DEFAULT 0,
    "pointsB" INTEGER NOT NULL DEFAULT 0,
    "set1A" INTEGER NOT NULL DEFAULT 0,
    "set1B" INTEGER NOT NULL DEFAULT 0,
    "set2A" INTEGER NOT NULL DEFAULT 0,
    "set2B" INTEGER NOT NULL DEFAULT 0,
    "set3A" INTEGER NOT NULL DEFAULT 0,
    "set3B" INTEGER NOT NULL DEFAULT 0,
    "set4A" INTEGER NOT NULL DEFAULT 0,
    "set4B" INTEGER NOT NULL DEFAULT 0,
    "set5A" INTEGER NOT NULL DEFAULT 0,
    "set5B" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextMatchId" TEXT,
    CONSTRAINT "BracketMatch_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BracketMatch_pairAId_fkey" FOREIGN KEY ("pairAId") REFERENCES "Pair" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BracketMatch_pairBId_fkey" FOREIGN KEY ("pairBId") REFERENCES "Pair" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "points" INTEGER NOT NULL,
    "pairId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "Pair" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "sport" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" INTEGER NOT NULL,
    CONSTRAINT "Tournament_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("creatorId", "id", "name", "sport") SELECT "creatorId", "id", "name", "sport" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Pair_categoryId_name_key" ON "Pair"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Match_groupId_pairAId_pairBId_key" ON "Match"("groupId", "pairAId", "pairBId");
