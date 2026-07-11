-- Speed-to-lead, attribution, revenue visibility, at-risk tracking
ALTER TABLE "Lead" ADD COLUMN "attributionChannel" TEXT;
ALTER TABLE "Lead" ADD COLUMN "firstResponseAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "responseTimeMinutes" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "conversationStarted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "estimatedCommission" INTEGER;
