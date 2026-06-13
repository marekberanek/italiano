import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import curatedVocabFallback from "@/assets/data/curated-vocab.json";
import type { CuratedVocabData, CuratedVocabItem } from "@/assets/data/types";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";
import { useVocabStore } from "@/hooks/use-vocab-store";
import { italianToCzechPron } from "@/lib/pronunciation/italian-pron";

const UNCATEGORIZED = "ostatní";
const ALL_FILTER = "__all__";

/** Normalises an italian phrase for duplicate detection (case-/space-insensitive). */
function normIt(s: string): string {
  return s.trim().toLowerCase();
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Tone rotates so consecutive section cards have different accent dots. */
const SECTION_TONES = ["brand", "accent", "ochre", "navy"] as const;
type SectionTone = (typeof SECTION_TONES)[number];

type Group = { tag: string; items: CuratedVocabItem[] };

export default function CuratedVocabScreen() {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data } = useSyncedJson("curated-vocab", curatedVocabFallback as CuratedVocabData);
  const tts = useItalianTts();
  const { state, addWord } = useVocabStore();
  const [filter, setFilter] = useState<string>(ALL_FILTER);

  /** Lookup of italian phrases the user already has in their personal vocab. */
  const ownedItalianSet = useMemo(
    () => new Set(state.vocab.map((w) => normIt(w.it))),
    [state.vocab],
  );

  /** Group items by their first tag, preserving the order in which tags first appear. */
  const groups = useMemo<Group[]>(() => {
    const order: string[] = [];
    const buckets = new Map<string, CuratedVocabItem[]>();
    for (const item of data.items) {
      const tag = (item.tags && item.tags[0]) || UNCATEGORIZED;
      if (!buckets.has(tag)) {
        buckets.set(tag, []);
        order.push(tag);
      }
      buckets.get(tag)!.push(item);
    }
    return order.map((tag) => ({ tag, items: buckets.get(tag)! }));
  }, [data.items]);

  const visibleGroups = useMemo(
    () => (filter === ALL_FILTER ? groups : groups.filter((g) => g.tag === filter)),
    [filter, groups],
  );
  const visibleCount = useMemo(
    () => visibleGroups.reduce((sum, g) => sum + g.items.length, 0),
    [visibleGroups],
  );

  return (
    <Screen>
      <ScreenHeader
        showBack
        title="Výběr slovíček"
        subtitle={
          filter === ALL_FILTER
            ? `${data.items.length} základních slovíček a frází`
            : `${visibleCount} ${visibleCount === 1 ? "položka" : "položek"} v kategorii „${filter}“`
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <CategoryChip
          label="Vše"
          count={data.items.length}
          active={filter === ALL_FILTER}
          onPress={() => setFilter(ALL_FILTER)}
        />
        {groups.map((g) => (
          <CategoryChip
            key={g.tag}
            label={capitalize(g.tag)}
            count={g.items.length}
            active={filter === g.tag}
            onPress={() => setFilter(g.tag)}
          />
        ))}
      </ScrollView>

      <View style={styles.intro}>
        <MaterialIcons name="info-outline" size={16} color={palette.textMuted} />
        <Text style={styles.introText}>
          Klepni na <Text style={styles.introStrong}>+</Text> a slovíčko se přidá do tvých{" "}
          <Text style={styles.introStrong}>Slovíček</Text> k procvičování.
        </Text>
      </View>

      {visibleGroups.map((group, idx) => {
        const tone: SectionTone = SECTION_TONES[idx % SECTION_TONES.length]!;
        return (
          <SectionCard
            key={group.tag}
            title={capitalize(group.tag)}
            subtitle={`${group.items.length} ${group.items.length === 1 ? "položka" : "položek"}`}
            tone={tone}
          >
            <View style={{ gap: Spacing.sm + 2 }}>
              {group.items.map((item, j) => (
                <CuratedRow
                  key={`${item.it}-${j}`}
                  item={item}
                  owned={ownedItalianSet.has(normIt(item.it))}
                  onSpeak={() => tts.speak(item.it)}
                  onAdd={() => addWord({ it: item.it, cz: item.cz })}
                />
              ))}
            </View>
          </SectionCard>
        );
      })}
    </Screen>
  );
}

function CuratedRow({
  item,
  owned,
  onSpeak,
  onAdd,
}: {
  item: CuratedVocabItem;
  owned: boolean;
  onSpeak: () => void;
  onAdd: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  // Pronunciation is generated locally — `italianToCzechPron` is cheap, but
  // memoise per-item so the giant list stays stable on re-renders.
  const pron = useMemo(() => italianToCzechPron(item.it), [item.it]);
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.it}>{item.it}</Text>
        <Text style={styles.cz}>{item.cz}</Text>
        {pron ? <Text style={styles.pron}>{pron}</Text> : null}
      </View>
      <PlayButton size="sm" onPress={onSpeak} />
      <AddButton added={owned} onPress={owned ? () => undefined : onAdd} />
    </View>
  );
}

function AddButton({ added, onPress }: { added: boolean; onPress: () => void }) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={added}
      hitSlop={6}
      style={({ pressed }) => [
        styles.addBtn,
        added ? styles.addBtnDone : styles.addBtnIdle,
        pressed && !added && { opacity: 0.7 },
      ]}
    >
      <MaterialIcons
        name={added ? "check" : "add"}
        size={20}
        color={added ? palette.brandDark : palette.textInverse}
      />
    </Pressable>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
  chipsRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.lg,
  },
  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  introText: {
    ...Typography.small,
    color: p.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  introStrong: { ...Typography.smallStrong, color: p.textStrong },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.brandSoft,
  },
  rowText: { flex: 1, gap: 2 },
  it: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: p.textStrong,
    fontSize: 16,
    fontStyle: "italic",
  },
  cz: { ...Typography.body, color: p.text, fontSize: 14 },
  pron: { ...Typography.small, color: p.text, fontStyle: "italic", fontSize: 13 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnIdle: { backgroundColor: p.brand },
  addBtnDone: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: p.brand,
  },
  });
}
