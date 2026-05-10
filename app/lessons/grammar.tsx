import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import grammarFallback from "@/assets/data/grammar.json";
import type { GrammarData, VerbConjugation } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

/** Extracts the bare infinitive (e.g. "ESSERE — být" -> "ESSERE"). */
function shortLabel(verb: VerbConjugation): string {
  const head = verb.title.split(/[—–-]/)[0]?.trim();
  return head && head.length > 0 ? head : verb.title;
}

/**
 * Builds a TTS-friendly phrase out of a conjugation row.
 *
 * Why: very short Italian forms (`è`, `ho`, `ha`, `va`, `fa`, `do`) are read
 * by iOS Speech as the letter name (e.g. "è" → "e accento grave"). Speaking
 * the full pronoun + form ("lui è") is natural Italian, more educational, and
 * forces the engine to treat the verb as a word, not a letter.
 *
 * `lui/lei` is collapsed to `lui` because Speech can't pronounce the slash.
 */
function speakablePhrase(pronoun: string, form: string): string {
  const cleanedPronoun = pronoun.split("/")[0]?.trim() ?? pronoun;
  return `${cleanedPronoun} ${form}`.trim();
}

export default function GrammarScreen() {
  const { data } = useSyncedJson("grammar", grammarFallback as GrammarData);
  const tts = useItalianTts();

  const verbs = data.verbs;
  const [selectedId, setSelectedId] = useState<string>(verbs[0]?.id ?? "");
  const selected = useMemo(
    () => verbs.find((v) => v.id === selectedId) ?? verbs[0],
    [verbs, selectedId],
  );

  const scrollRef = useRef<ScrollView>(null);
  const offsetsRef = useRef<Record<string, number>>({});

  const onSelect = (id: string) => {
    setSelectedId(id);
    const x = offsetsRef.current[id];
    if (typeof x === "number") {
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
    }
  };

  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Slovesa" subtitle="Časování v přítomném čase" />

      {verbs.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {verbs.map((verb) => {
            const isActive = verb.id === selected?.id;
            return (
              <CategoryChip
                key={verb.id}
                label={shortLabel(verb)}
                active={isActive}
                uppercase
                onPress={() => onSelect(verb.id)}
                onLayoutX={(x) => {
                  offsetsRef.current[verb.id] = x;
                }}
              />
            );
          })}
        </ScrollView>
      ) : null}

      {selected ? (
        <SectionCard key={selected.id} title={selected.title} tone="brand">
          <View style={styles.tableHead}>
            <Text style={[styles.cell, styles.cellHead, { flex: 1 }]}>Osoba</Text>
            <Text style={[styles.cell, styles.cellHead, { flex: 2 }]}>Italsky</Text>
            <View style={styles.cellAction} />
          </View>
          {selected.rows.map((row, idx) => (
            <View
              key={`${selected.id}-${idx}`}
              style={[styles.tableRow, idx === selected.rows.length - 1 && styles.tableRowLast]}
            >
              <Text style={[styles.cell, { flex: 1 }]}>{row[0]}</Text>
              <View style={{ flex: 2 }}>
                <Text style={[styles.cell, styles.cellIt]}>{row[1]}</Text>
                {row[3] ? <Text style={styles.cellPron}>{row[3]}</Text> : null}
              </View>
              <View style={styles.cellAction}>
                <PlayButton
                  size="sm"
                  onPress={() => tts.speak(speakablePhrase(row[0], row[1]))}
                />
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsScroll: {
    marginBottom: Spacing.md,
  },
  chipsRow: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: Spacing.sm,
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  cell: { ...Typography.body, color: Palette.text, fontSize: 17 },
  cellHead: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cellIt: { color: Palette.textStrong, fontFamily: Typography.bodyStrong.fontFamily, fontSize: 19 },
  cellPron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 13,
    marginTop: 2,
  },
  cellAction: {
    width: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
