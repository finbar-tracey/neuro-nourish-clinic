/** GHL-style pipeline columns */
export const PIPELINE_COLUMNS = [
  {
    id: "NEW",
    label: "New Leads",
    description: "Step 2 captures & completed enquiries",
    color: "border-blue-200 bg-blue-50/50",
    header: "bg-blue-600",
  },
  {
    id: "CONTACTED",
    label: "Contacted",
    description: "Initial outreach made",
    color: "border-amber-200 bg-amber-50/50",
    header: "bg-amber-600",
  },
  {
    id: "BOOKED",
    label: "Booked",
    description: "Consultation or call scheduled",
    color: "border-violet-200 bg-violet-50/50",
    header: "bg-violet-600",
  },
  {
    id: "WON",
    label: "Won",
    description: "Deal completed",
    color: "border-green-200 bg-green-50/50",
    header: "bg-green-600",
  },
  {
    id: "LOST",
    label: "Lost",
    description: "Did not proceed",
    color: "border-slate-200 bg-slate-50/50",
    header: "bg-slate-500",
  },
  {
    id: "DISQUALIFIED",
    label: "Disqualified",
    description: "Failed qualification rules",
    color: "border-red-200 bg-red-50/50",
    header: "bg-red-600",
  },
  {
    id: "FOLLOW_UP",
    label: "Follow Up",
    description: "Nurture email sequence active",
    color: "border-orange-200 bg-orange-50/50",
    header: "bg-orange-500",
  },
] as const;

export type PipelineStatus = (typeof PIPELINE_COLUMNS)[number]["id"];

export const QUALIFICATION_TIERS = {
  fully_qualified: {
    label: "Fully qualified",
    color: "bg-green-100 text-green-800",
  },
  partial: {
    label: "Qualified",
    color: "bg-sky-100 text-sky-800",
  },
} as const;

export type QualificationTier = keyof typeof QUALIFICATION_TIERS;

export function getQualificationPill(
  tier: string | null | undefined,
  formCompleted?: boolean,
): { label: string; color: string } | null {
  if (tier === "fully_qualified") {
    return QUALIFICATION_TIERS.fully_qualified;
  }
  if (tier === "partial" || formCompleted === false) {
    return QUALIFICATION_TIERS.partial;
  }
  if (formCompleted === true) {
    return QUALIFICATION_TIERS.fully_qualified;
  }
  return null;
}

const FOLLOW_UP_HOURS = 2;

/** New/contacted leads with no outreach within the SLA window */
export function leadNeedsFollowUp(lead: {
  status: string;
  createdAt: string;
  lastContactedAt: string | null;
}): boolean {
  if (lead.status !== "NEW" && lead.status !== "CONTACTED") return false;
  const anchor = lead.lastContactedAt ?? lead.createdAt;
  const hours = (Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60);
  return hours >= FOLLOW_UP_HOURS;
}

export function followUpOverdueLabel(lead: {
  createdAt: string;
  lastContactedAt: string | null;
}): string {
  const anchor = lead.lastContactedAt ?? lead.createdAt;
  const hours = Math.floor(
    (Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60),
  );
  if (hours < 24) return `${hours}h overdue`;
  return `${Math.floor(hours / 24)}d overdue`;
}

export const QUALIFICATION_FILTERS = [
  { id: "all", label: "All leads" },
  { id: "fully_qualified", label: "Fully qualified" },
  { id: "partial", label: "Partial (step 2)" },
  { id: "incomplete", label: "Incomplete form" },
] as const;

export type QualificationFilter = (typeof QUALIFICATION_FILTERS)[number]["id"];

export function matchesQualificationFilter(
  lead: {
    qualificationTier: string | null;
    formCompleted: boolean;
  },
  filter: QualificationFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "fully_qualified") {
    return lead.qualificationTier === "fully_qualified" || lead.formCompleted === true;
  }
  if (filter === "partial") {
    return lead.qualificationTier === "partial";
  }
  if (filter === "incomplete") {
    return lead.formCompleted === false;
  }
  return true;
}
