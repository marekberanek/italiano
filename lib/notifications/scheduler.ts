import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { VocabState, VocabWord } from "@/assets/data/types";
import {
  RANDOM_WINDOW_END_HOUR,
  RANDOM_WINDOW_START_HOUR,
  hasAnyDay,
  readReminderSettings,
  type ReminderDays,
} from "@/lib/notifications/reminder-settings";

/** How far ahead to plan when the user picks specific weekdays. */
const SCHEDULE_HORIZON_DAYS = 56;
/** How far ahead to plan in random mode. iOS caps total scheduled to 64. */
const RANDOM_HORIZON_DAYS = 14;
/** Min gap between random slots within the same day. */
const RANDOM_MIN_GAP_MIN = 30;
/** Hard cap on total scheduled notifications to stay safely under iOS limit. */
const MAX_SCHEDULED = 60;

const ANDROID_CHANNEL_ID = "italiano-default";

export type VocabReminderState = Pick<VocabState, "vocab">;

let handlerInstalled = false;

/**
 * Idempotent: install the notification handler so that locally scheduled
 * notifications surface as banners even when the app is in the foreground.
 * Safe to call multiple times.
 */
export function installNotificationHandler(): void {
  if (Platform.OS === "web") return;
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Připomínky slovíček",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#009246",
      vibrationPattern: [0, 200, 100, 200],
    });
  } catch {
    // Channel creation fails silently on platforms without proper support.
  }
}

/**
 * Requests notification permission if not yet granted. Returns the final
 * permission state (true = `granted` / `provisional`).
 */
export async function ensurePermission(): Promise<boolean> {
  await ensureAndroidChannel();
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: false,
      },
    });
    return next.granted || next.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

export async function getPermissionStatus(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  try {
    const current = await Notifications.getPermissionsAsync();
    return {
      granted:
        current.granted ||
        current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
      canAskAgain: current.canAskAgain ?? true,
    };
  } catch {
    return { granted: false, canAskAgain: true };
  }
}

export async function cancelVocabReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore — nothing meaningful we can do if the OS rejects the call
  }
}

/** Picks an item from `vocab` with a bias toward not-yet-learned, lower-streak words. */
function pickWeightedWord(vocab: VocabWord[]): VocabWord | null {
  if (vocab.length === 0) return null;
  if (vocab.length === 1) return vocab[0]!;
  const weights = vocab.map((w) => {
    // Base weight 1 for any word, big bump for unlearned, small penalty per streak point
    // (so a 0/3 word is preferred over 4/5 even when both are technically unlearned).
    const base = w.learned ? 1 : 4;
    const streakPenalty = Math.max(0, 3 - Math.min(w.streak, 3));
    return base + streakPenalty;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let target = Math.random() * total;
  for (let i = 0; i < vocab.length; i += 1) {
    target -= weights[i]!;
    if (target <= 0) return vocab[i]!;
  }
  return vocab[vocab.length - 1]!;
}

function buildContent(word: VocabWord): Notifications.NotificationContentInput {
  return {
    title: "Procvič si italštinu",
    body: `${word.it} – ${word.cz}`,
    data: { clientUuid: word.clientUuid },
  };
}

/** JS `Date.getDay()` returns 0 for Sunday; convert to Monday-first 0–6. */
function mondayFirstIndex(date: Date): number {
  const sundayFirst = date.getDay();
  return (sundayFirst + 6) % 7;
}

function startOfTomorrow(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function buildScheduleSlots(
  now: Date,
  days: ReminderDays,
  hour: number,
  minute: number,
): Date[] {
  const slots: Date[] = [];
  const cursor = startOfTomorrow(now);
  for (let i = 0; i < SCHEDULE_HORIZON_DAYS; i += 1) {
    const d = new Date(cursor);
    d.setDate(d.getDate() + i);
    if (!days[mondayFirstIndex(d)]) continue;
    const slot = new Date(d);
    slot.setHours(hour, minute, 0, 0);
    if (slot.getTime() <= now.getTime()) continue;
    slots.push(slot);
    if (slots.length >= MAX_SCHEDULED) break;
  }
  return slots;
}

/** N times per day, random minutes inside [9:00, 21:00), with min 30 min gap. */
function buildRandomSlots(now: Date, perDay: 1 | 2 | 3): Date[] {
  const slots: Date[] = [];
  const base = startOfTomorrow(now);
  const windowMinutes =
    (RANDOM_WINDOW_END_HOUR - RANDOM_WINDOW_START_HOUR) * 60 - RANDOM_MIN_GAP_MIN;
  for (let i = 0; i < RANDOM_HORIZON_DAYS; i += 1) {
    const day = new Date(base);
    day.setDate(day.getDate() + i);
    const picked: number[] = [];
    let safety = 0;
    while (picked.length < perDay && safety < 50) {
      safety += 1;
      const offset = Math.floor(Math.random() * windowMinutes);
      if (picked.every((p) => Math.abs(p - offset) >= RANDOM_MIN_GAP_MIN)) {
        picked.push(offset);
      }
    }
    picked.sort((a, b) => a - b);
    for (const offset of picked) {
      const slot = new Date(day);
      slot.setHours(RANDOM_WINDOW_START_HOUR, offset, 0, 0);
      if (slot.getTime() <= now.getTime()) continue;
      slots.push(slot);
      if (slots.length >= MAX_SCHEDULED) return slots;
    }
  }
  return slots;
}

/**
 * Cancel any previously scheduled reminders and re-plan based on the user's
 * settings + current vocab. Safe to call repeatedly (idempotent: every call
 * starts with a full cancel).
 *
 * Quietly no-ops when:
 * - permission is denied
 * - reminders disabled
 * - no vocab to remind about
 * - schedule mode with no weekdays selected
 */
export async function scheduleVocabReminders(state: VocabReminderState): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelVocabReminders();

  const settings = await readReminderSettings();
  if (!settings.enabled) return;
  if (state.vocab.length === 0) return;
  if (settings.mode === "schedule" && !hasAnyDay(settings.days)) return;

  const perm = await getPermissionStatus();
  if (!perm.granted) return;
  await ensureAndroidChannel();

  const now = new Date();
  const slots =
    settings.mode === "schedule"
      ? buildScheduleSlots(now, settings.days, settings.hour, settings.minute)
      : buildRandomSlots(now, settings.perDay);

  for (const date of slots) {
    const word = pickWeightedWord(state.vocab);
    if (!word) break;
    try {
      await Notifications.scheduleNotificationAsync({
        content: buildContent(word),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
      });
    } catch {
      // One bad slot shouldn't abort the whole batch — keep planning the rest.
    }
  }
}
