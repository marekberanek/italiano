import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import numbersFallback from "@/assets/data/numbers.json";
import type { NumbersData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

type Section = "basic" | "composition";

export default function NumbersScreen() {
  const { data } = useSyncedJson("numbers", numbersFallback as NumbersData);
  const tts = useItalianTts();
  const [section, setSection] = useState<Section>("basic");

  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Číslovky" subtitle="0–1000 + skládání" />

      <View style={styles.chipsRow}>
        <CategoryChip
          label="Základní"
          count={data.list.length}
          active={section === "basic"}
          onPress={() => setSection("basic")}
        />
        <CategoryChip
          label="Skládání"
          count={data.composition.length}
          active={section === "composition"}
          onPress={() => setSection("composition")}
        />
      </View>

      {section === "basic" ? (
        <SectionCard title="Základní čísla" tone="ochre">
          <View style={styles.grid}>
            {data.list.map(([num, label, pron]) => (
              <View key={num} style={styles.cell}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.num}>{num}</Text>
                  <Text style={styles.label}>{label}</Text>
                  {pron ? <Text style={styles.pron}>{pron}</Text> : null}
                </View>
                <PlayButton size="sm" onPress={() => tts.speak(label)} />
              </View>
            ))}
          </View>
        </SectionCard>
      ) : (
        <SectionCard title="Skládání čísel" tone="brand">
          <View style={{ gap: Spacing.sm }}>
            {data.composition.map(([num, label, pron]) => (
              <View key={num} style={styles.compRow}>
                <Text style={styles.compNum}>{num}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compLabel}>{label}</Text>
                  {pron ? <Text style={styles.pron}>{pron}</Text> : null}
                </View>
                <PlayButton size="sm" onPress={() => tts.speak(label)} />
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm + 2,
  },
  cell: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.ochreSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  num: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.ochre,
    fontSize: 18,
  },
  label: {
    ...Typography.small,
    color: Palette.text,
    fontSize: 12,
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.brandSoft,
  },
  compNum: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.brandDark,
    fontSize: 18,
    minWidth: 36,
  },
  compLabel: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textStrong,
    fontSize: 14,
  },
  pron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 11,
    marginTop: 2,
  },
});
