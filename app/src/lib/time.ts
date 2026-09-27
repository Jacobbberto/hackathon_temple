/** Date helpers pinned to Philly time, wherever the phone happens to be. */

export const PHILLY_TZ = 'America/New_York';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: PHILLY_TZ, ...opts });

const timeFmt = fmt({ hour: 'numeric', minute: '2-digit' });
const dayFmt = fmt({ weekday: 'short', month: 'short', day: 'numeric' });
const longDayFmt = fmt({ weekday: 'long', month: 'long', day: 'numeric' });
const weekdayFmt = fmt({ weekday: 'short' });
const longWeekdayFmt = fmt({ weekday: 'long' });
const isoDayFmt = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = fmt({ hour: 'numeric', hour12: false });

/** "2026-09-26" for a Date, in Philly time. */
export function phillyDay(date: Date = new Date()): string {
  const parts = Object.fromEntries(isoDayFmt.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function phillyHour(date: Date = new Date()): number {
  return Number(hourFmt.format(date)) % 24;
}

/** Parse a bare "YYYY-MM-DD" as noon UTC so it lands on the right calendar day everywhere. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso)).replace(':00', '');
}

export function formatDay(isoOrDay: string): string {
  const d = isoOrDay.length === 10 ? dayToDate(isoOrDay) : new Date(isoOrDay);
  return dayFmt.format(d);
}

export function formatLongDay(date: Date = new Date()): string {
  return longDayFmt.format(date);
}

export function formatWeekday(day: string): string {
  return weekdayFmt.format(dayToDate(day));
}

export function formatLongWeekday(day: string): string {
  return longWeekdayFmt.format(dayToDate(day));
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((dayToDate(toDay).getTime() - dayToDate(fromDay).getTime()) / 86_400_000);
}

/** "Yesterday", "Today", "Tomorrow", or "Thu, Oct 1". */
export function relativeDay(day: string, today: string = phillyDay()): string {
  const diff = daysBetween(today, day);
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatDay(day);
}

export function timeAgo(epochSeconds: number | null, now: number = Date.now()): string {
  if (!epochSeconds) return '';
  const mins = Math.max(0, Math.round((now - epochSeconds * 1000) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** "Sun 4:25 PM" style kickoff label, with Today/Tomorrow when close. */
export function gameTimeLabel(iso: string): string {
  const day = phillyDay(new Date(iso));
  return `${relativeDay(day)} · ${formatTime(iso)}`;
}
