import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Reminder schedule mode chosen by the user in Profile.
 * - `schedule`: explicit weekdays + exact time.
 * - `random`: N notifications per day at random times in `RANDOM_WINDOW`.
 */
export type ReminderMode = "schedule" | "random";

/**
 * 7-day weekday flags, Monday-first to match how Czech UIs display weekdays.
 * Index 0 = Monday … index 6 = Sunday.
 */
export type ReminderDays = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

export type ReminderSettings = {
  enabled: boolean;
  mode: ReminderMode;
  days: ReminderDays;
  hour: number;
  minute: number;
  perDay: 1 | 2 | 3;
};

const STORAGE_KEY = "italiano.reminders.v1";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  mode: "schedule",
  days: [true, true, true, true, true, false, false],
  hour: 19,
  minute: 0,
  perDay: 1,
};

/** Inclusive lower bound (hour) for the `random` mode window. */
export const RANDOM_WINDOW_START_HOUR = 9;
/** Exclusive upper bound (hour) for the `random` mode window. */
export const RANDOM_WINDOW_END_HOUR = 21;

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : fallback;
  return Math.max(min, Math.min(max, v));
}

function normalizeDays(input: unknown): ReminderDays {
  if (!Array.isArray(input) || input.length !== 7) return [...DEFAULT_REMINDER_SETTINGS.days];
  return input.map((v) => !!v) as ReminderDays;
}

function normalizePerDay(input: unknown): 1 | 2 | 3 {
  return input === 2 ? 2 : input === 3 ? 3 : 1;
}

function normalize(parsed: Partial<ReminderSettings> | null | undefined): ReminderSettings {
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_REMINDER_SETTINGS };
  return {
    enabled: !!parsed.enabled,
    mode: parsed.mode === "random" ? "random" : "schedule",
    days: normalizeDays(parsed.days),
    hour: clampInt(parsed.hour, 0, 23, DEFAULT_REMINDER_SETTINGS.hour),
    minute: clampInt(parsed.minute, 0, 59, DEFAULT_REMINDER_SETTINGS.minute),
    perDay: normalizePerDay(parsed.perDay),
  };
}

export async function readReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REMINDER_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<ReminderSettings>);
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
}

export async function writeReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(settings)));
  } catch {
    // Storage failure is non-fatal — next write attempt will retry.
  }
}

/** Returns true when at least one weekday is enabled. */
export function hasAnyDay(days: ReminderDays): boolean {
  return days.some(Boolean);
}
