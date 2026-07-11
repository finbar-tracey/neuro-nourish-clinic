-- NeuroNourish clinical CRM fields — decouple from legacy loan column overloading

ALTER TABLE "Lead" ADD COLUMN "funnelStage" TEXT NOT NULL DEFAULT 'quiz_partial';
ALTER TABLE "Lead" ADD COLUMN "quizScore" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "primaryConcern" TEXT;
ALTER TABLE "Lead" ADD COLUMN "segment" TEXT;
ALTER TABLE "Lead" ADD COLUMN "revenueEur" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "pipelineValueEur" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "discoveryBookedAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "assessmentPaidAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "creditExpiryDate" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "enrolledAt" DATETIME;

-- Backfill funnelStage from legacy qualificationTier / propertyType when they hold funnel values
UPDATE "Lead"
SET "funnelStage" = COALESCE(
  CASE
    WHEN "qualificationTier" IN (
      'eoi_submitted','quiz_started','quiz_partial','quiz_completed',
      'assessment_offered','assessment_purchased','assessment_completed',
      'programme_offered','programme_enrolled','discovery_requested'
    ) THEN "qualificationTier"
    WHEN "propertyType" IN (
      'eoi_submitted','quiz_started','quiz_partial','quiz_completed',
      'assessment_offered','assessment_purchased','assessment_completed',
      'programme_offered','programme_enrolled','discovery_requested'
    ) THEN "propertyType"
    ELSE 'quiz_partial'
  END,
  'quiz_partial'
);

-- Backfill quiz score from loanAmount when in valid range
UPDATE "Lead"
SET "quizScore" = "loanAmount"
WHERE "loanAmount" > 0 AND "loanAmount" <= 100;

-- Backfill segment from propertyType when elevated/standard
UPDATE "Lead"
SET "segment" = "propertyType"
WHERE "propertyType" IN ('elevated', 'standard');

-- Backfill primary concern from loanPurpose when not a funnel stage token
UPDATE "Lead"
SET "primaryConcern" = "loanPurpose"
WHERE "loanPurpose" NOT IN (
  'eoi_submitted','quiz_started','quiz_partial','quiz_completed',
  'assessment_offered','assessment_purchased','assessment_completed',
  'programme_offered','programme_enrolled','discovery_requested'
) AND "loanPurpose" IS NOT NULL AND "loanPurpose" != '';

-- Reset qualificationTier to clinical values (was funnel stage for NN leads)
UPDATE "Lead"
SET "qualificationTier" = CASE
  WHEN "quizScore" IS NOT NULL AND "quizScore" >= 75 THEN 'highly_qualified'
  WHEN "quizScore" IS NOT NULL AND "quizScore" < 50 THEN 'nurture'
  WHEN "segment" = 'elevated' THEN 'nurture'
  WHEN "qualificationTier" IN ('fully_qualified', 'partial') THEN 'nurture'
  WHEN "qualificationTier" IN (
    'eoi_submitted','quiz_started','quiz_partial','quiz_completed',
    'assessment_offered','assessment_purchased','assessment_completed',
    'programme_offered','programme_enrolled','discovery_requested'
  ) THEN 'unscreened'
  WHEN "qualificationTier" IS NULL OR "qualificationTier" = '' THEN 'unscreened'
  ELSE "qualificationTier"
END;

-- Backfill EUR revenue from legacy cent fields
UPDATE "Lead"
SET "revenueEur" = COALESCE("revenueGenerated", "initialInvoiceAmount", 0) / 100.0
WHERE COALESCE("revenueGenerated", "initialInvoiceAmount", 0) > 0;

UPDATE "Lead"
SET "pipelineValueEur" = CASE
  WHEN "funnelStage" = 'programme_enrolled' THEN 3550.0
  WHEN "funnelStage" IN ('assessment_purchased', 'assessment_completed') THEN 3550.0
  WHEN "funnelStage" = 'quiz_completed' THEN 90.0
  ELSE COALESCE("expectedValue", 0) / 100.0
END
WHERE "pipelineValueEur" = 0;

-- Assessment timestamps from funnel stage
UPDATE "Lead"
SET "assessmentPaidAt" = "updatedAt"
WHERE "funnelStage" IN ('assessment_purchased', 'assessment_completed')
  AND "assessmentPaidAt" IS NULL;

UPDATE "Lead"
SET "enrolledAt" = "updatedAt"
WHERE "funnelStage" = 'programme_enrolled' AND "enrolledAt" IS NULL;
