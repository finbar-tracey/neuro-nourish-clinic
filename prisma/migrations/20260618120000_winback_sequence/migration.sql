-- Win-back re-engagement sequence fields
ALTER TABLE "Lead" ADD COLUMN "winbackEnrolled" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "winbackStatus" TEXT;
ALTER TABLE "Lead" ADD COLUMN "winbackSequenceId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "winbackStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "winbackNextAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "winbackStoppedReason" TEXT;
