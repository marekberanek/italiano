import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { LookupResult, VocabKind, WordMeaning } from "@/assets/data/types";
import { AppLogo } from "@/components/app-logo";
import { PlayButton } from "@/components/play-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SignInRequiredCard } from "@/components/sign-in-required";
import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, SearchFieldMetrics, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useTheme } from "@/lib/theme/theme-context";
import { useVocabStore } from "@/hooks/use-vocab-store";
import { MeaningsError, fetchMeanings } from "@/lib/api/meanings";
import { TranslateError, lookupWord } from "@/lib/api/translate";
import { useAuth } from "@/lib/auth/use-auth";
import { inferVocabKind } from "@/lib/vocab/infer-kind";

export default function LookupScreen() {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tts = useItalianTts();
  const router = useRouter();
  const { user } = useAuth();
  const { addWord, hasItalian } = useVocabStore();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether the most recent error came from the auth gate so we can
  // render a "Přejít na profil" CTA next to the error message. Reachable only
  // in the rare case the session expires between this render and the request
  // (the screen is otherwise gated by `user` below).
  const [errorRequiresAuth, setErrorRequiresAuth] = useState(false);
  // True when backend returned 422 ambiguous — UI then shows a friendlier
  // "DeepL si není jistý, zkus diakritiku" panel instead of a generic red box.
  const [errorAmbiguous, setErrorAmbiguous] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [addKind, setAddKind] = useState<VocabKind>("word");
  // "Další významy" feature — fetched on demand via Anthropic-backed
  // `/api/translate-meanings`. We only show the trigger button while DeepL
  // returned a result and the feature is not known to be disabled (503).
  const [meanings, setMeanings] = useState<WordMeaning[] | null>(null);
  const [meaningsLoading, setMeaningsLoading] = useState(false);
  const [meaningsError, setMeaningsError] = useState<string | null>(null);
  // Sticky once the server has confirmed the endpoint is off (no ANTHROPIC key)
  // — saves the user a second futile button tap during the same session.
  const [meaningsDisabled, setMeaningsDisabled] = useState(false);

  useEffect(() => {
    if (result) setAddKind(inferVocabKind(result.it, result.cz));
  }, [result]);

  // Word can be already in vocab from a previous session — treat that the same
  // way as "right after I clicked Add" so the button is disabled and labelled.
  const alreadyOwned = !!result && hasItalian(result.it);
  const isAdded = added || alreadyOwned;

  // When the user clears the input (or starts typing something new), drop the
  // previous result/error so the screen doesn't keep showing a stale translation.
  const resetMeanings = () => {
    setMeanings(null);
    setMeaningsLoading(false);
    setMeaningsError(null);
  };

  const onChangeQuery = (next: string) => {
    setQuery(next);
    if (!next.trim()) {
      setResult(null);
      setError(null);
      setErrorRequiresAuth(false);
      setErrorAmbiguous(false);
      setErrorHint(null);
      setAdded(false);
      resetMeanings();
    }
  };

  const submit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setErrorRequiresAuth(false);
    setErrorAmbiguous(false);
    setErrorHint(null);
    setAdded(false);
    setResult(null);
    resetMeanings();
    try {
      const data = await lookupWord(query.trim());
      setResult(data);
    } catch (err) {
      const isTranslate = err instanceof TranslateError;
      setError(isTranslate ? err.message : "Něco se pokazilo. Zkus to znovu.");
      setErrorRequiresAuth(isTranslate && err.requiresAuth);
      setErrorAmbiguous(isTranslate && err.ambiguous);
      setErrorHint(isTranslate ? err.hint ?? null : null);
    } finally {
      setLoading(false);
    }
  };

  const onLoadMeanings = async () => {
    if (!query.trim() || meaningsLoading) return;
    setMeaningsLoading(true);
    setMeaningsError(null);
    setMeanings(null);
    try {
      const list = await fetchMeanings(query.trim());
      setMeanings(list);
    } catch (err) {
      const isMeanings = err instanceof MeaningsError;
      if (isMeanings && err.disabled) {
        setMeaningsDisabled(true);
        // No inline error — silently hide the button. Server is just off.
        return;
      }
      setMeaningsError(
        isMeanings ? err.message : "Načtení významů se nepovedlo. Zkus to znovu.",
      );
    } finally {
      setMeaningsLoading(false);
    }
  };

  const onPickMeaning = (m: WordMeaning) => {
    setResult({
      it: m.it,
      cz: m.cz,
      p: result?.p ?? "",
      ex_it: m.example_it,
      ex_cz: m.example_cz,
    });
    setAdded(false);
    resetMeanings();
  };

  const onAdd = () => {
    if (!result || isAdded) return;
    addWord({
      it: result.it,
      cz: result.cz,
      p: result.p ?? "",
      exIt: result.ex_it,
      exCz: result.ex_cz,
      kind: addKind,
    });
    setAdded(true);
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader
          title="Hledat"
          subtitle="Vyhledávání slov je dostupné po přihlášení."
        />
        <SignInRequiredCard
          title="Přihlaš se pro vyhledávání"
          description="Překlady slovíček posíláme přes naši DeepL kvótu, takže ji nabízíme jen přihlášeným. Tvá slovíčka se navíc budou synchronizovat mezi zařízeními."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Hledat" subtitle="Zadej slovo, přeložím a přečtu." />

      <View style={styles.searchRow}>
        <View style={styles.input}>
          <MaterialIcons
            name="search"
            size={SearchFieldMetrics.iconSize}
            color={palette.textMuted}
          />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={submit}
            placeholder="napiš slovo česky nebo italsky"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.inputField}
          />
          {query ? (
            <Pressable
              onPress={() => onChangeQuery("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Vymazat hledání"
              style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.5 }]}
            >
              <MaterialIcons name="close" size={16} color={palette.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <PrimaryButton
          label="Hledat"
          size="md"
          onPress={submit}
          loading={loading}
          style={styles.searchBtn}
        />
      </View>

      {error ? (
        <View style={errorAmbiguous ? styles.warningBox : styles.errorBox}>
          <View style={styles.errorRow}>
            <MaterialIcons
              name={errorAmbiguous ? "info-outline" : "error-outline"}
              size={18}
              color={errorAmbiguous ? palette.warning : palette.danger}
            />
            <Text style={errorAmbiguous ? styles.warningText : styles.errorText}>{error}</Text>
          </View>
          {errorAmbiguous && errorHint ? (
            <Text style={styles.warningHint}>{errorHint}</Text>
          ) : null}
          {errorRequiresAuth ? (
            <PrimaryButton
              label="Přejít na profil"
              variant="secondary"
              onPress={() => router.push("/(tabs)/profile")}
            />
          ) : null}
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultCard}>
          <View style={styles.resultTopRow}>
            <Text style={styles.resultIt}>{result.it}</Text>
            <PlayButton onPress={() => tts.speak(result.it)} size="md" tone="onDark" />
          </View>
          {result.p ? <Text style={styles.resultPron}>{result.p}</Text> : null}
          <Text style={styles.resultCz}>{result.cz}</Text>
          {result.ex_it ? (
            <View style={styles.exampleBox}>
              <Text style={styles.exampleIt}>{result.ex_it}</Text>
              {result.ex_cz ? <Text style={styles.exampleCz}>{result.ex_cz}</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {result && !meaningsDisabled ? (
        <View style={styles.meaningsBlock}>
          {!meanings && !meaningsLoading ? (
            <PrimaryButton
              label="Další významy"
              variant="secondary"
              onPress={onLoadMeanings}
              loading={meaningsLoading}
            />
          ) : null}

          {meaningsLoading ? (
            <View style={styles.meaningsLoadingRow}>
              <MaterialIcons name="hourglass-top" size={18} color={palette.textMuted} />
              <Text style={styles.meaningsLoadingText}>Hledám další významy…</Text>
            </View>
          ) : null}

          {meaningsError ? (
            <View style={styles.errorBox}>
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={18} color={palette.danger} />
                <Text style={styles.errorText}>{meaningsError}</Text>
              </View>
            </View>
          ) : null}

          {meanings ? (
            <View style={styles.meaningsList}>
              <Text style={styles.meaningsTitle}>Vyber správný význam</Text>
              {meanings.map((m, idx) => {
                const selected = m.it.toLowerCase() === result.it.toLowerCase();
                return (
                  <Pressable
                    key={`${m.it}-${idx}`}
                    onPress={() => onPickMeaning(m)}
                    style={({ pressed }) => [
                      styles.meaningCard,
                      selected && styles.meaningCardSelected,
                      pressed && styles.pressedChip,
                    ]}
                  >
                    <View style={styles.meaningHeader}>
                      <Text style={styles.meaningIt}>{m.it}</Text>
                      <Text style={styles.meaningGloss}>{m.gloss}</Text>
                    </View>
                    <Text style={styles.meaningCz}>{m.cz}</Text>
                    {m.example_it ? (
                      <View style={styles.meaningExample}>
                        <Text style={styles.meaningExampleIt}>{m.example_it}</Text>
                        {m.example_cz ? (
                          <Text style={styles.meaningExampleCz}>{m.example_cz}</Text>
                        ) : null}
                      </View>
                    ) : null}
                    {selected ? (
                      <Text style={styles.meaningSelectedHint}>✓ právě zobrazeno</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {result ? (
        <View style={styles.kindRow}>
          <Text style={styles.kindLabel}>Uložit jako</Text>
          <View style={styles.kindChips}>
            <Pressable
              onPress={() => setAddKind("word")}
              style={({ pressed }) => [
                styles.kindChip,
                addKind === "word" && styles.kindChipActive,
                pressed && styles.pressedChip,
              ]}
            >
              <Text style={[styles.kindChipText, addKind === "word" && styles.kindChipTextActive]}>
                Slovíčko
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAddKind("phrase")}
              style={({ pressed }) => [
                styles.kindChip,
                addKind === "phrase" && styles.kindChipActive,
                pressed && styles.pressedChip,
              ]}
            >
              <Text style={[styles.kindChipText, addKind === "phrase" && styles.kindChipTextActive]}>
                Fráze
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {result ? (
        <View style={styles.actionsRow}>
          <PrimaryButton
            label={
              isAdded
                ? alreadyOwned && !added
                  ? "✓ Už máš ve slovíčkách"
                  : "✓ Přidáno"
                : "+ Přidat do slovíček"
            }
            onPress={onAdd}
            disabled={isAdded}
            style={{ flex: 1 }}
          />
          {result.ex_it ? (
            <PrimaryButton
              label="Přehrát větu"
              variant="secondary"
              onPress={() => tts.speak(result.ex_it!)}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      ) : null}

      {!result && !loading && !error ? (
        <Pressable style={styles.emptyState} onPress={() => setQuery("buongiorno")}>
          <AppLogo variant="badge" size={88} />
          <Text style={styles.emptyTitle}>Začni jedním slovem</Text>
          <Text style={styles.emptyHint}>např. „pizza“, „buongiorno“, „prosím“</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
  searchRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  searchBtn: { minHeight: 44, paddingVertical: Spacing.sm },
  input: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SearchFieldMetrics.gap,
    paddingHorizontal: SearchFieldMetrics.paddingH,
    backgroundColor: p.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: p.border,
    minHeight: SearchFieldMetrics.minHeight,
  },
  inputField: {
    flex: 1,
    fontFamily: Typography.body.fontFamily,
    // iOS Safari auto-zooms into inputs whose font is < 16px, which shifts and
    // widens the page on focus. Keep 16px on web to suppress that; native keeps
    // the compact size.
    fontSize: Platform.OS === "web" ? 16 : SearchFieldMetrics.fontSize,
    lineHeight: SearchFieldMetrics.lineHeight,
    color: p.textStrong,
    // Remove the browser's blue focus rectangle that react-native-web adds.
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
  errorBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.accentSoft,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: { ...Typography.smallStrong, color: p.danger, flex: 1 },
  warningBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.warningSoft,
  },
  warningText: { ...Typography.smallStrong, color: p.warning, flex: 1 },
  warningHint: { ...Typography.small, color: p.text },
  resultCard: {
    backgroundColor: p.brand,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...s.brand,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  resultIt: {
    flex: 1,
    fontFamily: Typography.display.fontFamily,
    fontSize: 32,
    color: p.textInverse,
    lineHeight: 36,
  },
  resultPron: {
    ...Typography.bodyStrong,
    color: p.textOnDark,
    fontStyle: "italic",
  },
  resultCz: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 22,
    color: p.textInverse,
  },
  exampleBox: {
    backgroundColor: p.overlayLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  exampleIt: {
    ...Typography.bodyStrong,
    color: p.textInverse,
    fontStyle: "italic",
  },
  exampleCz: { ...Typography.small, color: p.textOnDark },
  kindRow: { gap: Spacing.sm, marginTop: Spacing.xs },
  kindLabel: { ...Typography.smallStrong, color: p.textMuted },
  kindChips: { flexDirection: "row", gap: Spacing.sm },
  kindChip: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: p.surface,
    borderWidth: 1.5,
    borderColor: p.border,
  },
  kindChipActive: {
    backgroundColor: p.brandSoft,
    borderColor: p.brand,
  },
  kindChipText: { ...Typography.smallStrong, color: p.textMuted },
  kindChipTextActive: { color: p.brandDark },
  pressedChip: { opacity: 0.85 },
  actionsRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.bodyStrong,
    color: p.textMuted,
    fontSize: 16,
  },
  emptyHint: { ...Typography.small, color: p.textMuted, fontStyle: "italic" },
  meaningsBlock: { gap: Spacing.sm },
  meaningsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  meaningsLoadingText: { ...Typography.small, color: p.textMuted },
  meaningsList: { gap: Spacing.sm },
  meaningsTitle: { ...Typography.smallStrong, color: p.textMuted },
  meaningCard: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: p.surface,
    borderWidth: 1.5,
    borderColor: p.border,
    ...s.card,
  },
  meaningCardSelected: {
    borderColor: p.brand,
    backgroundColor: p.brandSoft,
  },
  meaningHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  meaningIt: {
    ...Typography.sectionTitle,
    color: p.textStrong,
    flexShrink: 1,
  },
  meaningGloss: {
    ...Typography.smallStrong,
    color: p.brandDark,
    textAlign: "right",
  },
  meaningCz: { ...Typography.body, color: p.text },
  meaningExample: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: p.surfaceMuted,
    gap: 2,
  },
  meaningExampleIt: { ...Typography.smallStrong, color: p.textStrong, fontStyle: "italic" },
  meaningExampleCz: { ...Typography.small, color: p.textMuted },
  meaningSelectedHint: {
    ...Typography.caption,
    color: p.brandDark,
    marginTop: Spacing.xs,
  },
  });
}
