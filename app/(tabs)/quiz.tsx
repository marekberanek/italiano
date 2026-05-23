import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import curatedVocabFallback from "@/assets/data/curated-vocab.json";
import monthsFallback from "@/assets/data/months.json";
import numbersFallback from "@/assets/data/numbers.json";
import weekdaysFallback from "@/assets/data/weekdays.json";
import type {
  CuratedVocabData,
  MonthsData,
  NumbersData,
  VocabWord,
  WeekdaysData,
} from "@/assets/data/types";
import { PlayButton } from "@/components/play-button";
import { CategoryChip } from "@/components/category-chip";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";
import { useVocabStore } from "@/hooks/use-vocab-store";
import { answerMatchesAnyOf } from "@/lib/quiz/answer-match";
import { italianExampleCloze } from "@/lib/quiz/cloze";
import { buildLessonPool } from "@/lib/quiz/lesson-pool";
import { buildMcqOptions } from "@/lib/quiz/mcq-options";
import {
  QUIZ_LENGTH,
  QUIZ_PASS_PERCENT,
  quizStars,
  quizVerdict,
  type QuizStars,
} from "@/lib/quiz/scoring";
import type { QuizCard } from "@/lib/quiz/types";
import {
  appendQuizHistoryEntry,
  clearQuizHistory,
  loadQuizHistory,
  removeQuizHistoryEntry,
  type QuizAnswerLog,
  type QuizHistoryEntry,
} from "@/lib/storage/quiz-history";

type Direction = "it-cz" | "cz-it";
type QuizStyle = "flashcard" | "mixed" | "mcq" | "typed";
type QuizSource = "personal" | "lesson" | "all";

const HISTORY_STYLE_LABEL: Record<QuizStyle, string> = {
  mixed: "Smíšeně",
  mcq: "Výběr",
  typed: "Psaní",
  flashcard: "Kartičky",
};

const SOURCE_LABEL: Record<QuizSource, string> = {
  personal: "Moje slovíčka",
  lesson: "Lekce",
  all: "Vše",
};

function quizStyleHelp(style: QuizStyle): string {
  switch (style) {
    case "mixed":
      return "Střídá výběr ze čtyř možností a vlastní odpověď.";
    case "mcq":
      return "Vybíráš ze čtyř možností. Slovíček musí být alespoň dvě.";
    case "typed":
      return "Odpověď napíšeš sám. Diakritika ani mezery navíc nevadí.";
    case "flashcard":
      return "Nejdřív si odpověď řekneš v duchu, pak ji odkryješ a posoudíš sám.";
  }
}

function sourceHelp(source: QuizSource, personalCount: number, lessonCount: number): string {
  switch (source) {
    case "personal":
      return `Zkouší tě jen z tvých ${personalCount} slovíček v knihovně.`;
    case "lesson":
      return `Zkouší tě z ${lessonCount} slovíček z lekcí (čísla, dny, měsíce, fráze…).`;
    case "all":
      return "Smíchá tvá slovíčka i lekce do jednoho kola.";
  }
}

