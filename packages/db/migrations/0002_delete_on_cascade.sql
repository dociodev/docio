-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER NOT NULL,
    "installationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Repository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Repository" ("createdAt", "defaultBranch", "fullName", "githubId", "id", "installationId", "name", "private", "updatedAt") SELECT "createdAt", "defaultBranch", "fullName", "githubId", "id", "installationId", "name", "private", "updatedAt" FROM "Repository";
DROP TABLE "Repository";
ALTER TABLE "new_Repository" RENAME TO "Repository";
CREATE UNIQUE INDEX "Repository_githubId_key" ON "Repository"("githubId");
CREATE UNIQUE INDEX "Repository_installationId_githubId_key" ON "Repository"("installationId", "githubId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
