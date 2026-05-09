import { StyleSheet, Text, View } from "react-native";

import weekdaysFallback from "@/assets/data/weekdays.json";
import type { WeekdaysData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function WeekdaysScreen() {
  const { data } = useSyncedJson("weekdays", weekdaysFallback as WeekdaysData);
  const tts = useItalianTts();
  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Dny v týdnu" subtitle="Lunedì … domenica" />

      <SectionCard title="Italské dny" tone="brand">
        <View style={{ gap: Spacing.sm + 2 }}>
          {data.days.map((d) => (
            <View key={d.it} style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.it}>{d.it}</Text>
                {d.p ? <Text style={styles.pron}>{d.p}</Text> : null}
                <Text style={styles.cz}>{d.cz}</Text>
              </View>
              <PlayButton size="sm" onPress={() => tts.speak(d.it)} />
            </View>
          ))}
        </View>
      </SectionCard>

      {data.notes?.map((n) => (
        <SectionCard key={n.title} title={n.title} tone="navy">
          <View style={styles.noteRow}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Text style={styles.noteIt}>{n.it}</Text>
              {n.p ? <Text style={styles.pron}>{n.p}</Text> : null}
              <Text style={styles.noteCz}>{n.cz}</Text>
            </View>
            <PlayButton size="sm" onPress={() => tts.speak(n.it)} />
          </View>
        </SectionCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.brandSoft,
  },
  it: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 17,
    color: Palette.textStrong,
  },
  cz: { ...Typography.body, color: Palette.text, fontSize: 14 },
  pron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 12,
  },
  noteIt: {
    ...Typography.bodyStrong,
    color: Palette.navy,
    fontStyle: "italic",
  },
  noteCz: { ...Typography.small, color: Palette.text },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
