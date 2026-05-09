import { StyleSheet, Text, View } from "react-native";

import alphabetFallback from "@/assets/data/alphabet.json";
import pronRulesFallback from "@/assets/data/pron-rules.json";
import type { AlphabetData, PronunciationData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function AlphabetScreen() {
  const { data: alphabetData } = useSyncedJson("alphabet", alphabetFallback as AlphabetData);
  const { data: pronData } = useSyncedJson("pron-rules", pronRulesFallback as PronunciationData);
  const letters = alphabetData.letters;
  const rules = pronData.rules;
  const tts = useItalianTts();
  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Abeceda" subtitle="21 italských písmen" />

      <SectionCard title="Italská abeceda" tone="navy">
        <View style={styles.grid}>
          {letters.map(([letter, name, pron]) => (
            <View key={letter} style={styles.tile}>
              <Text style={styles.letter}>{letter}</Text>
              <Text style={styles.name}>{name}</Text>
              {pron ? <Text style={styles.pron}>{pron}</Text> : null}
              <PlayButton size="sm" onPress={() => tts.speak(name)} />
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Pravidla výslovnosti" tone="brand">
        <View style={{ gap: Spacing.sm + 2 }}>
          {rules.map((r) => (
            <View key={r.combo} style={styles.ruleRow}>
              <View style={styles.ruleCombo}>
                <Text style={styles.ruleComboText}>{r.combo}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rulePron}>= {r.pronunciation}</Text>
                <Text style={styles.ruleExample}>{r.example}</Text>
              </View>
              <PlayButton size="sm" onPress={() => tts.speak(r.example.split("→")[0].trim())} />
            </View>
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm + 2,
  },
  tile: {
    width: "30%",
    backgroundColor: Palette.navySoft,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    alignItems: "center",
    gap: 4,
  },
  letter: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 22,
    color: Palette.navy,
  },
  name: {
    ...Typography.small,
    color: Palette.text,
    fontSize: 11,
  },
  pron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 11,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.brandSoft,
  },
  ruleCombo: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Palette.brand,
    alignItems: "center",
  },
  ruleComboText: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textInverse,
    fontSize: 13,
  },
  rulePron: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.brandDark,
    fontSize: 14,
  },
  ruleExample: {
    ...Typography.small,
    color: Palette.text,
    fontStyle: "italic",
  },
});
