import { StyleSheet, Text, View } from "react-native";

import monthsFallback from "@/assets/data/months.json";
import type { MonthsData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function MonthsScreen() {
  const { data } = useSyncedJson("months", monthsFallback as MonthsData);
  const tts = useItalianTts();
  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Měsíce" subtitle="Gennaio … dicembre" />

      <SectionCard title="Italské měsíce" tone="ochre">
        <View style={{ gap: Spacing.sm + 2 }}>
          {data.months.map((m) => (
            <View key={m.it} style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.it}>{m.it}</Text>
                {m.p ? <Text style={styles.pron}>{m.p}</Text> : null}
                <Text style={styles.cz}>{m.cz}</Text>
              </View>
              <PlayButton size="sm" onPress={() => tts.speak(m.it)} />
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
    backgroundColor: Palette.ochreSoft,
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
