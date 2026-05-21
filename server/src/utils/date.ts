export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function parseTimeOnly(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function timeToMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function toTimeOnlyString(value: Date) {
  return value.toISOString().slice(11, 16);
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { start, end };
}

export function getYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  return { start, end };
}

export function getWeekRange(anchorDate: Date) {
  const date = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), anchorDate.getUTCDate()));
  const day = date.getUTCDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - distanceFromMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function differenceInDays(later: Date, earlier: Date) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const laterDate = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  const earlierDate = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate());

  return Math.floor((laterDate - earlierDate) / oneDayMs);
}
