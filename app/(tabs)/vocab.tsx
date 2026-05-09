import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { StatTile } from "@/components/stat-tile";
import { VocabRow } from "@/components/vocab-row";
import { Palette, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useVocabStore } from "@/hooks/use-vocab-store";

export default function VocabScreen() {
  const tts = useItalianTts();
  const { state, addWord, removeWord, stats, learnedThreshold } = useVocabStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    if (!search.trim()) return state.vocab;
    const q = search.trim().toLowerCase();
    return state.vocab.filter((w) => w.it.toLowerCase().includes(q) || w.cz.toLowerCase().includes(q));
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
        <Pressable
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="add" size={20} color={Palette.brandDark} />
          <Text style={styles.addLabel}>Přidat slovíčko</Text>
        </Pressable>
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
            {state.vocab.length === 0 ? "Žádná slovíčka. Přidej první." : "Nic nenalezeno."}
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
        onSubmit={(input) => {
          addWord(input);
          setShowAdd(false);
        }}
      />
    </Screen>
  );
}

type AddInput = { it: string; cz: string; p: string };

function AddWordModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: AddInput) => void;
}) {
  const [form, setForm] = useState<AddInput>({ it: "", cz: "", p: "" });
  const reset = () => setForm({ it: "", cz: "", p: "" });
  const close = () => {
    reset();
    onClose();
  };
  const submit = () => {
    if (!form.it.trim() || !form.cz.trim()) return;
    onSubmit({ it: form.it.trim(), cz: form.cz.trim(), p: form.p.trim() });
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
          <View style={styles.fieldRow}>
            <TextInput
              value={form.it}
              onChangeText={(it) => setForm({ ...form, it })}
              placeholder="Italsky"
              placeholderTextColor={Palette.textMuted}
              autoCapitalize="none"
              style={styles.field}
            />
            <TextInput
              value={form.cz}
              onChangeText={(cz) => setForm({ ...form, cz })}
              placeholder="Česky"
              placeholderTextColor={Palette.textMuted}
              style={styles.field}
            />
          </View>
          <TextInput
            value={form.p}
            onChangeText={(p) => setForm({ ...form, p })}
            placeholder="Výslovnost (volitelné)"
            placeholderTextColor={Palette.textMuted}
            autoCapitalize="none"
            style={styles.fieldFull}
          />
          <Pressable
            onPress={submit}
            style={({ pressed }) => [styles.modalSubmit, pressed && styles.pressed]}
          >
            <Text style={styles.modalSubmitLabel}>+ Přidat</Text>
          </Pressable>
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
  fieldRow: { flexDirection: "row", gap: Spacing.sm + 2 },
  field: {
    flex: 1,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.body,
    color: Palette.textStrong,
  },
  fieldFull: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.body,
    color: Palette.textStrong,
  },
  modalSubmit: {
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    alignItems: "center",
  },
  modalSubmitLabel: {
    fontFamily: Typography.display.fontFamily,
    color: Palette.textInverse,
    fontSize: 16,
  },
});
