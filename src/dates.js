// Local-calendar-day helpers. Due dates are stored as "YYYY-MM-DD" in the
// learner's local time zone so a card due "tomorrow" becomes due at local
// midnight, regardless of DST shifts or UTC offset.

const pad = (n) => String(n).padStart(2, '0');

export function toDayString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayString(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) throw new Error(`Invalid day string: ${day}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function addDays(day, n) {
  const d = parseDayString(day);
  // Constructing from local components avoids 23/25-hour DST days.
  return toDayString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

export function daysBetween(fromDay, toDay) {
  const a = parseDayString(fromDay);
  const b = parseDayString(toDay);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function today(now = new Date()) {
  return toDayString(now);
}
