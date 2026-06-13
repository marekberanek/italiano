import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import grammarFallback from "@/assets/data/grammar.json";
import type { GrammarData, VerbConjugation, VerbTense, VerbTenseId } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import type { ColorPalette } from "@/constants/theme";
import { Radius, SearchFieldMetrics, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

/** Extracts the bare infinitive (e.g. "ESSERE — být" -> "ESSERE"). */
function shortLabel(verb: VerbConjugation): string {
  const head = verb.title.split(/[—–-]/)[0]?.trim();
  return head && head.length > 0 ? head : verb.title;
}

/** Czech meaning from title (e.g. "ESSERE — být" -> "být"). */
function czechMeaning(verb: VerbConjugation): string {
  const parts = verb.title.split(/[—–]/);
  if (parts.length < 2) return "";
  return parts.slice(1).join("—").trim().toLowerCase();
}

function resolveTenses(verb: VerbConjugation): VerbTense[] {
  if (verb.tenses && verb.tenses.length > 0) return verb.tenses;
  const rows = verb.rows ?? [];
  return [{ id: "presente", label: "Přítomný", rows }];
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
  const styles = useThemedStyles(createStyles);
  const { palette } = useTheme();
  const { data } = useSyncedJson("grammar", grammarFallback as GrammarData);
  const tts = useItalianTts();

  const verbs = data.verbs;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(verbs[0]?.id ?? "");
  const [tenseId, setTenseId] = useState<VerbTenseId>("presente");

  const filteredVerbs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return verbs;
    return verbs.filter((verb) => {
      const inf = shortLabel(verb).toLowerCase();
      const cz = czechMeaning(verb);
      return inf.includes(q) || cz.includes(q);
    });
  }, [verbs, searchQuery]);

  const selected = useMemo(
    () => filteredVerbs.find((v) => v.id === selectedId) ?? filteredVerbs[0] ?? verbs[0],
    [filteredVerbs, selectedId, verbs],
  );

  const tenses = useMemo(() => (selected ? resolveTenses(selected) : []), [selected]);
  const activeTense = useMemo(
    () => tenses.find((t) => t.id === tenseId) ?? tenses[0],
    [tenses, tenseId],
  );
  const activeRows = activeTense?.rows ?? [];

  useEffect(() => {
    setTenseId("presente");
  }, [selected?.id]);

  useEffect(() => {
    if (filteredVerbs.length === 0) return;
    if (!filteredVerbs.some((v) => v.id === selectedId)) {
      setSelectedId(filteredVerbs[0].id);
    }
  }, [filteredVerbs, selectedId]);

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
      <ScreenHeader title="Slovesa" subtitle="Časování: 7 časů a způsobů" />

      {verbs.length > 0 ? (
        <>
          <View style={styles.searchRow}>
            <MaterialIcons
              name="search"
              size={SearchFieldMetrics.iconSize}
              color={palette.textMuted}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Hledat sloveso (italsky nebo česky)"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Vymazat hledání"
                style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
              >
                <MaterialIcons name="close" size={16} color={palette.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {filteredVerbs.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              {filteredVerbs.map((verb) => {
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
          ) : (
            <Text style={styles.emptyHint}>Žádné sloveso neodpovídá hledání.</Text>
          )}
        </>
      ) : null}

      {selected && tenses.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tenseRow}
          style={styles.tenseScroll}
        >
          {tenses.map((tense) => (
            <CategoryChip
              key={`${selected.id}-${tense.id}`}
              label={tense.label}
              active={tense.id === activeTense?.id}
              onPress={() => setTenseId(tense.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {selected && activeRows.length > 0 ? (
        <SectionCard key={`${selected.id}-${activeTense?.id}`} title={selected.title} tone="brand">
          <View style={styles.tableHead}>
            <Text style={[styles.cell, styles.cellHead, { flex: 1 }]}>Osoba</Text>
            <Text style={[styles.cell, styles.cellHead, { flex: 2 }]}>Italsky</Text>
            <View style={styles.cellAction} />
          </View>
          {activeRows.map((row, idx) => (
            <View
              key={`${selected.id}-${activeTense?.id}-${idx}`}
              style={[styles.tableRow, idx === activeRows.length - 1 && styles.tableRowLast]}
            >
              <Text style={[styles.cell, { flex: 1 }]}>{row[0]}</Text>
              <View style={{ flex: 2 }}>
                <Text style={[styles.cell, styles.cellIt]}>{row[1]}</Text>
                {row[2] ? <Text style={styles.cellCz}>{row[2]}</Text> : null}
                {row[3] ? <Text style={styles.cellPron}>{row[3]}</Text> : null}
              </View>
              <View style={styles.cellAction}>
                {row[1] ? (
                  <PlayButton
                    size="sm"
                    onPress={() => tts.speak(speakablePhrase(row[0], row[1]))}
                  />
                ) : null}
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </Screen>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SearchFieldMetrics.gap,
      paddingHorizontal: SearchFieldMetrics.paddingH,
      backgroundColor: p.surface,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: p.border,
      minHeight: SearchFieldMetrics.minHeight,
      marginBottom: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.body.fontFamily,
      fontSize: Platform.OS === "web" ? 16 : SearchFieldMetrics.fontSize,
      lineHeight: SearchFieldMetrics.lineHeight,
      color: p.textStrong,
      ...Platform.select({ web: { outlineStyle: "none" } as object }),
    },
    clearBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceMuted,
    },
    emptyHint: {
      ...Typography.body,
      color: p.textMuted,
      marginBottom: Spacing.md,
    },
    chipsScroll: {
      marginBottom: Spacing.sm,
    },
    chipsRow: {
      paddingVertical: 4,
      paddingHorizontal: 2,
      gap: Spacing.sm,
    },
    tenseScroll: {
      marginBottom: Spacing.md,
    },
    tenseRow: {
      paddingVertical: 4,
      paddingHorizontal: 2,
      gap: Spacing.sm,
    },
    tableHead: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    tableRowLast: { borderBottomWidth: 0 },
    cell: { ...Typography.body, color: p.text, fontSize: 17 },
    cellHead: {
      fontFamily: Typography.bodyStrong.fontFamily,
      color: p.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    cellIt: { color: p.textStrong, fontFamily: Typography.bodyStrong.fontFamily, fontSize: 19 },
    cellCz: {
      ...Typography.small,
      color: p.text,
      fontSize: 14,
      marginTop: 2,
    },
    cellPron: {
      ...Typography.small,
      color: p.textMuted,
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
}
