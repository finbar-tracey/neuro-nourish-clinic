-- CSV cold-lead import metadata on leads
ALTER TABLE "Lead" ADD COLUMN "importBatchId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "importCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lawfulBasis" TEXT;
ALTER TABLE "Lead" ADD COLUMN "importedAt" DATETIME;
