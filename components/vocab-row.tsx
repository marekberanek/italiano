import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { VocabWord } from "@/assets/data/types";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { PlayButton } from "@/components/play-button";

type Props = {
  word: VocabWord;
  onPlay: () => void;
  onRemove?: () => void;
  learnedThreshold: number;
};

export function VocabRow({ word, onPlay, onRemove, learnedThreshold }: Props) {
  const badgeBg = word.learned ? Palette.brand : Palette.brandSoft;
  const badgeFg = word.learned ? Palette.textInverse : Palette.brandDark;
  const badgeText = word.learned ? "✓" : `${word.streak}/${learnedThreshold}`;
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <Text style={styles.italian}>{word.it}</Text>
        <Text style={styles.czech}>{word.cz}</Text>
        {word.p ? <Text style={styles.pronunciation}>{word.p}</Text> : null}
      </View>
      <PlayButton onPress={onPlay} size="md" />
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeLabel, { color: badgeFg }]}>{badgeText}</Text>
      </View>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
        >
          <MaterialIcons name="close" size={18} color={Palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  texts: { flex: 1, gap: 2 },
  italian: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 17,
    color: Palette.textStrong,
  },
  czech: {
    ...Typography.body,
    color: Palette.text,
    fontSize: 14,
  },
  pronunciation: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 12,
    fontStyle: "italic",
    color: Palette.accent,
  },
  badge: {
    minWidth: 42,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeLabel: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 12,
  },
  remove: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  removePressed: { opacity: 0.5 },
});
