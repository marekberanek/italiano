import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { LookupResult } from "@/assets/data/types";
import { PlayButton } from "@/components/play-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { StatTile } from "@/components/stat-tile";
import { VocabRow } from "@/components/vocab-row";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useVocabStore, type AddWordInput } from "@/hooks/use-vocab-store";
import { TranslateError, lookupWord } from "@/lib/api/translate";
import { useAuth } from "@/lib/auth/use-auth";
import { foldForSearch } from "@/lib/text/normalize";

export default function VocabScreen() {
  const tts = useItalianTts();
  const router = useRouter();
  const { user } = useAuth();
  const isSignedIn = !!user;
  const { state, addWord, hasItalian, removeWord, stats, learnedThreshold } = useVocabStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = foldForSearch(search.trim());
    if (!q) return state.vocab;
    return state.vocab.filter(
      (w) => foldForSearch(w.it).includes(q) || foldForSearch(w.cz).includes(q),
    );
  }, [state.vocab, search]);

  return (
    <Screen>
      <ScreenHeader title="Slovíčka" subtitle="Můj seznam — přidávej a opakuj" />

      <View style={styles.statsRow}>
        <StatTile value={stats.total} label="Celkem" />
        <StatTile value={stats.learned} label="Naučeno" tone="brand" />
        <StatTile value={stats.remaining} label="Zbývá" tone="accent" />
      </View>

      <View style={styles.actionRow}>
        {/* Adding new words requires the (auth-gated) translate proxy, so for
            anonymous users we replace the "Přidat slovíčko" button with a
            sign-in CTA that routes to /(tabs)/profile instead of opening a
            modal that wouldn't work anyway. */}
        {isSignedIn ? (
          <Pressable
            onPress={() => setShowAdd(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="add" size={20} color={Palette.brandDark} />
            <Text style={styles.addLabel}>Přidat slovíčko</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="login" size={20} color={Palette.brandDark} />
            <Text style={styles.addLabel}>Přihlas se pro přidávání</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => setSearch(search ? "" : " ")}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MaterialIcons
            name={search ? "search-off" : "search"}
            size={20}
            color={Palette.textMuted}
          />
        </Pressable>
      </View>

      {search ? (
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Palette.textMuted} />
          <TextInput
            value={search.trim()}
            onChangeText={setSearch}
            placeholder="Hledat ve slovíčkách"
            placeholderTextColor={Palette.textMuted}
            autoFocus
            autoCapitalize="none"
            style={styles.searchField}
          />
        </View>
      ) : null}

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {state.vocab.length === 0
              ? isSignedIn
                ? "Žádná slovíčka. Přidej první."
                : "Žádná slovíčka. Přihlas se a přidej první."
              : "Nic nenalezeno."}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((w) => (
            <VocabRow
              key={w.id}
              word={w}
              learnedThreshold={learnedThreshold}
              onPlay={() => tts.speak(w.it)}
              onRemove={() => removeWord(w.id)}
            />
          ))}
        </View>
      )}

      <AddWordModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        isOwned={hasItalian}
        onSubmit={(input) => {
          addWord(input);
          setShowAdd(false);
        }}
      />
    </Screen>
  );
}

type AddInput = AddWordInput;

/**
 * Search-based add flow: user types one word in CZ or IT, the translate proxy
 * fills the opposite side, the pronunciation generator fills `p`. Only the
 * confirmed pair is written to the vocab store.
 */
