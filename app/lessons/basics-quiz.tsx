import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import monthsFallback from "@/assets/data/months.json";
import numbersFallback from "@/assets/data/numbers.json";
import weekdaysFallback from "@/assets/data/weekdays.json";
import type { MonthsData, NumbersData, WeekdaysData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

const ROUNDS = 10;

type QuizKind = "day" | "month" | "number";

type QuizItem = {
  kind: QuizKind;
  promptIt: string;
  answerDisplay: string;
  speakIt: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j]!;
    a[j] = t!;
  }
  return a;
}

function buildPool(wd: WeekdaysData, md: MonthsData, nd: NumbersData): QuizItem[] {
  const pool: QuizItem[] = [];
  for (const d of wd.days) {
    pool.push({ kind: "day", promptIt: d.it, answerDisplay: d.cz, speakIt: d.it });
  }
  for (const m of md.months) {
    pool.push({ kind: "month", promptIt: m.it, answerDisplay: m.cz, speakIt: m.it });
  }
  for (const row of nd.list) {
    const n = row[0];
    const label = row[1];
    pool.push({ kind: "number", promptIt: label, answerDisplay: String(n), speakIt: label });
  }
  return pool;
}

function fourChoices(pool: QuizItem[], current: QuizItem): string[] {
  const correct = current.answerDisplay;
  const sameKind = pool.filter((p) => p.kind === current.kind && p.answerDisplay !== correct);
  const rest = pool.filter((p) => p.answerDisplay !== correct);
  const source = sameKind.length >= 3 ? sameKind : rest;
  const wrong: string[] = [];
  for (const q of shuffle(source)) {
    if (wrong.length >= 3) break;
    if (!wrong.includes(q.answerDisplay)) wrong.push(q.answerDisplay);
  }
  let i = 0;
  while (wrong.length < 3 && i < pool.length) {
    const a = pool[i]!.answerDisplay;
    if (a !== correct && !wrong.includes(a)) wrong.push(a);
    i++;
  }
  return shuffle([correct, ...wrong]);
}

function randomQuestion(pool: QuizItem[]): { q: QuizItem; choices: string[] } {
  const q = pool[Math.floor(Math.random() * pool.length)]!;
  return { q, choices: fourChoices(pool, q) };
}

export default function BasicsQuizScreen() {
  const tts = useItalianTts();
  const { data: wd } = useSyncedJson("weekdays", weekdaysFallback as WeekdaysData);
  const { data: md } = useSyncedJson("months", monthsFallback as MonthsData);
  const { data: nd } = useSyncedJson("numbers", numbersFallback as NumbersData);

  const pool = useMemo(() => buildPool(wd, md, nd), [wd, md, nd]);

  const [phase, setPhase] = useState<"home" | "play" | "done">("home");
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState<QuizItem | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const loadRandom = useCallback(() => {
    const { q, choices: ch } = randomQuestion(pool);
    setCurrent(q);
    setChoices(ch);
    setPicked(null);
  }, [pool]);

  const start = () => {
    setPhase("play");
    setScore(0);
    setRoundIdx(0);
    loadRandom();
  };

  const onPick = (opt: string) => {
    if (!current || picked) return;
    setPicked(opt);
    const ok = opt === current.answerDisplay;
    if (ok) setScore((s) => s + 1);
    const delay = ok ? 420 : 720;
    setTimeout(() => {
      setRoundIdx((r) => {
        const next = r + 1;
        if (next >= ROUNDS) {
          setPhase("done");
          setCurrent(null);
          return 0;
        }
        const { q, choices: ch } = randomQuestion(pool);
        setCurrent(q);
        setChoices(ch);
        setPicked(null);
        return next;
      });
    }, delay);
  };

  if (phase === "home") {
    return (
      <Screen>
        <BackLink />
        <ScreenHeader title="Mini kvíz" subtitle="Jen z lekcí: dny, měsíce, číslovky" />
        <View style={styles.card}>
          <Text style={styles.blurb}>
            Italský tvar — vyber správný český překlad (dny a měsíce) nebo číslici u číslovek. Obsah odpovídá
            vestaveným lekcím, ne vlastnímu slovníčku.
          </Text>
          <PrimaryButton label={`Start (${ROUNDS} otázek)`} onPress={start} style={{ width: "100%" }} />
        </View>
      </Screen>
    );
  }

  if (phase === "done") {
    return (
      <Screen>
        <BackLink />
        <ScreenHeader title="Hotovo" subtitle="Mini kvíz z lekcí" />
        <View style={styles.card}>
          <Text style={styles.resultTitle}>Výsledek</Text>
          <Text style={styles.resultScore}>
            {score} / {ROUNDS}
          </Text>
          <PrimaryButton label="Znovu" onPress={start} style={{ width: "100%" }} />
          <Pressable onPress={() => setPhase("home")} hitSlop={8} style={styles.linkBackPress}>
            <Text style={styles.linkBackText}>Zpět na úvod</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!current) return null;

  const kindLabel =
    current.kind === "day" ? "Den v týdnu" : current.kind === "month" ? "Měsíc" : "Číslovka → číslice";

  return (
    <Screen scroll={false}>
      <BackLink />
      <ScreenHeader title="Mini kvíz" subtitle={`Otázka ${roundIdx + 1} z ${ROUNDS}`} />

      <View style={styles.metaRow}>
        <Text style={styles.kindTag}>{kindLabel}</Text>
        <Text style={styles.scoreTag}>{score} bodů</Text>
      </View>

      <View style={styles.qCard}>
        <Text style={styles.promptHint}>Vyber odpověď</Text>
        <Text style={styles.promptIt}>{current.promptIt}</Text>
        <PlayButton size="sm" onPress={() => tts.speak(current.speakIt)} />
      </View>

      <View style={styles.grid4}>
        {choices.map((c) => {
          const show = picked !== null;
          const isCorrect = c === current.answerDisplay;
          const isWrongPick = show && picked === c && !isCorrect;
          const highlightCorrect = show && isCorrect;
          return (
            <Pressable
              key={c}
              onPress={() => onPick(c)}
              disabled={!!picked}
              style={[
                styles.choice,
                highlightCorrect && styles.choiceRight,
                isWrongPick && styles.choiceWrong,
              ]}
            >
              <Text style={styles.choiceText}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  blurb: { ...Typography.body, color: Palette.text, fontSize: 15, lineHeight: 22 },
  resultTitle: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 18,
    color: Palette.textStrong,
    textAlign: "center",
  },
  resultScore: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 36,
    color: Palette.brandDark,
    textAlign: "center",
  },
  linkBackPress: { alignSelf: "center", paddingVertical: Spacing.sm },
  linkBackText: { ...Typography.bodyStrong, color: Palette.accent, fontSize: 15 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  kindTag: {
    ...Typography.smallStrong,
    color: Palette.brandDark,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scoreTag: { ...Typography.small, color: Palette.textMuted, fontSize: 12 },
  qCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  promptHint: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Palette.accent,
  },
  promptIt: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 28,
    color: Palette.textStrong,
    textAlign: "center",
  },
  grid4: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm + 2 },
  choice: {
    width: "48%",
    minHeight: 56,
    borderRadius: Radius.md,
    backgroundColor: Palette.brandSoft,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  choiceRight: { backgroundColor: Palette.accentSoft, borderColor: Palette.accent },
  choiceWrong: { backgroundColor: Palette.surfaceMuted, opacity: 0.75 },
  choiceText: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 15,
    color: Palette.textStrong,
    textAlign: "center",
  },
});
