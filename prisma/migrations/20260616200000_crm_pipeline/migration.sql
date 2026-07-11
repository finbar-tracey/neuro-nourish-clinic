-- CRM pipeline: new statuses + qualification tier
-- Map legacy statuses before enum constraint changes

UPDATE "Lead" SET status = 'BOOKED' WHERE status = 'PROPOSAL';
UPDATE "Lead" SET status = 'WON' WHERE status = 'CONVERTED';
UPDATE "Lead" SET status = 'NEW' WHERE status = 'QUALIFIED';
UPDATE "Lead" SET status = 'DISQUALIFIED' WHERE status = 'LOST' AND additionalInfo LIKE '%Disqualified%';
UPDATE "Lead" SET status = 'FOLLOW_UP' WHERE status = 'LOST' AND nurtureEnrolled = 1;

ALTER TABLE "Lead" ADD COLUMN "qualificationTier" TEXT;

UPDATE "Lead" SET qualificationTier = 'fully_qualified' WHERE formCompleted = 1 AND status = 'NEW';
UPDATE "Lead" SET qualificationTier = 'partial' WHERE formCompleted = 0 AND status = 'NEW';
