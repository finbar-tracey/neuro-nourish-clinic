import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";

type TeamsMeetingResult = {
  created: boolean;
  teamsLink: string | null;
  eventId?: string;
};

function graphConfigured(): boolean {
  return Boolean(
    (runtimeEnv("MICROSOFT_TENANT_ID") || runtimeEnv("MS_GRAPH_TENANT_ID")) &&
      (runtimeEnv("MICROSOFT_CLIENT_ID") || runtimeEnv("MS_GRAPH_CLIENT_ID")) &&
      (runtimeSecret("MICROSOFT_CLIENT_SECRET") || runtimeSecret("MS_GRAPH_CLIENT_SECRET")) &&
      (runtimeEnv("BROKER_CALENDAR_EMAIL") ||
        runtimeEnv("MICROSOFT_USER_ID") ||
        runtimeEnv("MS_GRAPH_ORGANIZER_EMAIL")),
  );
}

function graphEnv() {
  return {
    tenantId: runtimeEnv("MICROSOFT_TENANT_ID") ?? runtimeEnv("MS_GRAPH_TENANT_ID") ?? "",
    clientId: runtimeEnv("MICROSOFT_CLIENT_ID") ?? runtimeEnv("MS_GRAPH_CLIENT_ID") ?? "",
    clientSecret:
      runtimeSecret("MICROSOFT_CLIENT_SECRET") ?? runtimeSecret("MS_GRAPH_CLIENT_SECRET") ?? "",
    organizer:
      runtimeEnv("BROKER_CALENDAR_EMAIL") ??
      runtimeEnv("MICROSOFT_USER_ID") ??
      runtimeEnv("MS_GRAPH_ORGANIZER_EMAIL") ??
      "",
  };
}

async function getGraphToken(): Promise<string | null> {
  const { tenantId, clientId, clientSecret } = graphEnv();
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[Graph] token request failed", res.status, body.slice(0, 300));
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    console.error("[Graph] token response missing access_token");
  }
  return data.access_token ?? null;
}

/** Creates an Outlook calendar event with Teams link when Microsoft Graph is configured. */
export async function createTeamsMeetingEvent(input: {
  subject: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
  attendeeName: string;
}): Promise<TeamsMeetingResult> {
  if (!graphConfigured()) {
    return { created: false, teamsLink: null };
  }

  const token = await getGraphToken();
  const { organizer } = graphEnv();
  if (!token || !organizer) {
    return { created: false, teamsLink: null };
  }

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: input.subject,
          start: { dateTime: input.startIso, timeZone: "Europe/London" },
          end: { dateTime: input.endIso, timeZone: "Europe/London" },
          attendees: [
            {
              emailAddress: { address: input.attendeeEmail, name: input.attendeeName },
              type: "required",
            },
          ],
          isOnlineMeeting: true,
          onlineMeetingProvider: "teamsForBusiness",
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[Graph] create event failed", res.status, body.slice(0, 300));
      return { created: false, teamsLink: null };
    }

    const event = (await res.json()) as {
      id?: string;
      onlineMeeting?: { joinUrl?: string };
    };

    return {
      created: true,
      teamsLink: event.onlineMeeting?.joinUrl ?? null,
      eventId: event.id,
    };
  } catch {
    return { created: false, teamsLink: null };
  }
}

type ScheduleItem = {
  status?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

/**
 * Returns true if slot is free, false if busy, null if Graph is not configured.
 */
export async function isCalendarSlotAvailable(
  startIso: string,
  endIso: string,
): Promise<boolean | null> {
  if (!graphConfigured()) return null;

  const token = await getGraphToken();
  const { organizer } = graphEnv();
  if (!token || !organizer) return null;

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer)}/calendar/getSchedule`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: [organizer],
          startTime: { dateTime: startIso, timeZone: "Europe/London" },
          endTime: { dateTime: endIso, timeZone: "Europe/London" },
          availabilityViewInterval: 30,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[Graph] getSchedule failed", res.status, body.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      value?: Array<{ scheduleItems?: ScheduleItem[] }>;
    };

    const items = data.value?.[0]?.scheduleItems ?? [];
    const slotStart = new Date(startIso).getTime();
    const slotEnd = new Date(endIso).getTime();

    for (const item of items) {
      const status = item.status?.toLowerCase() ?? "";
      if (status === "free") continue;
      const itemStart = item.start?.dateTime ? new Date(item.start.dateTime).getTime() : 0;
      const itemEnd = item.end?.dateTime ? new Date(item.end.dateTime).getTime() : 0;
      if (itemStart < slotEnd && itemEnd > slotStart) {
        return false;
      }
    }

    return true;
  } catch {
    return null;
  }
}
