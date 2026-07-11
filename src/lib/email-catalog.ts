import {
  journeyEmailCatalog,
  SAMPLE_EMAIL_CONTEXT,
  type JourneyEmailContent,
} from "@/lib/journey-emails";

export { SAMPLE_EMAIL_CONTEXT as SAMPLE_LEAD } from "@/lib/journey-emails";

export type EmailCatalogEntry = JourneyEmailContent & {
  status: "live";
};

function toCatalogEntry(email: JourneyEmailContent & { status: "live" }): EmailCatalogEntry {
  return email;
}

/** All automation + journey emails for previews and audits. */
export function emailCatalog(): EmailCatalogEntry[] {
  return journeyEmailCatalog(SAMPLE_EMAIL_CONTEXT).map(toCatalogEntry);
}

export function borrowerEmails() {
  return emailCatalog().filter((e) => e.audience === "borrower");
}

export function automationEmails() {
  return emailCatalog();
}
