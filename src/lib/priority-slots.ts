/** Generate today's remaining priority consultation slots (UK business hours). */
export type PrioritySlot = {
  id: string;
  dayLabel: string;
  time: string;
  period: "AM" | "PM";
  /** Full label for CTA subtext */
  label: string;
  minutes: number;
};

const BASE_SLOTS: { h: number; m: number }[] = [
  { h: 10, m: 30 },
  { h: 11, m: 15 },
  { h: 12, m: 45 },
  { h: 14, m: 30 },
  { h: 16, m: 0 },
];

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    hour: get("hour"),
    minute: get("minute"),
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
  };
}

function formatSlot(h: number, m: number): Pick<PrioritySlot, "time" | "period"> {
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const time = `${hour12}:${m.toString().padStart(2, "0")}`;
  return { time, period };
}

function buildSlot(
  h: number,
  m: number,
  dayLabel: string,
): PrioritySlot {
  const { time, period } = formatSlot(h, m);
  return {
    id: `${h}-${m}`,
    dayLabel,
    time,
    period,
    label: `${dayLabel} ${time} ${period}`,
    minutes: h * 60 + m,
  };
}

export function getTodayPrioritySlots(now = new Date()): PrioritySlot[] {
  const { hour, minute, weekday } = londonParts(now);
  const isWeekend = weekday === "Sat" || weekday === "Sun";

  if (isWeekend) {
    return BASE_SLOTS.map((slot) => buildSlot(slot.h, slot.m, "Mon"));
  }

  const currentMinutes = hour * 60 + minute;
  const future = BASE_SLOTS.filter(
    (slot) => slot.h * 60 + slot.m > currentMinutes + 30,
  );

  const dayLabel = future.length > 0 ? "Today" : "Tomorrow";
  const slots = (future.length > 0 ? future : BASE_SLOTS).slice(0, 5);

  return slots.map((slot) => buildSlot(slot.h, slot.m, dayLabel));
}

export function findSlotById(slotId: string, now = new Date()): PrioritySlot | undefined {
  return getTodayPrioritySlots(now).find((slot) => slot.id === slotId);
}

export function findSlotByLabel(label: string, now = new Date()): PrioritySlot | undefined {
  return getTodayPrioritySlots(now).find((slot) => slot.label === label);
}

/** CTA-friendly time e.g. "10:30 AM" */
export function formatDisplayTime(slot: PrioritySlot): string {
  return `${slot.time} ${slot.period}`;
}