/** Maps a `VocabWord` into the unified `QuizCard` shape used by the screen. */
function personalCardFromVocab(w: VocabWord): QuizCard {
  return {
    uid: `personal-${w.clientUuid}`,
    source: "personal",
    personalId: w.id,
    it: w.it,
    cz: w.cz,
    p: w.p,
    exIt: w.exIt,
    exCz: w.exCz,
  };
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Builds the pool the quiz draws from for a given source. In "all" mode the
 * user's personal entries take precedence — duplicate italian phrases from the
 * lesson pool are skipped so the user's own translation/example wins.
 */
function buildPoolForSource(
  source: QuizSource,
  vocab: VocabWord[],
  lesson: QuizCard[],
): QuizCard[] {
  const personal = vocab.map(personalCardFromVocab);
  if (source === "personal") return personal;
  if (source === "lesson") return lesson;
  const seen = new Set(personal.map((p) => norm(p.it)));
  const merged = [...personal];
  for (const l of lesson) {
    if (!seen.has(norm(l.it))) merged.push(l);
  }
  return merged;
}

export default function QuizScreen() {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const tts = useItalianTts();
  const { state, addWord, hydrated: vocabHydrated, recordAnswer, learnedThreshold } = useVocabStore();
  const { startWord } = useLocalSearchParams<{ startWord?: string }>();
  const { data: weekdays } = useSyncedJson("weekdays", weekdaysFallback as WeekdaysData);
  const { data: months } = useSyncedJson("months", monthsFallback as MonthsData);
  const { data: numbers } = useSyncedJson("numbers", numbersFallback as NumbersData);
  const { data: curated } = useSyncedJson(
    "curated-vocab",
    curatedVocabFallback as CuratedVocabData,
  );

  const lessonPool = useMemo(
    () => buildLessonPool({ curated, weekdays, months, numbers }),
    [curated, weekdays, months, numbers],
  );

  const [direction, setDirection] = useState<Direction>("it-cz");
  const [quizStyle, setQuizStyle] = useState<QuizStyle>("mixed");
  const [source, setSource] = useState<QuizSource>("personal");
  const modeHelpText = useMemo(() => quizStyleHelp(quizStyle), [quizStyle]);
  const sourceHelpText = useMemo(
    () => sourceHelp(source, state.vocab.length, lessonPool.length),
    [source, state.vocab.length, lessonPool.length],
  );

  // Pool used for previewing the start screen ("X otázek na výběr"). The
  // *active* round freezes its own copy in `sessionPool` so adding new words
  // mid-round won't change the running session.
  const previewPool = useMemo(
    () => buildPoolForSource(source, state.vocab, lessonPool),
    [source, state.vocab, lessonPool],
  );

  const [sessionStyle, setSessionStyle] = useState<QuizStyle | null>(null);
  const [sessionSource, setSessionSource] = useState<QuizSource | null>(null);
  const [sessionPool, setSessionPool] = useState<QuizCard[]>([]);
  /**
   * Pool used only for MCQ distractor generation. Normally identical to
   * `sessionPool`. In single-card mode (notification deep-link) the session
   * pool is just one card, but MCQ options still need 3 plausible distractors,
   * so we widen this to include the full personal+lesson pool.
   */
  const [sessionMcqPool, setSessionMcqPool] = useState<QuizCard[]>([]);
  /** Normally `QUIZ_LENGTH`. Set to `1` for single-word notification quizzes. */
  const [sessionLength, setSessionLength] = useState<number>(QUIZ_LENGTH);
  const [active, setActive] = useState(false);
  const [card, setCard] = useState<QuizCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  /** Per-question format chosen when `sessionStyle === "mixed"` (random mcq/typed). */
  const [mixedFormat, setMixedFormat] = useState<"mcq" | "typed">(() =>
    Math.random() < 0.5 ? "mcq" : "typed",
  );
  const [mcqPicked, setMcqPicked] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");
  const [typedRevealWrong, setTypedRevealWrong] = useState(false);
  /** IDs of personal words the user has answered correctly enough to mark `learned` in this round. */
  const [sessionDoneIds, setSessionDoneIds] = useState<Set<number>>(() => new Set());
  const [sessionQuestions, setSessionQuestions] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  /** Per-question log captured during the active session. Persisted at session end. */
  const sessionLogRef = useRef<QuizAnswerLog[]>([]);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [historyDetailId, setHistoryDetailId] = useState<string | null>(null);
  /** Id of the most recently saved session — used to open its detail straight from the results screen. */
  const [lastSavedSessionId, setLastSavedSessionId] = useState<string | null>(null);

  useEffect(() => {
    void loadQuizHistory().then(setHistory);
  }, []);

  // Hide the floating tab bar while a round is in progress (questions only).
  // Per-screen `tabBarStyle` is merged by the bottom-tab navigator for the
  // focused route — no `getParent()` needed.
  useLayoutEffect(() => {
    const hide = active && !finished && isFocused;
    navigation.setOptions({
      tabBarStyle: hide ? { display: "none" } : undefined,
    });
    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [active, finished, isFocused, navigation]);

  /** Italian forms (lower-cased) the user already has in personal vocab. */
  const ownedItalianSet = useMemo(
    () => new Set(state.vocab.map((w) => w.it.trim().toLowerCase())),
    [state.vocab],
  );
  const currentCardOwned = card ? ownedItalianSet.has(card.it.trim().toLowerCase()) : false;

  const addCurrentCardToVocab = useCallback(() => {
    if (!card || card.source !== "lesson") return;
    if (ownedItalianSet.has(card.it.trim().toLowerCase())) return;
    addWord({
      it: card.it,
      cz: card.cz,
      p: card.p,
      exIt: card.exIt,
      exCz: card.exCz,
    });
  }, [addWord, card, ownedItalianSet]);

  const eff = sessionStyle;

  const currentFormat = useMemo(() => {
    if (!eff || eff === "flashcard") return "flashcard" as const;
    if (eff === "mcq") return "mcq" as const;
    if (eff === "typed") return "typed" as const;
    return mixedFormat;
  }, [eff, mixedFormat]);

  const clozeIt = card ? italianExampleCloze(card.exIt, card.it) : null;
  const hasCloze = !!clozeIt && direction === "it-cz";

  const mcqItalianOptions = hasCloze || direction === "cz-it";

  const mcqOptions = useMemo(() => {
    if (!card || currentFormat !== "mcq") return [];
    return buildMcqOptions(card, sessionMcqPool, direction, mcqItalianOptions);
  }, [card, currentFormat, direction, mcqItalianOptions, sessionMcqPool]);

  /** Picks a random card from `sessionPool`, avoiding the previously shown one. */
  const drawFromSession = useCallback(
    (excludeUid?: string): QuizCard | null => {
      if (sessionPool.length === 0) return null;
      const filtered =
        excludeUid && sessionPool.length > 1
          ? sessionPool.filter((c) => c.uid !== excludeUid)
          : sessionPool;
      return filtered[Math.floor(Math.random() * filtered.length)] ?? null;
    },
    [sessionPool],
  );

  useEffect(() => {
    if (active && !card) {
      const next = drawFromSession();
      if (!next) setActive(false);
      else setCard(next);
    }
  }, [active, card, drawFromSession]);

  /** Persists the current session as a history entry; safe to call multiple times. */
  const saveSessionToHistory = useCallback(() => {
    const startedAt = sessionStartedAtRef.current;
    if (!startedAt || sessionQuestions <= 0 || !sessionStyle || !sessionSource) return;
    const accuracy = Math.round((sessionCorrect / sessionQuestions) * 100);
    const stars = quizStars(accuracy);
    void appendQuizHistoryEntry({
      startedAt: new Date(startedAt).toISOString(),
      durationMs: Date.now() - startedAt,
      style: sessionStyle,
      direction,
      questions: sessionQuestions,
      correct: sessionCorrect,
      wordsLearned: sessionDoneIds.size,
      stars,
      source: sessionSource,
      answers: sessionLogRef.current.slice(),
    }).then((saved) => {
      if (saved) {
        setHistory((prev) => [saved, ...prev].slice(0, 30));
        setLastSavedSessionId(saved.id);
      }
    });
  }, [
    direction,
    sessionCorrect,
    sessionDoneIds,
    sessionQuestions,
    sessionSource,
    sessionStyle,
  ]);

  const stop = useCallback(() => {
    saveSessionToHistory();
    sessionStartedAtRef.current = null;
    sessionLogRef.current = [];
    setActive(false);
    setFinished(false);
    setCard(null);
    setRevealed(false);
    setSessionStyle(null);
    setSessionSource(null);
    setSessionPool([]);
    setSessionMcqPool([]);
    setSessionLength(QUIZ_LENGTH);
    setTypedInput("");
    setTypedRevealWrong(false);
    setMcqPicked(null);
    setMixedFormat(Math.random() < 0.5 ? "mcq" : "typed");
    setSessionDoneIds(new Set());
    setSessionQuestions(0);
    setSessionCorrect(0);
    tts.stop();
  }, [saveSessionToHistory, tts]);

  const start = useCallback(
    (overrides?: {
      style?: QuizStyle;
      source?: QuizSource;
      /** When set, the round draws from a one-card pool and ends after a single question. */
      singleCard?: QuizCard;
    }) => {
      let style = overrides?.style ?? quizStyle;
      const src = overrides?.source ?? source;
      const singleCard = overrides?.singleCard;
      // In singleCard mode the *drawing* pool is just one card, but MCQ
      // distractors come from the widest possible source so options stay
      // plausible.
      const distractorPool = singleCard
        ? buildPoolForSource("all", state.vocab, lessonPool)
        : buildPoolForSource(src, state.vocab, lessonPool);
      const pool = singleCard ? [singleCard] : distractorPool;
      if (pool.length === 0) {
        Alert.alert(
          "Opakování",
          src === "personal"
            ? "V knihovně zatím nemáš žádná slovíčka. Přidej si je v záložce Slovíčka, nebo přepni zdroj na Lekce."
            : "Ve zdroji nejsou žádná slovíčka.",
        );
        return;
      }
      // Need ≥2 viable options to render MCQ. Without distractors fall back to typed
      // (or refuse outright if the user explicitly picked MCQ in normal mode).
      if ((style === "mcq" || style === "mixed") && distractorPool.length < 2) {
        if (style === "mcq" && !singleCard) {
          Alert.alert(
            "Opakování",
            "Pro výběr ze čtyř možností potřebuješ aspoň dvě slovíčka. Přepni zdroj nebo zvol jiný režim.",
          );
          return;
        }
        style = "typed";
      }
      const next = singleCard ?? pool[Math.floor(Math.random() * pool.length)] ?? null;
      if (!next) return;
      setSessionPool(pool);
      setSessionMcqPool(distractorPool);
      setSessionLength(singleCard ? 1 : QUIZ_LENGTH);
      setSessionStyle(style);
      setSessionSource(src);
      setSessionDoneIds(new Set());
      setSessionQuestions(0);
      setSessionCorrect(0);
      setFinished(false);
      sessionStartedAtRef.current = Date.now();
      sessionLogRef.current = [];
      setLastSavedSessionId(null);
      setCard(next);
      setRevealed(false);
      setTypedInput("");
      setTypedRevealWrong(false);
      setMcqPicked(null);
      setMixedFormat(Math.random() < 0.5 ? "mcq" : "typed");
      setActive(true);
    },
    [lessonPool, quizStyle, source, state.vocab],
  );

  const playAgain = useCallback(() => {
    const prevStyle = sessionStyle;
    const prevSource = sessionSource;
    saveSessionToHistory();
    if (prevStyle && prevSource) start({ style: prevStyle, source: prevSource });
  }, [saveSessionToHistory, sessionSource, sessionStyle, start]);

  // Notification deep-link: open a one-card mini-quiz for the word the user
  // tapped. We consume the param immediately (router.setParams undefined) so
  // navigating back to /quiz later doesn't re-trigger the same single-card
  // round.
  const lastConsumedStartWordRef = useRef<string | null>(null);
  useEffect(() => {
    if (!startWord || !vocabHydrated) return;
    if (lastConsumedStartWordRef.current === startWord) return;
    lastConsumedStartWordRef.current = startWord;
    const word = state.vocab.find((w) => w.clientUuid === startWord);
    router.setParams({ startWord: undefined });
    if (!word) return;
    start({ singleCard: personalCardFromVocab(word) });
  }, [startWord, vocabHydrated, state.vocab, start]);

  const advanceAfterAnswer = useCallback(
    (correct: boolean, answered: QuizCard, given?: string) => {
      // Only personal cards drive the long-term streak / "learned" tracking.
      if (answered.source === "personal" && answered.personalId !== undefined) {
        recordAnswer(answered.personalId, correct);
        if (correct) {
          const w = state.vocab.find((x) => x.id === answered.personalId);
          if (w && w.streak + 1 >= learnedThreshold) {
            setSessionDoneIds((prev) => {
              if (prev.has(w.id)) return prev;
              const next = new Set(prev);
              next.add(w.id);
              return next;
            });
          }
        }
      }
      sessionLogRef.current.push({
        uid: answered.uid,
        it: answered.it,
        cz: answered.cz,
        source: answered.source,
        format: currentFormat,
        correct,
        given: given?.trim() ? given.trim() : undefined,
      });
      const nextCount = sessionQuestions + 1;
      setSessionQuestions(nextCount);
      if (correct) setSessionCorrect((n) => n + 1);
      if (eff === "mixed") setMixedFormat(Math.random() < 0.5 ? "mcq" : "typed");
      if (nextCount >= sessionLength) {
        setFinished(true);
        return;
      }
      const next = drawFromSession(answered.uid);
      if (!next) {
        setFinished(true);
        return;
      }
      setCard(next);
      setRevealed(false);
      setTypedInput("");
      setTypedRevealWrong(false);
      setMcqPicked(null);
    },
    [
      currentFormat,
      drawFromSession,
      eff,
      learnedThreshold,
      recordAnswer,
      sessionLength,
      sessionQuestions,
      state.vocab,
    ],
  );

  const answerFlashcard = (correct: boolean) => {
    if (!card) return;
    advanceAfterAnswer(correct, card);
  };

  const mcqCorrectAnswer = card
    ? mcqItalianOptions
      ? card.it.trim()
      : direction === "it-cz"
        ? card.cz.trim()
        : card.it.trim()
    : "";
  const mcqResolved = mcqPicked !== null;
  const mcqWasCorrect = mcqResolved && mcqPicked?.trim() === mcqCorrectAnswer;

  const answerMcq = (picked: string) => {
    if (!card || mcqResolved) return;
    setMcqPicked(picked);
  };

  const continueAfterMcq = () => {
    if (!card || !mcqResolved) return;
    advanceAfterAnswer(!!mcqWasCorrect, card, mcqPicked ?? undefined);
  };

  const submitTyped = () => {
    if (!card || typedRevealWrong) return;
    const wantItalian = direction === "cz-it" || mcqItalianOptions;
    const expected = wantItalian ? card.it : card.cz;
    const extras = wantItalian ? card.acceptedIt : card.acceptedCz;
    if (answerMatchesAnyOf(typedInput, expected, extras))
      advanceAfterAnswer(true, card, typedInput);
    else setTypedRevealWrong(true);
  };

  // Round progress is intentionally tied to *questions answered* (not to
  // long-term learned-streak), so the bar moves on every answer.
  const progress = Math.min(1, sessionQuestions / sessionLength);
  /** 1-indexed position of the question currently displayed (caps at session length). */
  const currentQuestionIndex = Math.min(sessionLength, sessionQuestions + 1);

  if (active && finished && sessionStyle && sessionSource) {
    const accuracy =
      sessionQuestions === 0 ? 0 : Math.round((sessionCorrect / sessionQuestions) * 100);
    const stars = quizStars(accuracy);
    const verdict = quizVerdict(accuracy);
    return (
      <Screen>
        <ScreenHeader
          title="Výsledek"
          subtitle={`${HISTORY_STYLE_LABEL[sessionStyle]} · ${SOURCE_LABEL[sessionSource]} · ${
            direction === "it-cz" ? "IT → CZ" : "CZ → IT"
          }`}
        />

        <View
          style={[
            styles.resultsCard,
            verdict.passed ? styles.resultsCardOk : styles.resultsCardFail,
          ]}
        >
          <MaterialIcons
            name={verdict.passed ? "emoji-events" : "refresh"}
            size={36}
            color={verdict.passed ? palette.brandDark : palette.danger}
          />
          <Text
            style={[
              styles.resultsTitle,
              { color: verdict.passed ? palette.brandDark : palette.danger },
            ]}
          >
            {verdict.title}
          </Text>
          <Text style={styles.resultsSubtitle}>{verdict.subtitle}</Text>
          <Text style={styles.resultsScore}>
            {sessionCorrect} <Text style={styles.resultsScoreSlash}>/ {sessionQuestions}</Text>
          </Text>
          <Text style={styles.resultsPercent}>{accuracy} %</Text>
          <StarsRow stars={stars} />
          {sessionDoneIds.size > 0 ? (
            <Text style={styles.resultsBonus}>
              +{sessionDoneIds.size} {sessionDoneIds.size === 1 ? "slovíčko" : "slovíček"} naučeno
            </Text>
          ) : null}
        </View>

        <PrimaryButton
          label="Hrát znovu"
          onPress={playAgain}
          icon={<MaterialIcons name="replay" size={20} color={palette.textInverse} />}
          style={{ width: "100%" }}
        />
        {lastSavedSessionId ? (
          <PrimaryButton
            label="Zobrazit odpovědi"
            variant="secondary"
            onPress={() => setHistoryDetailId(lastSavedSessionId)}
            icon={<MaterialIcons name="format-list-bulleted" size={20} color={palette.textStrong} />}
            style={{ width: "100%" }}
          />
        ) : null}
        <Pressable
          onPress={stop}
          hitSlop={6}
          style={({ pressed }) => [styles.stopRow, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name="undo" size={14} color={palette.textMuted} />
          <Text style={styles.stopLabel}>Zpět na výběr</Text>
        </Pressable>

        <HistoryDetailModal
          entry={history.find((h) => h.id === historyDetailId) ?? null}
          onClose={() => setHistoryDetailId(null)}
          onDelete={async (id) => {
            const next = await removeQuizHistoryEntry(id);
            setHistory(next);
            setHistoryDetailId(null);
            if (lastSavedSessionId === id) setLastSavedSessionId(null);
          }}
        />
      </Screen>
    );
  }

  if (!active || !card) {
    const personalCount = state.vocab.length;
    const lessonCount = lessonPool.length;
    const startDisabled = previewPool.length === 0;

    return (
      <Screen>
        <ScreenHeader
          title="Opakování"
          subtitle={`${QUIZ_LENGTH} otázek za kolo · úspěch od ${QUIZ_PASS_PERCENT} %`}
        />
        <View style={styles.startCard}>
          <View style={styles.startTitleRow}>
            <MaterialIcons name="track-changes" size={22} color={palette.accent} />
            <Text style={styles.startTitle}>Připraveno k opakování</Text>
          </View>
          <Text style={styles.startSubtitle}>
            V knihovně máš {personalCount} {personalCount === 1 ? "slovíčko" : "slovíček"} ·{" "}
            {lessonCount} z lekcí
          </Text>

          <Text style={styles.modeLabel}>Zdroj otázek</Text>
          <View style={styles.modeRow}>
            <CategoryChip
              label="Moje slovíčka"
              active={source === "personal"}
              onPress={() => setSource("personal")}
            />
            <CategoryChip
              label="Lekce"
              active={source === "lesson"}
              onPress={() => setSource("lesson")}
            />
            <CategoryChip
              label="Vše"
              active={source === "all"}
              onPress={() => setSource("all")}
            />
          </View>
          <Text style={styles.modeHint}>{sourceHelpText}</Text>

          <Text style={styles.modeLabel}>Způsob otázek</Text>
          <View style={styles.modeRow}>
            <CategoryChip
              label="Smíšeně"
              active={quizStyle === "mixed"}
              onPress={() => setQuizStyle("mixed")}
            />
            <CategoryChip
              label="Výběr"
              active={quizStyle === "mcq"}
              onPress={() => setQuizStyle("mcq")}
            />
            <CategoryChip
              label="Psaní"
              active={quizStyle === "typed"}
              onPress={() => setQuizStyle("typed")}
            />
            <CategoryChip
              label="Kartičky"
              active={quizStyle === "flashcard"}
              onPress={() => setQuizStyle("flashcard")}
            />
          </View>
          <Text style={styles.modeHint}>{modeHelpText}</Text>

          <DirectionToggle value={direction} onChange={setDirection} />
          <PrimaryButton
            label={startDisabled ? "Není z čeho zkoušet" : `Začít (${previewPool.length} k dispozici)`}
            onPress={() => start()}
            disabled={startDisabled}
            icon={
              !startDisabled ? (
                <MaterialIcons name="play-arrow" size={22} color={palette.textInverse} />
              ) : undefined
            }
            style={{ width: "100%" }}
          />
        </View>

        {history.length > 0 ? (
          <HistoryList
            history={history}
            onClear={async () => {
              await clearQuizHistory();
              setHistory([]);
            }}
            onOpenDetail={(id) => setHistoryDetailId(id)}
            onDeleteOne={async (id) => {
              const next = await removeQuizHistoryEntry(id);
              setHistory(next);
              if (historyDetailId === id) setHistoryDetailId(null);
            }}
          />
        ) : null}

        <HistoryDetailModal
          entry={history.find((h) => h.id === historyDetailId) ?? null}
          onClose={() => setHistoryDetailId(null)}
          onDelete={async (id) => {
            const next = await removeQuizHistoryEntry(id);
            setHistory(next);
            setHistoryDetailId(null);
          }}
        />
      </Screen>
    );
  }

  const ask = direction === "it-cz" ? card.it : card.cz;
  const answer1 = direction === "it-cz" ? card.cz : card.it;

  const hintFlash = direction === "it-cz" ? "PŘELOŽ DO ČEŠTINY" : "PŘELOŽ ITALSKY";
  const hintMcq =
    hasCloze && direction === "it-cz"
      ? "VYBER CHYBĚJÍCÍ SLOVO"
      : direction === "it-cz"
        ? "VYBER SPRÁVNÝ ČESKÝ PŘEKLAD"
        : "VYBER SPRÁVNÝ ITALSKÝ PŘEKLAD";
  const isNumberCard = card.category === "číslo";
  const hintTyped =
    hasCloze && direction === "it-cz"
      ? "DOPLŇ ITALSKÉ SLOVO (bez diakritiky stačí shoda)"
      : direction === "it-cz"
        ? isNumberCard
          ? "NAPIŠ ČÍSLICÍ NEBO SLOVEM"
          : "NAPIŠ ČESKÝ PŘEKLAD"
        : "NAPIŠ ITALSKY";

  if (eff === "flashcard") {
    return (
      <Screen>
        <ScreenHeader title="Opakování" subtitle="Kartičky" />

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Postup kvízu</Text>
          <Text style={styles.progressCount}>
            Otázka {currentQuestionIndex} z {sessionLength}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.hint}>{hintFlash}</Text>
          <Text style={styles.word}>{ask}</Text>
          {direction === "it-cz" ? <PlayButton onPress={() => tts.speak(card.it)} /> : null}
          {direction === "it-cz" && card.p ? <Text style={styles.cardPron}>{card.p}</Text> : null}
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

        <AddToVocabPill
          visible={card.source === "lesson"}
          alreadyOwned={currentCardOwned}
          onAdd={addCurrentCardToVocab}
        />

        {!revealed ? (
          <PrimaryButton label="Zobrazit odpověď" onPress={() => setRevealed(true)} />
        ) : (
          <View style={styles.answersRow}>
            <PrimaryButton
              label="Nevěděl"
              variant="danger"
              icon={<MaterialIcons name="close" size={18} color={palette.danger} />}
              onPress={() => answerFlashcard(false)}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Věděl"
              variant="success"
              icon={<MaterialIcons name="check" size={18} color={palette.textInverse} />}
              onPress={() => answerFlashcard(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <Pressable
          onPress={stop}
          hitSlop={6}
          style={({ pressed }) => [styles.stopRow, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name="undo" size={14} color={palette.textMuted} />
          <Text style={styles.stopLabel}>Ukončit opakování</Text>
        </Pressable>
      </Screen>
    );
  }

  if (currentFormat === "mcq") {
    return (
      <Screen>
        <ScreenHeader title="Opakování" subtitle="Výběr z možností" />

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Postup kvízu</Text>
          <Text style={styles.progressCount}>
            Otázka {currentQuestionIndex} z {sessionLength}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.hint}>{hintMcq}</Text>
          {hasCloze ? (
            <>
              <Text style={styles.clozeText}>{clozeIt}</Text>
              {direction === "it-cz" ? <PlayButton onPress={() => tts.speak(card.it)} /> : null}
            </>
          ) : (
            <>
              <Text style={styles.word}>{ask}</Text>
              {direction === "it-cz" ? <PlayButton onPress={() => tts.speak(card.it)} /> : null}
              {direction === "it-cz" && card.p ? (
                <Text style={styles.cardPron}>{card.p}</Text>
              ) : null}
            </>
          )}
        </View>

        <AddToVocabPill
          visible={card.source === "lesson"}
          alreadyOwned={currentCardOwned}
          onAdd={addCurrentCardToVocab}
        />

        <View style={styles.mcqGrid}>
          {mcqOptions.map((opt) => {
            const isPicked = mcqResolved && opt === mcqPicked;
            const isCorrectOpt = mcqResolved && opt.trim() === mcqCorrectAnswer;
            return (
              <Pressable
                key={opt}
                onPress={() => answerMcq(opt)}
                disabled={mcqResolved}
                style={({ pressed }) => [
                  styles.mcqBtn,
                  isCorrectOpt && styles.mcqBtnCorrect,
                  isPicked && !isCorrectOpt && styles.mcqBtnWrong,
                  mcqResolved && !isCorrectOpt && !isPicked && styles.mcqBtnDimmed,
                  pressed && !mcqResolved && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.mcqBtnLabel,
                    (isCorrectOpt || (isPicked && !isCorrectOpt)) && styles.mcqBtnLabelOnFill,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mcqResolved ? (
          <View
            style={[
              styles.mcqFeedback,
              mcqWasCorrect ? styles.mcqFeedbackOk : styles.mcqFeedbackBad,
            ]}
          >
            <MaterialIcons
              name={mcqWasCorrect ? "check-circle" : "cancel"}
              size={20}
              color={mcqWasCorrect ? palette.brandDark : palette.danger}
            />
            <View style={styles.mcqFeedbackTexts}>
              <Text
                style={[
                  styles.mcqFeedbackTitle,
                  { color: mcqWasCorrect ? palette.brandDark : palette.danger },
                ]}
              >
                {mcqWasCorrect ? "Správně" : "Špatně"}
              </Text>
              {!mcqWasCorrect ? (
                <Text style={styles.mcqFeedbackAnswer}>
                  Správná odpověď:{" "}
                  <Text style={styles.mcqFeedbackAnswerStrong}>{mcqCorrectAnswer}</Text>
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {mcqResolved ? (
          <PrimaryButton
            label="Další"
            onPress={continueAfterMcq}
            icon={<MaterialIcons name="arrow-forward" size={18} color={palette.textInverse} />}
            style={{ width: "100%" }}
          />
        ) : null}

        <Pressable
          onPress={stop}
          hitSlop={6}
          style={({ pressed }) => [styles.stopRow, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name="undo" size={14} color={palette.textMuted} />
          <Text style={styles.stopLabel}>Ukončit opakování</Text>
        </Pressable>
      </Screen>
    );
  }

  /* typed */
  return (
    <Screen>
      <ScreenHeader title="Opakování" subtitle="Doplň překlad" />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>Postup kvízu</Text>
        <Text style={styles.progressCount}>
            Otázka {currentQuestionIndex} z {sessionLength}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.hint}>{hintTyped}</Text>
        {hasCloze ? (
          <>
            <Text style={styles.clozeText}>{clozeIt}</Text>
            {direction === "it-cz" ? <PlayButton onPress={() => tts.speak(card.it)} /> : null}
          </>
        ) : (
          <>
            <Text style={styles.word}>{ask}</Text>
            {direction === "it-cz" ? <PlayButton onPress={() => tts.speak(card.it)} /> : null}
            {direction === "it-cz" && card.p ? <Text style={styles.cardPron}>{card.p}</Text> : null}
          </>
        )}
      </View>

      <AddToVocabPill
        visible={card.source === "lesson"}
        alreadyOwned={currentCardOwned}
        onAdd={addCurrentCardToVocab}
      />

      <TextInput
        value={typedInput}
        onChangeText={(t) => {
          setTypedInput(t);
          if (typedRevealWrong) setTypedRevealWrong(false);
        }}
        placeholder={direction === "it-cz" ? "česky…" : "italsky…"}
        placeholderTextColor={palette.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!typedRevealWrong}
        style={styles.typedField}
      />

      {typedRevealWrong ? (
        <View style={styles.typedWrongBox}>
          <Text style={styles.typedWrongLabel}>Správně:</Text>
          <Text style={styles.typedWrongAnswer}>{answer1}</Text>
          <PrimaryButton
            label="Další (počítá jako nevěděl)"
            variant="danger"
            onPress={() => {
              if (!card) return;
              advanceAfterAnswer(false, card, typedInput);
            }}
            style={{ width: "100%" }}
          />
        </View>
      ) : (
        <PrimaryButton label="Zkontrolovat" onPress={submitTyped} style={{ width: "100%" }} />
      )}

      <Pressable
        onPress={stop}
        hitSlop={6}
        style={({ pressed }) => [styles.stopRow, pressed && { opacity: 0.5 }]}
      >
        <MaterialIcons name="undo" size={14} color={palette.textMuted} />
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
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.toggle}>
      <ToggleItem label="IT → CZ" active={value === "it-cz"} onPress={() => onChange("it-cz")} />
      <ToggleItem label="CZ → IT" active={value === "cz-it"} onPress={() => onChange("cz-it")} />
    </View>
  );
}

function AddToVocabPill({
  visible,
  alreadyOwned,
  onAdd,
}: {
  visible: boolean;
  alreadyOwned: boolean;
  onAdd: () => void;
}) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (!visible) return null;
  return (
    <Pressable
      onPress={alreadyOwned ? undefined : onAdd}
      disabled={alreadyOwned}
      hitSlop={6}
      style={({ pressed }) => [
        styles.addPill,
        alreadyOwned && styles.addPillDone,
        pressed && !alreadyOwned && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={alreadyOwned ? "Slovíčko už máš" : "Přidat do mých slovíček"}
    >
      <MaterialIcons
        name={alreadyOwned ? "check" : "bookmark-add"}
        size={16}
        color={alreadyOwned ? palette.brandDark : palette.textInverse}
      />
      <Text style={[styles.addPillLabel, alreadyOwned && styles.addPillLabelDone]}>
        {alreadyOwned ? "Už máš ve slovíčkách" : "Přidat do slovíček"}
      </Text>
    </Pressable>
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
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.toggleItem, active && styles.toggleItemActive]}>
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StarsRow({ stars, size = 36 }: { stars: QuizStars; size?: number }) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.starsRow}>
      {[1, 2, 3].map((i) => {
        const filled = i <= stars;
        return (
          <MaterialIcons
            key={i}
            name={filled ? "star" : "star-border"}
            size={size}
            color={filled ? palette.ochre : palette.border}
          />
        );
      })}
    </View>
  );
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "před chvílí";
  if (min < 60) return `před ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `před ${d} dny`;
  return new Date(iso).toLocaleDateString("cs-CZ");
}

function formatDuration(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} s`;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
}

function HistoryRow({
  entry,
  onPress,
  onDelete,
}: {
  entry: QuizHistoryEntry;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const accuracy = entry.questions === 0 ? 0 : Math.round((entry.correct / entry.questions) * 100);
  const accuracyTone =
    accuracy >= 80 ? palette.brandDark : accuracy >= 50 ? palette.ochre : palette.danger;
  // Older entries (saved before the stars feature) don't carry `stars` — fall
  // back to recomputing it from the persisted accuracy so the UI stays uniform.
  const stars = entry.stars ?? quizStars(accuracy);
  const sourceLabel = entry.source ? SOURCE_LABEL[entry.source] : null;
  const hasDetail = !!entry.answers && entry.answers.length > 0;
  return (
    <Pressable
      onPress={hasDetail ? onPress : undefined}
      disabled={!hasDetail}
      style={({ pressed }) => [styles.historyRow, pressed && hasDetail && { opacity: 0.7 }]}
    >
      <View style={styles.historyTopRow}>
        <Text style={styles.historyMode}>
          {HISTORY_STYLE_LABEL[entry.style]}
          {sourceLabel ? ` · ${sourceLabel}` : ""} ·{" "}
          {entry.direction === "it-cz" ? "IT → CZ" : "CZ → IT"}
        </Text>
        <View style={styles.historyTopRight}>
          <Text style={styles.historyWhen}>{formatRelativeTime(entry.startedAt)}</Text>
          {onDelete ? (
            <Pressable
              onPress={() =>
                Alert.alert("Historie", "Smazat tento záznam?", [
                  { text: "Zrušit", style: "cancel" },
                  { text: "Smazat", style: "destructive", onPress: onDelete },
                ])
              }
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Smazat tento záznam"
              style={({ pressed }) => [styles.historyRowDelete, pressed && { opacity: 0.5 }]}
            >
              <MaterialIcons name="close" size={16} color={palette.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.historyStatsRow}>
        <Text style={styles.historyStat}>
          {entry.correct}/{entry.questions}{" "}
          <Text style={[styles.historyAccuracy, { color: accuracyTone }]}>({accuracy} %)</Text>
        </Text>
        <View style={styles.historyStarsInline}>
          {[1, 2, 3].map((i) => (
            <MaterialIcons
              key={i}
              name={i <= stars ? "star" : "star-border"}
              size={14}
              color={i <= stars ? palette.ochre : palette.border}
            />
          ))}
        </View>
      </View>
      <View style={styles.historyBottomRow}>
        <Text style={styles.historyMeta}>
          {entry.wordsLearned > 0 ? `+${entry.wordsLearned} naučeno · ` : ""}
          {formatDuration(entry.durationMs)}
        </Text>
        {hasDetail ? (
          <View style={styles.historyDetailHint}>
            <Text style={styles.historyDetailHintText}>Detail</Text>
            <MaterialIcons name="chevron-right" size={16} color={palette.textMuted} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function HistoryList({
  history,
  onClear,
  onOpenDetail,
  onDeleteOne,
}: {
  history: QuizHistoryEntry[];
  onClear: () => void;
  onOpenDetail: (id: string) => void;
  onDeleteOne: (id: string) => void;
}) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyHeaderLeft}>
          <MaterialIcons name="history" size={18} color={palette.textMuted} />
          <Text style={styles.historyTitle}>Poslední opakování</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert("Historie", "Smazat všechny záznamy?", [
              { text: "Zrušit", style: "cancel" },
              { text: "Smazat vše", style: "destructive", onPress: onClear },
            ])
          }
          hitSlop={6}
        >
          <Text style={styles.historyClear}>Smazat vše</Text>
        </Pressable>
      </View>
      <View style={styles.historyList}>
        {history.slice(0, 8).map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            onPress={() => onOpenDetail(entry.id)}
            onDelete={() => onDeleteOne(entry.id)}
          />
        ))}
      </View>
    </View>
  );
}

type HistoryDetailFilter = "all" | "correct" | "wrong";

function HistoryDetailModal({
  entry,
  onClose,
  onDelete,
}: {
  entry: QuizHistoryEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<HistoryDetailFilter>("all");
  // Reset the filter whenever the user opens a different entry so the chips
  // don't carry over a stale selection between sessions.
  useEffect(() => {
    if (entry) setFilter("all");
  }, [entry?.id]);

  if (!entry) return null;
  const all = entry.answers ?? [];
  const correctCount = all.filter((a) => a.correct).length;
  const wrongCount = all.length - correctCount;
  const filtered = all.filter((a) =>
    filter === "all" ? true : filter === "correct" ? a.correct : !a.correct,
  );
  const accuracy = entry.questions === 0 ? 0 : Math.round((entry.correct / entry.questions) * 100);

  return (
    <Modal
      visible={!!entry}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.detailTitle}>Detail opakování</Text>
            <Text style={styles.detailSubtitle}>
              {HISTORY_STYLE_LABEL[entry.style]}
              {entry.source ? ` · ${SOURCE_LABEL[entry.source]}` : ""} ·{" "}
              {entry.direction === "it-cz" ? "IT → CZ" : "CZ → IT"} · {entry.correct}/
              {entry.questions} ({accuracy} %)
            </Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert("Historie", "Smazat tento záznam?", [
                { text: "Zrušit", style: "cancel" },
                { text: "Smazat", style: "destructive", onPress: () => onDelete(entry.id) },
              ])
            }
            hitSlop={8}
            style={({ pressed }) => [styles.detailDelete, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Smazat záznam"
          >
            <MaterialIcons name="delete-outline" size={20} color={palette.danger} />
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.detailClose, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Zavřít detail"
          >
            <MaterialIcons name="close" size={22} color={palette.textStrong} />
          </Pressable>
        </View>

        <View style={styles.detailFilterRow}>
          <CategoryChip
            label={`Vše`}
            count={all.length}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <CategoryChip
            label="Správně"
            count={correctCount}
            active={filter === "correct"}
            onPress={() => setFilter("correct")}
          />
          <CategoryChip
            label="Špatně"
            count={wrongCount}
            active={filter === "wrong"}
            onPress={() => setFilter("wrong")}
            tone="danger"
          />
        </View>

        <ScrollView contentContainerStyle={styles.detailListContent}>
          {all.length === 0 ? (
            <Text style={styles.detailEmpty}>U starších opakování není detail k dispozici.</Text>
          ) : filtered.length === 0 ? (
            <Text style={styles.detailEmpty}>Žádné odpovědi v této kategorii.</Text>
          ) : (
            filtered.map((a, idx) => (
              <AnswerLogRow key={`${a.uid}-${idx}`} index={all.indexOf(a) + 1} answer={a} />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AnswerLogRow({ index, answer }: { index: number; answer: QuizAnswerLog }) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  const formatLabel =
    answer.format === "flashcard" ? "Kartička" : answer.format === "mcq" ? "Výběr" : "Psaní";
  return (
    <View
      style={[
        styles.answerRow,
        answer.correct ? styles.answerRowOk : styles.answerRowFail,
      ]}
    >
      <View style={styles.answerIndexCol}>
        <Text style={styles.answerIndex}>{index}</Text>
        <MaterialIcons
          name={answer.correct ? "check-circle" : "cancel"}
          size={20}
          color={answer.correct ? palette.brandDark : palette.danger}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.answerIt}>{answer.it}</Text>
        <Text style={styles.answerCz}>{answer.cz}</Text>
        {answer.given ? (
          <Text style={styles.answerGiven}>
            <Text style={styles.answerGivenLabel}>Tvá odpověď: </Text>
            {answer.given}
          </Text>
        ) : null}
        <Text style={styles.answerMeta}>{formatLabel}</Text>
      </View>
    </View>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
  startCard: {
    backgroundColor: p.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: p.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: "stretch",
  },
  startTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    alignSelf: "center",
  },
  startTitle: { fontFamily: Typography.display.fontFamily, fontSize: 18, color: p.textStrong },
  startSubtitle: { ...Typography.small, color: p.textMuted, textAlign: "center" },
  modeLabel: { ...Typography.smallStrong, color: p.textMuted, marginTop: Spacing.xs },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  modeHint: {
    ...Typography.small,
    color: p.textMuted,
    fontStyle: "italic",
    lineHeight: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: p.surfaceMuted,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: p.brand, borderRadius: Radius.pill },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { ...Typography.small, color: p.textMuted },
  progressCount: { ...Typography.smallStrong, color: p.brandDark },
  toggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    backgroundColor: p.surfaceMuted,
    borderRadius: Radius.pill,
    padding: 4,
  },
  toggleItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  toggleItemActive: { backgroundColor: p.surface, ...s.card },
  toggleLabel: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: p.textMuted,
    fontSize: 13,
  },
  toggleLabelActive: { color: p.textStrong },
  card: {
    backgroundColor: p.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl + 4,
    gap: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: p.border,
    ...s.pop,
  },
  hint: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 11,
    letterSpacing: 1.6,
    color: p.accent,
    textAlign: "center",
  },
  word: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 38,
    color: p.textStrong,
    textAlign: "center",
  },
  clozeText: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 18,
    color: p.textStrong,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: Spacing.sm,
  },
  cardPron: { ...Typography.bodyStrong, color: p.textMuted, fontStyle: "italic" },
  answerBox: {
    width: "100%",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: p.border,
    alignItems: "center",
    gap: Spacing.sm,
  },
  answerLabel: { ...Typography.caption, color: p.textMuted, letterSpacing: 1.4 },
  answer: { fontFamily: Typography.display.fontFamily, fontSize: 22, color: p.brandDark },
  answersRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  mcqGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm + 2 },
  mcqBtn: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.surface,
    borderWidth: 1.5,
    borderColor: p.border,
    justifyContent: "center",
    alignItems: "center",
    ...s.card,
  },
  mcqBtnCorrect: {
    backgroundColor: p.brand,
    borderColor: p.brandDark,
  },
  mcqBtnWrong: {
    backgroundColor: p.danger,
    borderColor: p.danger,
  },
  mcqBtnDimmed: { opacity: 0.55 },
  mcqBtnLabel: {
    ...Typography.bodyStrong,
    color: p.textStrong,
    textAlign: "center",
    fontSize: 15,
  },
  mcqBtnLabelOnFill: { color: p.textInverse },
  mcqFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  mcqFeedbackOk: {
    backgroundColor: p.brandSoft,
    borderColor: p.brand,
  },
  mcqFeedbackBad: {
    backgroundColor: p.accentSoft,
    borderColor: p.danger,
  },
  mcqFeedbackTexts: { flex: 1, gap: 2 },
  mcqFeedbackTitle: { ...Typography.bodyStrong, fontSize: 15 },
  mcqFeedbackAnswer: { ...Typography.small, color: p.text },
  mcqFeedbackAnswerStrong: { ...Typography.bodyStrong, color: p.textStrong },
  typedField: {
    ...Typography.body,
    backgroundColor: p.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: p.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    color: p.textStrong,
  },
  typedWrongBox: { gap: Spacing.md, width: "100%" },
  typedWrongLabel: { ...Typography.small, color: p.textMuted },
  typedWrongAnswer: { ...Typography.bodyStrong, color: p.brandDark, fontSize: 18 },
  stopRow: {
    flexDirection: "row",
    gap: Spacing.xs + 2,
    alignSelf: "center",
    alignItems: "center",
  },
  stopLabel: { ...Typography.smallStrong, color: p.textMuted, fontSize: 13 },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: p.brandDark,
  },
  addPillDone: {
    backgroundColor: p.brandSoft,
    borderWidth: 1,
    borderColor: p.brand,
  },
  addPillLabel: {
    ...Typography.smallStrong,
    color: p.textInverse,
    fontSize: 13,
  },
  addPillLabelDone: { color: p.brandDark },
  resultsCard: {
    backgroundColor: p.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: p.border,
    ...s.pop,
  },
  resultsCardOk: {
    borderColor: p.brand,
    backgroundColor: p.brandSoft,
  },
  resultsCardFail: {
    borderColor: p.danger,
    backgroundColor: p.accentSoft,
  },
  resultsTitle: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 24,
    textAlign: "center",
  },
  resultsSubtitle: {
    ...Typography.small,
    color: p.textMuted,
    textAlign: "center",
  },
  resultsScore: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 48,
    color: p.textStrong,
    marginTop: Spacing.sm,
  },
  resultsScoreSlash: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 28,
    color: p.textMuted,
  },
  resultsPercent: {
    ...Typography.bodyStrong,
    color: p.textMuted,
    fontSize: 18,
  },
  resultsBonus: {
    ...Typography.smallStrong,
    color: p.brandDark,
    marginTop: Spacing.xs,
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  historyStarsInline: {
    flexDirection: "row",
    gap: 2,
  },
  historyCard: {
    backgroundColor: p.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: p.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyHeaderLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  historyTitle: { ...Typography.bodyStrong, color: p.textStrong, fontSize: 14 },
  historyClear: { ...Typography.smallStrong, color: p.textMuted, fontSize: 12 },
  historyList: { gap: Spacing.sm + 2 },
  historyRow: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: p.border,
    gap: 4,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyMode: { ...Typography.bodyStrong, color: p.textStrong, fontSize: 13 },
  historyTopRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  historyWhen: { ...Typography.small, color: p.textMuted },
  historyRowDelete: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: p.surfaceMuted,
  },
  historyStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyStat: { ...Typography.bodyStrong, color: p.textStrong, fontSize: 13 },
  historyAccuracy: { ...Typography.smallStrong, fontSize: 12 },
  historyMeta: { ...Typography.small, color: p.textMuted, flexShrink: 1, textAlign: "left" },
  historyBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  historyDetailHint: { flexDirection: "row", alignItems: "center", gap: 2 },
  historyDetailHintText: { ...Typography.smallStrong, color: p.textMuted, fontSize: 12 },
  detailContainer: { flex: 1, backgroundColor: p.background, padding: Spacing.lg, gap: Spacing.md },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  detailTitle: { fontFamily: Typography.display.fontFamily, fontSize: 22, color: p.textStrong },
  detailSubtitle: { ...Typography.small, color: p.textMuted, fontSize: 13 },
  detailClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
  },
  detailDelete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.danger,
  },
  detailFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  detailListContent: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  detailEmpty: {
    ...Typography.body,
    color: p.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  answerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
  },
  answerRowOk: { borderColor: p.brand, backgroundColor: p.brandSoft },
  answerRowFail: { borderColor: p.danger, backgroundColor: "#FFE9E5" },
  answerIndexCol: { alignItems: "center", gap: 4, minWidth: 28 },
  answerIndex: { ...Typography.smallStrong, color: p.textMuted, fontSize: 12 },
  answerIt: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: p.textStrong,
    fontSize: 16,
    fontStyle: "italic",
  },
  answerCz: { ...Typography.body, color: p.text, fontSize: 14 },
  answerGiven: { ...Typography.small, color: p.text, fontSize: 13 },
  answerGivenLabel: { ...Typography.smallStrong, color: p.textMuted },
  answerMeta: { ...Typography.small, color: p.textMuted, fontSize: 11 },
  });
}

