-- Operational layer: owner, queue, next action, callback SLA, priority call tracking
ALTER TABLE "Lead" ADD COLUMN "owner" TEXT NOT NULL DEFAULT 'Daniel';
ALTER TABLE "Lead" ADD COLUMN "operationalQueue" TEXT NOT NULL DEFAULT 'NEW_LEAD';
ALTER TABLE "Lead" ADD COLUMN "nextAction" TEXT;
ALTER TABLE "Lead" ADD COLUMN "nextActionAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "callbackDueAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "priorityCallSlot" TEXT;
ALTER TABLE "Lead" ADD COLUMN "priorityCallBookedAt" DATETIME;
