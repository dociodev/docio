-- DropIndex
DROP INDEX "Domain_repositoryId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");