function AddWordModal({
  visible,
  onClose,
  onSubmit,
  isOwned,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: AddInput) => void;
  isOwned: (italian: string) => boolean;
}) {
  const tts = useItalianTts();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Distinguishes auth gate failures (which surface a "go to profile" CTA)
  // from generic translate failures (network, DeepL down, etc.).
  const [errorRequiresAuth, setErrorRequiresAuth] = useState(false);

  const reset = () => {
    setQuery("");
    setResult(null);
    setError(null);
    setErrorRequiresAuth(false);
    setLoading(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setErrorRequiresAuth(false);
    setResult(null);
    try {
      const data = await lookupWord(trimmed);
      setResult(data);
    } catch (err) {
      const isTranslate = err instanceof TranslateError;
      setError(isTranslate ? err.message : "Něco se pokazilo. Zkus to znovu.");
      setErrorRequiresAuth(isTranslate && err.requiresAuth);
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = () => {
    close();
    router.push("/(tabs)/profile");
  };

  const alreadyOwned = !!result && isOwned(result.it);

  const confirm = () => {
    if (!result || alreadyOwned) return;
    onSubmit({
      it: result.it,
      cz: result.cz,
      p: result.p ?? "",
      exIt: result.ex_it,
      exCz: result.ex_cz,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.modalScrim} onPress={close}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Přidat slovíčko</Text>
            <Pressable onPress={close} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Palette.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.modalHint}>
            Napiš slovíčko česky nebo italsky — překlad i výslovnost dotáhneme.
          </Text>

          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <MaterialIcons name="search" size={18} color={Palette.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={search}
                placeholder="např. „voda“ nebo „acqua“"
                placeholderTextColor={Palette.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
                style={styles.modalSearchField}
              />
            </View>
            <Pressable
              onPress={search}
              disabled={loading || !query.trim()}
              style={({ pressed }) => [
                styles.searchBtn,
                (loading || !query.trim()) && styles.searchBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={Palette.textInverse} />
              ) : (
                <Text style={styles.searchBtnLabel}>Hledat</Text>
              )}
            </Pressable>
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
                  onPress={goToProfile}
                />
              ) : null}
            </View>
          ) : null}

          {result ? (
            <View style={styles.previewCard}>
              <View style={styles.previewTopRow}>
                <Text style={styles.previewIt}>{result.it}</Text>
                <PlayButton onPress={() => tts.speak(result.it)} size="md" tone="onDark" />
              </View>
              {result.p ? <Text style={styles.previewPron}>{result.p}</Text> : null}
              <Text style={styles.previewCz}>{result.cz}</Text>
            </View>
          ) : null}

          {result ? (
            <Pressable
              onPress={confirm}
              disabled={alreadyOwned}
              style={({ pressed }) => [
                styles.modalSubmit,
                alreadyOwned && styles.modalSubmitDisabled,
                pressed && !alreadyOwned && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={alreadyOwned ? "check" : "add"}
                size={20}
                color={Palette.textInverse}
              />
              <Text style={styles.modalSubmitLabel}>
                {alreadyOwned ? "Už máš ve slovíčkách" : "Přidat do slovíček"}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  actionRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandSoft,
    borderWidth: 1.5,
    borderColor: Palette.brand,
  },
  addLabel: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.brandDark,
    fontSize: 14,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  searchField: { flex: 1, ...Typography.body, color: Palette.textStrong },
  list: { gap: Spacing.sm + 2 },
  empty: { alignItems: "center", paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.body, color: Palette.textMuted, fontStyle: "italic" },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.pop,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 20,
    color: Palette.textStrong,
  },
  modalHint: {
    ...Typography.small,
    color: Palette.textMuted,
  },
  searchRow: { flexDirection: "row", gap: Spacing.sm + 2, alignItems: "stretch" },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    minHeight: 48,
  },
  modalSearchField: { flex: 1, ...Typography.body, color: Palette.textStrong },
  searchBtn: {
    backgroundColor: Palette.brand,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    minWidth: 88,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnLabel: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.textInverse,
    fontSize: 14,
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
  previewCard: {
    backgroundColor: Palette.brand,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  previewIt: {
    flex: 1,
    fontFamily: Typography.display.fontFamily,
    fontSize: 24,
    color: Palette.textInverse,
  },
  previewPron: {
    ...Typography.bodyStrong,
    color: Palette.textOnDark,
    fontStyle: "italic",
  },
  previewCz: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 18,
    color: Palette.textInverse,
  },
  modalSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  modalSubmitDisabled: {
    backgroundColor: Palette.border,
  },
  modalSubmitLabel: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.textInverse,
    fontSize: 16,
  },
});
