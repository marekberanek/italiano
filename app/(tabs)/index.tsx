import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { LookupResult } from "@/assets/data/types";
import { AppLogo } from "@/components/app-logo";
import { PlayButton } from "@/components/play-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SignInRequiredCard } from "@/components/sign-in-required";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useVocabStore } from "@/hooks/use-vocab-store";
import { TranslateError, lookupWord } from "@/lib/api/translate";
import { useAuth } from "@/lib/auth/use-auth";

export default function LookupScreen() {
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
  const [added, setAdded] = useState(false);

  // Word can be already in vocab from a previous session — treat that the same
  // way as "right after I clicked Add" so the button is disabled and labelled.
  const alreadyOwned = !!result && hasItalian(result.it);
  const isAdded = added || alreadyOwned;

  // When the user clears the input (or starts typing something new), drop the
  // previous result/error so the screen doesn't keep showing a stale translation.
  const onChangeQuery = (next: string) => {
    setQuery(next);
    if (!next.trim()) {
      setResult(null);
      setError(null);
      setErrorRequiresAuth(false);
      setAdded(false);
    }
  };

  const submit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setErrorRequiresAuth(false);
    setAdded(false);
    setResult(null);
    try {
      const data = await lookupWord(query.trim());
      setResult(data);
    } catch (err) {
      const isTranslate = err instanceof TranslateError;
      setError(isTranslate ? err.message : "Něco se pokazilo. Zkus to znovu.");
      setErrorRequiresAuth(isTranslate && err.requiresAuth);
    } finally {
      setLoading(false);
    }
  };

  const onAdd = () => {
    if (!result || isAdded) return;
    addWord({
      it: result.it,
      cz: result.cz,
      p: result.p ?? "",
      exIt: result.ex_it,
      exCz: result.ex_cz,
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
          <MaterialIcons name="search" size={20} color={Palette.textMuted} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={submit}
            placeholder="napiš slovo česky nebo italsky"
            placeholderTextColor={Palette.textMuted}
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
              <MaterialIcons name="close" size={16} color={Palette.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <PrimaryButton label="Hledat" onPress={submit} loading={loading} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <View style={styles.errorRow}>
            <MaterialIcons name="error-outline" size={18} color={Palette.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
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

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: Spacing.sm + 2, alignItems: "stretch" },
  input: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Palette.border,
    minHeight: 52,
  },
  inputField: {
    flex: 1,
    ...Typography.body,
    color: Palette.textStrong,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.surfaceMuted,
  },
  errorBox: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.accentSoft,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: { ...Typography.smallStrong, color: Palette.danger, flex: 1 },
  resultCard: {
    backgroundColor: Palette.brand,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.brand,
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
    color: Palette.textInverse,
    lineHeight: 36,
  },
  resultPron: {
    ...Typography.bodyStrong,
    color: Palette.textOnDark,
    fontStyle: "italic",
  },
  resultCz: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 22,
    color: Palette.textInverse,
  },
  exampleBox: {
    backgroundColor: Palette.overlayLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  exampleIt: {
    ...Typography.bodyStrong,
    color: Palette.textInverse,
    fontStyle: "italic",
  },
  exampleCz: { ...Typography.small, color: Palette.textOnDark },
  actionsRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.bodyStrong,
    color: Palette.textMuted,
    fontSize: 16,
  },
  emptyHint: { ...Typography.small, color: Palette.textMuted, fontStyle: "italic" },
});
