import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { CategoryChip } from "@/components/category-chip";
import {
  Palette,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useVocabStore } from "@/hooks/use-vocab-store";
import { emitReminderSettingsChange } from "@/lib/notifications/reminder-events";
import {
  DEFAULT_REMINDER_SETTINGS,
  hasAnyDay,
  readReminderSettings,
  type ReminderDays,
  type ReminderMode,
  type ReminderSettings,
  writeReminderSettings,
} from "@/lib/notifications/reminder-settings";
import {
  ensurePermission,
  getPermissionStatus,
} from "@/lib/notifications/scheduler";

const WEEKDAY_LABELS: readonly string[] = [
  "Po",
  "Út",
  "St",
  "Čt",
  "Pá",
  "So",
  "Ne",
];

const ALL_DAYS: ReminderDays = [true, true, true, true, true, true, true];
const WEEKDAYS_ONLY: ReminderDays = [
  true,
  true,
  true,
  true,
  true,
  false,
  false,
];
const WEEKEND_ONLY: ReminderDays = [
  false,
  false,
  false,
  false,
  false,
  true,
  true,
];

function daysEqual(a: ReminderDays, b: ReminderDays): boolean {
  for (let i = 0; i < 7; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function dateFromHourMinute(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function RemindersCard() {
  const { state, hydrated: vocabHydrated } = useVocabStore();
  const [settings, setSettings] = useState<ReminderSettings>(
    DEFAULT_REMINDER_SETTINGS,
  );
  const [loaded, setLoaded] = useState(false);
  const [permGranted, setPermGranted] = useState(false);
  const [permCanAskAgain, setPermCanAskAgain] = useState(true);
  const [showIosPicker, setShowIosPicker] = useState(false);
  // Avoid persisting the very first hydration as a "user-changed" event
  // (which would otherwise re-schedule everything on every screen open).
  const skipPersistRef = useRef(true);

  useEffect(() => {
    void Promise.all([readReminderSettings(), getPermissionStatus()]).then(
      ([loadedSettings, perm]) => {
        setSettings(loadedSettings);
        setPermGranted(perm.granted);
        setPermCanAskAgain(perm.canAskAgain);
        setLoaded(true);
      },
    );
  }, []);

  // Persist + notify scheduler whenever the user mutates settings. The
  // `skipPersistRef` guard prevents the initial hydration from triggering
  // a no-op write/replan.
  useEffect(() => {
    if (!loaded) return;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    void writeReminderSettings(settings).then(() =>
      emitReminderSettingsChange(),
    );
  }, [loaded, settings]);

  const toggleEnabled = useCallback(
    async (next: boolean) => {
      if (next && !permGranted) {
        const granted = await ensurePermission();
        const perm = await getPermissionStatus();
        setPermGranted(perm.granted);
        setPermCanAskAgain(perm.canAskAgain);
        if (!granted) {
          Alert.alert(
            "Notifikace",
            "Bez povolení notifikací nemůžeme posílat připomínky. Můžeš to zapnout v nastavení telefonu.",
          );
          return;
        }
      }
      setSettings((s) => ({ ...s, enabled: next }));
    },
    [permGranted],
  );

  const toggleDay = useCallback((index: number) => {
    setSettings((s) => {
      const days = [...s.days] as ReminderDays;
      days[index] = !days[index];
      return { ...s, days };
    });
  }, []);

  const setMode = useCallback((mode: ReminderMode) => {
    setSettings((s) => (s.mode === mode ? s : { ...s, mode }));
  }, []);

  const setPerDay = useCallback((perDay: 1 | 2 | 3) => {
    setSettings((s) => (s.perDay === perDay ? s : { ...s, perDay }));
  }, []);

  const setPresetDays = useCallback((preset: ReminderDays) => {
    setSettings((s) =>
      daysEqual(s.days, preset)
        ? s
        : { ...s, days: [...preset] as ReminderDays },
    );
  }, []);

  const handleTimePicked = useCallback((hour: number, minute: number) => {
    setSettings((s) =>
      s.hour === hour && s.minute === minute ? s : { ...s, hour, minute },
    );
  }, []);

  const openTimePicker = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dateFromHourMinute(settings.hour, settings.minute),
        mode: "time",
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) {
            handleTimePicked(selected.getHours(), selected.getMinutes());
          }
        },
      });
    } else {
      setShowIosPicker(true);
    }
  }, [handleTimePicked, settings.hour, settings.minute]);

  const presetActive = useMemo(
    () => ({
      every: daysEqual(settings.days, ALL_DAYS),
      weekdays: daysEqual(settings.days, WEEKDAYS_ONLY),
      weekend: daysEqual(settings.days, WEEKEND_ONLY),
    }),
    [settings.days],
  );

  const noVocab = vocabHydrated && state.vocab.length === 0;
  const noDays = settings.mode === "schedule" && !hasAnyDay(settings.days);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name="notifications-active"
            size={22}
            color={Palette.brandDark}
          />
          <Text style={styles.title}>Připomínky</Text>
        </View>
        <Switch
          value={settings.enabled && permGranted}
          onValueChange={(v) => void toggleEnabled(v)}
          trackColor={{ false: Palette.borderStrong, true: Palette.brand }}
          thumbColor={Palette.surface}
        />
      </View>

      <Text style={styles.subtitle}>
        Občas tě upozorníme na náhodné slovíčko z tvé knihovny. Klepnutím
        spustíš mini-cvičení na jedno slovo.
      </Text>

      {!permGranted && settings.enabled ? (
        <View style={styles.permBox}>
          <MaterialIcons name="info-outline" size={18} color={Palette.danger} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.permTitle}>Notifikace nejsou povolené</Text>
            <Pressable
              onPress={() => {
                if (permCanAskAgain)
                  void ensurePermission().then(() => {
                    void getPermissionStatus().then((perm) => {
                      setPermGranted(perm.granted);
                      setPermCanAskAgain(perm.canAskAgain);
                    });
                  });
                else void Linking.openSettings();
              }}
              hitSlop={6}
            >
              <Text style={styles.permLink}>
                {permCanAskAgain ? "Povolit notifikace" : "Otevřít Nastavení"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {settings.enabled && permGranted ? (
        <>
          <Text style={styles.sectionLabel}>Režim připomínek</Text>
          <View style={styles.modeRow}>
            <CategoryChip
              label="Vlastní rozvrh"
              active={settings.mode === "schedule"}
              onPress={() => setMode("schedule")}
            />
            <CategoryChip
              label="Náhodně"
              active={settings.mode === "random"}
              onPress={() => setMode("random")}
            />
          </View>

          {settings.mode === "schedule" ? (
            <>
              <Text style={styles.sectionLabel}>Dny</Text>
              <View style={styles.dayRow}>
                {WEEKDAY_LABELS.map((label, idx) => (
                  <DayChip
                    key={label}
                    label={label}
                    active={settings.days[idx] ?? false}
                    onPress={() => toggleDay(idx)}
                  />
                ))}
              </View>
              <View style={styles.presetRow}>
                <PresetLink
                  label="Každý den"
                  active={presetActive.every}
                  onPress={() => setPresetDays(ALL_DAYS)}
                />
                <PresetLink
                  label="Všední dny"
                  active={presetActive.weekdays}
                  onPress={() => setPresetDays(WEEKDAYS_ONLY)}
                />
                <PresetLink
                  label="Víkend"
                  active={presetActive.weekend}
                  onPress={() => setPresetDays(WEEKEND_ONLY)}
                />
              </View>

              <Text style={styles.sectionLabel}>Čas</Text>
              <Pressable
                onPress={openTimePicker}
                style={({ pressed }) => [
                  styles.timePill,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name="schedule"
                  size={18}
                  color={Palette.brandDark}
                />
                <Text style={styles.timePillLabel}>
                  {formatTime(settings.hour, settings.minute)}
                </Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={Palette.textMuted}
                />
              </Pressable>

              {noDays ? (
                <Text style={styles.warn}>
                  Vyber aspoň jeden den, jinak nic nenaplánujeme.
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Kolikrát denně</Text>
              <View style={styles.modeRow}>
                <CategoryChip
                  label="1×"
                  active={settings.perDay === 1}
                  onPress={() => setPerDay(1)}
                />
                <CategoryChip
                  label="2×"
                  active={settings.perDay === 2}
                  onPress={() => setPerDay(2)}
                />
                <CategoryChip
                  label="3×"
                  active={settings.perDay === 3}
                  onPress={() => setPerDay(3)}
                />
              </View>
              <Text style={styles.hint}>Náhodně mezi 9:00 a 21:00.</Text>
            </>
          )}

          {noVocab ? (
            <Text style={styles.warn}>
              V knihovně zatím nejsou žádná slovíčka. Přidej si je, ať máme z
              čeho vybírat.
            </Text>
          ) : null}

          <Text style={styles.footer}>
            Připomínky běží jen na tomto telefonu. Plánujeme je dopředu lokálně,
            takže fungují i bez internetu.
          </Text>
        </>
      ) : null}

      {Platform.OS === "ios" && showIosPicker ? (
        <Modal
          transparent
          animationType="fade"
          visible={showIosPicker}
          onRequestClose={() => setShowIosPicker(false)}
        >
          <Pressable
            style={styles.iosBackdrop}
            onPress={() => setShowIosPicker(false)}
          >
            <Pressable
              style={styles.iosSheet}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.iosTitle}>Vyber čas</Text>
              <DateTimePicker
                value={dateFromHourMinute(settings.hour, settings.minute)}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_event, selected) => {
                  if (selected)
                    handleTimePicked(
                      selected.getHours(),
                      selected.getMinutes(),
                    );
                }}
              />
              <Pressable
                onPress={() => setShowIosPicker(false)}
                style={({ pressed }) => [
                  styles.iosDone,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.iosDoneLabel}>Hotovo</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function DayChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayChip,
        active && styles.dayChipActive,
        pressed && !active && styles.pressed,
      ]}
    >
      <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PresetLink({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: { ...Typography.sectionTitle, color: Palette.textStrong },
  subtitle: { ...Typography.small, color: Palette.textMuted, lineHeight: 18 },
  sectionLabel: {
    ...Typography.smallStrong,
    color: Palette.textMuted,
    marginTop: Spacing.xs,
  },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  hint: { ...Typography.small, color: Palette.textMuted, fontStyle: "italic" },
  dayRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayChip: {
    minWidth: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: "center",
  },
  dayChipActive: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brandDark,
  },
  dayChipLabel: {
    ...Typography.smallStrong,
    color: Palette.textStrong,
    fontSize: 13,
  },
  dayChipLabelActive: { color: Palette.textInverse },
  presetRow: { flexDirection: "row", gap: Spacing.lg, flexWrap: "wrap" },
  presetLabel: {
    ...Typography.smallStrong,
    color: Palette.textMuted,
    fontSize: 12,
  },
  presetLabelActive: {
    color: Palette.brandDark,
    textDecorationLine: "underline",
  },
  timePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandSoft,
    borderWidth: 1,
    borderColor: Palette.brand,
  },
  timePillLabel: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 18,
    color: Palette.brandDark,
  },
  warn: { ...Typography.small, color: Palette.danger },
  footer: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
  },
  permBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.accentSoft,
    borderWidth: 1,
    borderColor: Palette.danger,
  },
  permTitle: { ...Typography.smallStrong, color: Palette.danger, fontSize: 13 },
  permLink: {
    ...Typography.smallStrong,
    color: Palette.brandDark,
    textDecorationLine: "underline",
    fontSize: 13,
  },
  pressed: { opacity: 0.85 },
  iosBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  iosSheet: {
    backgroundColor: Palette.surface,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  iosTitle: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 18,
    color: Palette.textStrong,
    textAlign: "center",
  },
  iosDone: {
    alignSelf: "stretch",
    backgroundColor: Palette.brand,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  iosDoneLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Palette.textInverse,
  },
});
