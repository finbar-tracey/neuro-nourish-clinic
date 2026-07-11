export type NavCountKey =
  | "newLead"
  | "callbacks"
  | "documents"
  | "applications"
  | "completions"
  | "closed"
  | "reengagement"
  | "atRisk";

export type ShellNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  countKey: NavCountKey | null;
  /** When false, count is fetched but not shown as a sidebar badge (archive / pipeline totals). */
  showBadge: boolean;
};

export type ShellNavSection = {
  id: string;
  title: string;
  items: ShellNavItem[];
};

/** Daniel's daily CRM — three queues + home. */
export const SHELL_NAV_SECTIONS: ShellNavSection[] = [
  {
    id: "work-today",
    title: "Work today",
    items: [
      { href: "/workspace", label: "Home", shortLabel: "Home", countKey: null, showBadge: false },
      {
        href: "/workspace/inbox",
        label: "New Leads",
        shortLabel: "New",
        countKey: "newLead",
        showBadge: true,
      },
      {
        href: "/workspace/callbacks",
        label: "Follow-Up",
        shortLabel: "Follow",
        countKey: "callbacks",
        showBadge: true,
      },
      {
        href: "/workspace/completions",
        label: "Completed",
        shortLabel: "Done",
        countKey: "completions",
        showBadge: true,
      },
    ],
  },
  {
    id: "archive",
    title: "Archive & more",
    items: [
      {
        href: "/workspace/closed",
        label: "Lost / Disqualified",
        shortLabel: "Closed",
        countKey: "closed",
        showBadge: false,
      },
      {
        href: "/workspace/documents",
        label: "Documents",
        shortLabel: "Docs",
        countKey: "documents",
        showBadge: false,
      },
      {
        href: "/workspace/applications",
        label: "Applications",
        shortLabel: "Apps",
        countKey: "applications",
        showBadge: false,
      },
      {
        href: "/workspace/at-risk",
        label: "At Risk",
        shortLabel: "Risk",
        countKey: "atRisk",
        showBadge: false,
      },
      {
        href: "/workspace/re-engagement",
        label: "Re-engagement",
        shortLabel: "Win-back",
        countKey: "reengagement",
        showBadge: false,
      },
    ],
  },
  {
    id: "insights",
    title: "Insights & setup",
    items: [
      { href: "/workspace/sources", label: "Sources", shortLabel: "Sources", countKey: null, showBadge: false },
      {
        href: "/workspace/automations",
        label: "Automations",
        shortLabel: "Auto",
        countKey: null,
        showBadge: false,
      },
    ],
  },
];

/** Primary mobile bottom tabs — everything else lives in the More sheet. */
export const MOBILE_TAB_HREFS = [
  "/workspace",
  "/workspace/inbox",
  "/workspace/callbacks",
  "/workspace/completions",
] as const;

export const MOBILE_TAB_HREFS_HEALTHCARE = [
  "/workspace",
  "/workspace/inbox",
  "/workspace/callbacks",
  "/workspace/at-risk",
] as const;

export function mobileTabHrefsForVertical(): readonly string[] {
  const pub = process.env.NEXT_PUBLIC_VERTICAL?.trim().toLowerCase();
  if (pub === "neuronourish") return MOBILE_TAB_HREFS_NEURONOURISH;
  if (pub === "healthcare") return MOBILE_TAB_HREFS_HEALTHCARE;
  return MOBILE_TAB_HREFS;
}

export function flatShellNavItems(): ShellNavItem[] {
  return shellNavSectionsForVertical().flatMap((section) => section.items);
}

export function shellNavItemByHref(href: string): ShellNavItem | undefined {
  return flatShellNavItems().find((item) => item.href === href);
}

/** Healthcare workspace — hide finance/document pipeline queues. */
export const HEALTHCARE_NAV_SECTIONS: ShellNavSection[] = [
  {
    id: "work-today",
    title: "Work today",
    items: [
      { href: "/workspace", label: "Home", shortLabel: "Home", countKey: null, showBadge: false },
      {
        href: "/workspace/inbox",
        label: "New Leads",
        shortLabel: "New",
        countKey: "newLead",
        showBadge: true,
      },
      {
        href: "/workspace/callbacks",
        label: "Follow-Up",
        shortLabel: "Follow",
        countKey: "callbacks",
        showBadge: true,
      },
      {
        href: "/workspace/at-risk",
        label: "At Risk",
        shortLabel: "Risk",
        countKey: "atRisk",
        showBadge: true,
      },
    ],
  },
  {
    id: "archive",
    title: "Archive",
    items: [
      {
        href: "/workspace/closed",
        label: "Lost / Disqualified",
        shortLabel: "Closed",
        countKey: "closed",
        showBadge: false,
      },
    ],
  },
  {
    id: "insights",
    title: "Insights & setup",
    items: [
      { href: "/workspace/sources", label: "Sources", shortLabel: "Sources", countKey: null, showBadge: false },
      {
        href: "/workspace/automations",
        label: "Automations",
        shortLabel: "Auto",
        countKey: null,
        showBadge: false,
      },
    ],
  },
];

export function shellNavSectionsForVertical(): ShellNavSection[] {
  const pub = process.env.NEXT_PUBLIC_VERTICAL?.trim().toLowerCase();
  if (pub === "neuronourish") return NEURONOURISH_NAV_SECTIONS;
  if (pub === "healthcare") return HEALTHCARE_NAV_SECTIONS;
  return SHELL_NAV_SECTIONS;
}

/** NeuroNourish care-team workspace — quiz → assessment → programme funnel. */
export const NEURONOURISH_NAV_SECTIONS: ShellNavSection[] = [
  {
    id: "work-today",
    title: "Work today",
    items: [
      { href: "/workspace", label: "Home", shortLabel: "Home", countKey: null, showBadge: false },
      {
        href: "/workspace/inbox",
        label: "New enquiries",
        shortLabel: "New",
        countKey: "newLead",
        showBadge: true,
      },
      {
        href: "/workspace/callbacks",
        label: "Follow-up",
        shortLabel: "Follow",
        countKey: "callbacks",
        showBadge: true,
      },
      {
        href: "/workspace/applications",
        label: "Assessments",
        shortLabel: "Assess",
        countKey: "applications",
        showBadge: true,
      },
      {
        href: "/workspace/completions",
        label: "Enrolled",
        shortLabel: "Enrolled",
        countKey: "completions",
        showBadge: true,
      },
      {
        href: "/workspace/at-risk",
        label: "At risk",
        shortLabel: "Risk",
        countKey: "atRisk",
        showBadge: true,
      },
    ],
  },
  {
    id: "archive",
    title: "Archive",
    items: [
      {
        href: "/workspace/closed",
        label: "Lost / disqualified",
        shortLabel: "Closed",
        countKey: "closed",
        showBadge: false,
      },
      {
        href: "/workspace/re-engagement",
        label: "Re-engagement",
        shortLabel: "Win-back",
        countKey: "reengagement",
        showBadge: false,
      },
    ],
  },
  {
    id: "insights",
    title: "Insights & setup",
    items: [
      { href: "/workspace/sources", label: "Sources", shortLabel: "Sources", countKey: null, showBadge: false },
      {
        href: "/workspace/automations",
        label: "Automations",
        shortLabel: "Auto",
        countKey: null,
        showBadge: false,
      },
    ],
  },
];

export const MOBILE_TAB_HREFS_NEURONOURISH = [
  "/workspace",
  "/workspace/inbox",
  "/workspace/callbacks",
  "/workspace/applications",
] as const;
