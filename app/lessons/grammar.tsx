import { StyleSheet, Text, View } from "react-native";

import grammarFallback from "@/assets/data/grammar.json";
import type { GrammarData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function GrammarScreen() {
  const { data } = useSyncedJson("grammar", grammarFallback as GrammarData);
  const tts = useItalianTts();
  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Gramatika" subtitle="Časování sloves a věty" />

      {data.verbs.map((verb) => (
        <SectionCard
          key={verb.id}
          title={verb.title}
          tone="brand"
          trailing={<PlayButton size="sm" onPress={() => tts.speak(verb.rows.map((r) => r[1]).join(", "))} />}
        >
          <View style={styles.tableHead}>
            <Text style={[styles.cell, styles.cellHead, { flex: 0.9 }]}>Osoba</Text>
            <Text style={[styles.cell, styles.cellHead, { flex: 1.4 }]}>Italsky</Text>
            <Text style={[styles.cell, styles.cellHead, { flex: 1.1 }]}>Česky</Text>
          </View>
          {verb.rows.map((row, idx) => (
            <View
              key={`${verb.id}-${idx}`}
              style={[styles.tableRow, idx === verb.rows.length - 1 && styles.tableRowLast]}
            >
              <Text style={[styles.cell, { flex: 0.9 }]}>{row[0]}</Text>
              <View style={{ flex: 1.4 }}>
                <Text style={[styles.cell, styles.cellIt]}>{row[1]}</Text>
                {row[3] ? <Text style={styles.cellPron}>{row[3]}</Text> : null}
              </View>
              <Text style={[styles.cell, { flex: 1.1 }]}>{row[2]}</Text>
            </View>
          ))}
        </SectionCard>
      ))}

      <SectionCard title="Stavba věty" tone="accent">
        <View style={{ gap: Spacing.md }}>
          {data.rules.map((rule, idx) => (
            <View key={`${rule.rule}-${idx}`} style={styles.ruleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.ruleTitle}>{rule.rule}</Text>
                <Text style={styles.ruleExample}>{rule.example}</Text>
                {rule.p ? <Text style={styles.rulePron}>{rule.p}</Text> : null}
                <Text style={styles.ruleTrans}>{rule.translation}</Text>
              </View>
              <PlayButton size="sm" onPress={() => tts.speak(rule.example)} />
            </View>
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tableHead: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  cell: { ...Typography.body, color: Palette.text, fontSize: 14 },
  cellHead: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cellIt: { color: Palette.textStrong, fontFamily: Typography.bodyStrong.fontFamily },
  cellPron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 11,
    marginTop: 2,
  },
  rulePron: {
    ...Typography.small,
    color: Palette.brandDark,
    fontStyle: "italic",
    fontSize: 12,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.accentSoft,
  },
  ruleTitle: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.textStrong,
    fontSize: 14,
  },
  ruleExample: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.accent,
    fontSize: 14,
    fontStyle: "italic",
  },
  ruleTrans: { ...Typography.small, color: Palette.text },
});
