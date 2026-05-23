import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import grammarFallback from "@/assets/data/grammar.json";
import type { GrammarData, GrammarRule } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";
import {
  RULE_CATEGORIES,
  groupRulesByCategory,
  type RuleCategoryId,
} from "@/lib/grammar/rule-categories";

export default function SentenceStructureScreen() {
  const styles = useThemedStyles(createStyles);
  const { data } = useSyncedJson("grammar", grammarFallback as GrammarData);
  const tts = useItalianTts();

  const grouped = useMemo(() => groupRulesByCategory(data.rules), [data.rules]);
  const counts = useMemo(() => {
    const m = new Map<RuleCategoryId, number>();
    grouped.forEach((arr, id) => m.set(id, arr.length));
    return m;
  }, [grouped]);

  // Initial selection: first category that actually has any rules in the data.
  const initialCat: RuleCategoryId =
    RULE_CATEGORIES.find((c) => (counts.get(c.id) ?? 0) > 0)?.id ?? "articles";
  const [activeId, setActiveId] = useState<RuleCategoryId>(initialCat);
  const activeCat = RULE_CATEGORIES.find((c) => c.id === activeId)!;
  const items = grouped.get(activeId) ?? [];

  return (
    <Screen>
      <BackLink />
      <ScreenHeader
        title="Stavba věty"
        subtitle="Pravidla, předložky, časy a další gramatické jevy"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {RULE_CATEGORIES.map((c) => {
          const count = counts.get(c.id) ?? 0;
          if (count === 0) return null;
          return (
            <CategoryChip
              key={c.id}
              label={c.label}
              count={count}
              active={c.id === activeId}
              onPress={() => setActiveId(c.id)}
            />
          );
        })}
      </ScrollView>

      <SectionCard title={activeCat.label} tone="brand">
        <Text style={styles.blurb}>{activeCat.blurb}</Text>
        <View style={{ gap: Spacing.sm + 2, marginTop: Spacing.sm }}>
          {items.map((rule, idx) => (
            <RuleRow
              key={`${activeId}-${idx}`}
              rule={rule}
              onSpeak={() => tts.speak(rule.example)}
            />
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

function RuleRow({ rule, onSpeak }: { rule: GrammarRule; onSpeak: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.ruleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.ruleTitle}>{rule.rule}</Text>
        <Text style={styles.ruleExample}>{rule.example}</Text>
        {rule.p ? <Text style={styles.rulePron}>{rule.p}</Text> : null}
        <Text style={styles.ruleTrans}>{rule.translation}</Text>
      </View>
      <PlayButton size="sm" onPress={onSpeak} />
    </View>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
  chipsRow: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: Spacing.sm,
  },
  blurb: {
    ...Typography.small,
    color: p.textMuted,
    fontSize: 13,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.accentSoft,
  },
  ruleTitle: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: p.textStrong,
    fontSize: 14,
  },
  ruleExample: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: p.accent,
    fontSize: 14,
    fontStyle: "italic",
  },
  rulePron: {
    ...Typography.small,
    color: p.brandDark,
    fontStyle: "italic",
    fontSize: 12,
  },
  ruleTrans: { ...Typography.small, color: p.text },
  });
}
