import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { addMinutes, format, parseISO } from "date-fns";

export const TIMEZONE = "Europe/Istanbul";

/** ISO weekday convention used across the app: 0 = Pazartesi ... 6 = Pazar */
export function isoWeekday(date: Date): number {
  const local = toZonedTime(date, TIMEZONE);
  const jsDay = local.getDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

export function dateKey(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

export function timeKey(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "HH:mm");
}

/** Combines a yyyy-MM-dd date key + HH:mm time key (interpreted in Europe/Istanbul) into a UTC ISO instant. */
export function combineDateTime(dateStr: string, timeStr: string): string {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, TIMEZONE).toISOString();
}

export function addMinutesIso(iso: string, minutes: number): string {
  return addMinutes(parseISO(iso), minutes).toISOString();
}

export function formatTimeTR(iso: string): string {
  return formatInTimeZone(parseISO(iso), TIMEZONE, "HH:mm");
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const MONTHS_TR_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];
const DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAYS_TR_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function formatDateLongTR(iso: string): string {
  const z = toZonedTime(parseISO(iso), TIMEZONE);
  return `${z.getDate()} ${MONTHS_TR[z.getMonth()]} ${z.getFullYear()}`;
}

/** Same long-form Turkish date as formatDateLongTR; kept as a distinct name for call-site clarity. */
export function formatDateTR(iso: string): string {
  return formatDateLongTR(iso);
}

export function formatDateShortTR(iso: string): string {
  const z = toZonedTime(parseISO(iso), TIMEZONE);
  return `${z.getDate()} ${MONTHS_TR_SHORT[z.getMonth()]}`;
}

export function formatWeekdayTR(iso: string): string {
  return DAYS_TR[isoWeekday(parseISO(iso))];
}

export function formatWeekdayShortTR(iso: string): string {
  return DAYS_TR_SHORT[isoWeekday(parseISO(iso))];
}

export function dateKeyToLongTR(key: string): string {
  return formatDateLongTR(combineDateTime(key, "12:00"));
}

export function dateKeyToWeekdayTR(key: string): string {
  return formatWeekdayTR(combineDateTime(key, "12:00"));
}

export function formatDateTimeTR(iso: string): string {
  return `${formatDateLongTR(iso)} · ${formatTimeTR(iso)}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDaysKey(baseKey: string, days: number): string {
  const d = fromZonedTime(`${baseKey}T00:00:00`, TIMEZONE);
  const next = addMinutes(d, days * 24 * 60);
  return dateKey(next);
}

export function nowInIstanbul(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function minutesBetween(startIso: string, endIso: string): number {
  return (parseISO(endIso).getTime() - parseISO(startIso).getTime()) / 60000;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export { format };
