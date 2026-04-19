-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "pairAId" TEXT NOT NULL,
    "pairBId" TEXT,
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
INSERT INTO "new_Match" ("createdAt", "groupId", "id", "pairA2Id", "pairAId", "pairB2Id", "pairBId", "pointsA", "pointsB", "set1A", "set1B", "set2A", "set2B", "set3A", "set3B", "set4A", "set4B", "set5A", "set5B", "winnerId") SELECT "createdAt", "groupId", "id", "pairA2Id", "pairAId", "pairB2Id", "pairBId", "pointsA", "pointsB", "set1A", "set1B", "set2A", "set2B", "set3A", "set3B", "set4A", "set4B", "set5A", "set5B", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
