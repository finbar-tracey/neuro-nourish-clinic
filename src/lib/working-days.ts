/** UK business days (Mon–Fri). */

export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export function addWorkingDays(from: Date, workingDays: number): Date {
  if (workingDays <= 0) return new Date(from);

  const result = new Date(from);
  let added = 0;

  while (added < workingDays) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result)) added++;
  }

  return result;
}

export function addWorkingHours(from: Date, hours: number): Date {
  let remaining = hours;
  const result = new Date(from);

  while (remaining > 0) {
    if (isWorkingDay(result)) {
      result.setTime(result.getTime() + 60 * 60 * 1000);
      remaining--;
    } else {
      result.setDate(result.getDate() + 1);
      result.setHours(9, 0, 0, 0);
    }
  }

  return result;
}
