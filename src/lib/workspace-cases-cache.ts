import { leadToCase, type CaseView } from "@/lib/case";
import { db } from "@/lib/db";

const TTL_MS = 4_000;

let cachedAt = 0;
let cachedCases: CaseView[] | null = null;
let inflight: Promise<CaseView[]> | null = null;

export function invalidateWorkspaceCasesCache() {
  cachedAt = 0;
  cachedCases = null;
  inflight = null;
}

/** Shared workspace case list — avoids re-mapping every lead on each API hit. */
export async function loadWorkspaceCases(force = false): Promise<CaseView[]> {
  const fresh = cachedCases && Date.now() - cachedAt < TTL_MS;
  if (!force && fresh) return cachedCases!;

  if (!force && inflight) return inflight;

  inflight = (async () => {
    const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
    // Prefer newest lead per email — guards against accidental double-seed
    const seenEmails = new Set<string>();
    const unique: typeof leads = [];
    for (const lead of leads) {
      const key = lead.email.trim().toLowerCase();
      if (key && seenEmails.has(key)) continue;
      if (key) seenEmails.add(key);
      unique.push(lead);
    }
    const cases = unique.map(leadToCase);
    cachedCases = cases;
    cachedAt = Date.now();
    return cases;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
