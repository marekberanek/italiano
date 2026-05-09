import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { VocabWord } from "@/assets/data/types";
import { PlayButton } from "@/components/play-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useVocabStore } from "@/hooks/use-vocab-store";

type Direction = "it-cz" | "cz-it";

export default function QuizScreen() {
  const tts = useItalianTts();
  const { state, drawCard, recordAnswer, stats } = useVocabStore();
  const [direction, setDirection] = useState<Direction>("it-cz");
  const [active, setActive] = useState(false);
  const [card, setCard] = useState<VocabWord | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (active && !card) {
      const next = drawCard();
      if (!next) setActive(false);
      else setCard(next);
    }
  }, [active, card, drawCard]);

  const start = () => {
    const next = drawCard();
    if (!next) return;
    setCard(next);
    setRevealed(false);
    setActive(true);
  };

  const stop = () => {
    setActive(false);
    setCard(null);
    setRevealed(false);
    tts.stop();
  };

  const answer = (correct: boolean) => {
    if (!card) return;
    recordAnswer(card.id, correct);
    const next = drawCard(card.id);
    if (!next) {
      stop();
      return;
    }
    setCard(next);
    setRevealed(false);
  };

  const progress = stats.total === 0 ? 0 : stats.learned / stats.total;

  if (!active || !card) {
    return (
      <Screen>
        <ScreenHeader title="Opakování" subtitle="3× správně a slovo je naučené" />
        {state.vocab.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="library-books" size={44} color={Palette.textMuted} />
            <Text style={styles.emptyTitle}>Nejdřív přidej slovíčka</Text>
            <Text style={styles.emptyHint}>
              Otevři záložku Slovíčka nebo si nech přeložit nové slovo v Hledání.
            </Text>
          </View>
        ) : (
          <View style={styles.startCard}>
            <Text style={styles.startTitle}>🎯 Připraveno k opakování</Text>
            <Text style={styles.startSubtitle}>
              Naučeno {stats.learned} z {stats.total}
            </Text>
            <DirectionToggle value={direction} onChange={setDirection} />
            <PrimaryButton label="▶ Začít" onPress={start} style={{ width: "100%" }} />
          </View>
        )}
      </Screen>
    );
  }

  const ask = direction === "it-cz" ? card.it : card.cz;
  const answer1 = direction === "it-cz" ? card.cz : card.it;
  const hint = direction === "it-cz" ? "PŘELOŽ DO ČEŠTINY" : "PŘELOŽ DO ITALŠTINY";

  return (
    <Screen scroll={false}>
      <View style={styles.scrollSpacer} />
      <ScreenHeader title="Opakování" subtitle="3× správně a slovo je naučené" />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>Tvůj postup</Text>
        <Text style={styles.progressCount}>
          {stats.learned} z {stats.total} naučeno
        </Text>
      </View>

      <DirectionToggle value={direction} onChange={setDirection} />

      <View style={styles.card}>
        <Text style={styles.hint}>{hint}</Text>
        <Text style={styles.word}>{ask}</Text>
        {direction === "it-cz" ? (
          <PlayButton onPress={() => tts.speak(card.it)} />
        ) : null}
        {direction === "it-cz" && card.p ? (
          <Text style={styles.cardPron}>{card.p}</Text>
        ) : null}
        {revealed ? (
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Odpověď</Text>
            <Text style={styles.answer}>{answer1}</Text>
            {direction === "cz-it" ? (
              <PlayButton onPress={() => tts.speak(card.it)} size="sm" />
            ) : null}
          </View>
        ) : null}
      </View>

      {!revealed ? (
        <PrimaryButton label="Zobrazit odpověď" onPress={() => setRevealed(true)} />
      ) : (
        <View style={styles.answersRow}>
          <PrimaryButton
            label="Nevěděl"
            variant="danger"
            icon={<MaterialIcons name="close" size={18} color={Palette.danger} />}
            onPress={() => answer(false)}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label="Věděl"
            variant="success"
            icon={<MaterialIcons name="check" size={18} color={Palette.textInverse} />}
            onPress={() => answer(true)}
            style={{ flex: 1 }}
          />
        </View>
      )}

      <Pressable onPress={stop} hitSlop={6} style={({ pressed }) => [styles.stopRow, pressed && { opacity: 0.5 }]}>
        <MaterialIcons name="undo" size={14} color={Palette.textMuted} />
        <Text style={styles.stopLabel}>Ukončit opakování</Text>
      </Pressable>
    </Screen>
  );
}

function DirectionToggle({
  value,
  onChange,
}: {
  value: Direction;
  onChange: (d: Direction) => void;
}) {
  return (
    <View style={styles.toggle}>
      <ToggleItem label="IT → CZ" active={value === "it-cz"} onPress={() => onChange("it-cz")} />
      <ToggleItem label="CZ → IT" active={value === "cz-it"} onPress={() => onChange("cz-it")} />
    </View>
  );
}

function ToggleItem({
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
      style={[styles.toggleItem, active && styles.toggleItemActive]}
    >
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollSpacer: { height: 0 },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: { ...Typography.bodyStrong, color: Palette.textStrong, fontSize: 16 },
  emptyHint: {
    ...Typography.small,
    color: Palette.textMuted,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  startCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: "center",
  },
  startTitle: { fontFamily: Typography.display.fontFamily, fontSize: 18, color: Palette.textStrong },
  startSubtitle: { ...Typography.small, color: Palette.textMuted },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceMuted,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Palette.brand, borderRadius: Radius.pill },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { ...Typography.small, color: Palette.textMuted },
  progressCount: { ...Typography.smallStrong, color: Palette.brandDark },
  toggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    padding: 4,
  },
  toggleItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  toggleItemActive: { backgroundColor: Palette.surface, ...Shadow.card },
  toggleLabel: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textMuted,
    fontSize: 13,
  },
  toggleLabelActive: { color: Palette.textStrong },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl + 4,
    gap: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow.pop,
  },
  hint: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 11,
    letterSpacing: 1.6,
    color: Palette.accent,
  },
  word: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 38,
    color: Palette.textStrong,
    textAlign: "center",
  },
  cardPron: { ...Typography.bodyStrong, color: Palette.textMuted, fontStyle: "italic" },
  answerBox: {
    width: "100%",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    alignItems: "center",
    gap: Spacing.sm,
  },
  answerLabel: { ...Typography.caption, color: Palette.textMuted, letterSpacing: 1.4 },
  answer: { fontFamily: Typography.display.fontFamily, fontSize: 22, color: Palette.brandDark },
  answersRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  stopRow: {
    flexDirection: "row",
    gap: Spacing.xs + 2,
    alignSelf: "center",
    alignItems: "center",
  },
  stopLabel: { ...Typography.smallStrong, color: Palette.textMuted, fontSize: 13 },
});
