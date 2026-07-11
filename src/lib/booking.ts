export async function logBookingIntent(leadId: string | undefined, preferredSlot: string) {
  if (!leadId || !preferredSlot) return;
  try {
    await fetch("/api/leads/booking-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, preferredSlot }),
    });
  } catch {
    /* non-blocking */
  }
}

export type BookPriorityCallResult = {
  ok: boolean;
  displayTime?: string;
  slotLabel?: string;
  teamsLink?: string | null;
  code?: string;
  error?: string;
};

export async function bookPriorityCall(
  leadId: string | undefined,
  slotId: string,
  meta?: {
    metaEventId?: string;
    fbp?: string;
    fbc?: string;
    landingPageUrl?: string;
  },
): Promise<BookPriorityCallResult> {
  if (!leadId || !slotId) return { ok: false, error: "Missing lead or slot" };
  try {
    const res = await fetch("/api/book-priority-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, slotId, ...meta }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      displayTime?: string;
      slotLabel?: string;
      teamsLink?: string | null;
      code?: string;
      error?: string;
    };
    return {
      ok: res.ok && data.ok === true,
      displayTime: data.displayTime,
      slotLabel: data.slotLabel,
      teamsLink: data.teamsLink,
      code: data.code,
      error: data.error,
    };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
