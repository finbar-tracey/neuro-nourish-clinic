export type FollowUpPreset = "today" | "1d" | "2d" | "3d" | "custom";

export function followUpAtFromPreset(preset: FollowUpPreset, custom?: Date, from = new Date()): Date {
  if (preset === "custom" && custom) return custom;

  const base = new Date(from);
  if (preset === "today") {
    const endOfDay = new Date(base);
    endOfDay.setHours(18, 0, 0, 0);
    if (endOfDay.getTime() <= base.getTime()) {
      endOfDay.setTime(base.getTime() + 4 * 60 * 60 * 1000);
    }
    return endOfDay;
  }

  const days = preset === "1d" ? 1 : preset === "2d" ? 2 : preset === "3d" ? 3 : 1;
  const due = new Date(base);
  due.setDate(due.getDate() + days);
  due.setHours(10, 0, 0, 0);
  return due;
}

export function followUpLabel(preset: FollowUpPreset | undefined, at: Date): string {
  if (preset === "today") return "today";
  if (preset === "1d") return "in 1 day";
  if (preset === "2d") return "in 2 days";
  if (preset === "3d") return "in 3 days";
  return at.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
