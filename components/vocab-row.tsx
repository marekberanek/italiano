import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { VocabWord } from "@/assets/data/types";
import { PlayButton } from "@/components/play-button";
import type { ColorPalette } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Props = {
  word: VocabWord;
  onPlay: () => void;
  onRemove?: () => void;
  learnedThreshold: number;
};

export function VocabRow({ word, onPlay, onRemove, learnedThreshold }: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const badgeBg = word.learned ? palette.brand : palette.brandSoft;
  const badgeFg = word.learned ? palette.textInverse : palette.brandDark;
  const badgeText = word.learned ? "✓" : `${word.streak}/${learnedThreshold}`;
  const kindLabel = word.kind === "phrase" ? "Fráze" : "Slovo";
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={styles.italian}>{word.it}</Text>
          <View
            style={[
              styles.kindPill,
              word.kind === "phrase" ? styles.kindPillPhrase : styles.kindPillWord,
            ]}
          >
            <Text
              style={[
                styles.kindPillText,
                word.kind === "phrase" && styles.kindPillTextPhrase,
              ]}
            >
              {kindLabel}
            </Text>
          </View>
        </View>
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
          <MaterialIcons name="close" size={18} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: 14,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.md,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
    },
    texts: { flex: 1, gap: 2 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flexWrap: "wrap",
    },
    italian: {
      fontFamily: Typography.display.fontFamily,
      fontSize: 17,
      color: p.textStrong,
    },
    kindPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      borderWidth: 1,
    },
    kindPillWord: {
      backgroundColor: p.surfaceMuted,
      borderColor: p.border,
    },
    kindPillPhrase: {
      backgroundColor: p.brandSoft,
      borderColor: p.brand,
    },
    kindPillText: {
      ...Typography.smallStrong,
      fontSize: 10,
      color: p.textMuted,
    },
    kindPillTextPhrase: { color: p.brandDark },
    czech: {
      ...Typography.body,
      color: p.text,
      fontSize: 14,
    },
    pronunciation: {
      fontFamily: Typography.bodyStrong.fontFamily,
      fontSize: 12,
      fontStyle: "italic",
      color: p.accent,
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
}
