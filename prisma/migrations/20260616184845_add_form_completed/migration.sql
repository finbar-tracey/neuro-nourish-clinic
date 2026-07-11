-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "loanPurpose" TEXT NOT NULL,
    "loanAmount" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "propertyValue" INTEGER NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "ltv" TEXT,
    "timeframe" TEXT NOT NULL,
    "hasExistingMortgage" BOOLEAN NOT NULL DEFAULT false,
    "willOccupy" BOOLEAN NOT NULL DEFAULT false,
    "hasEverOccupied" BOOLEAN NOT NULL DEFAULT false,
    "nurtureEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "formCompleted" BOOLEAN NOT NULL DEFAULT false,
    "additionalInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'landing_page',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "fbclid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastContactedAt" DATETIME
);
INSERT INTO "new_Lead" ("additionalInfo", "createdAt", "email", "fbclid", "firstName", "hasEverOccupied", "hasExistingMortgage", "id", "lastContactedAt", "lastName", "loanAmount", "loanPurpose", "ltv", "nurtureEnrolled", "phone", "propertyLocation", "propertyType", "propertyValue", "source", "status", "termMonths", "timeframe", "updatedAt", "utmCampaign", "utmMedium", "utmSource", "willOccupy") SELECT "additionalInfo", "createdAt", "email", "fbclid", "firstName", "hasEverOccupied", "hasExistingMortgage", "id", "lastContactedAt", "lastName", "loanAmount", "loanPurpose", "ltv", "nurtureEnrolled", "phone", "propertyLocation", "propertyType", "propertyValue", "source", "status", "termMonths", "timeframe", "updatedAt", "utmCampaign", "utmMedium", "utmSource", "willOccupy" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
