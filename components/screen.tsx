import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ColorPalette } from "@/constants/theme";
import { Spacing, TabBarMetrics } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

/** Fixed tab bar + home indicator + extra scroll breathing room. */
const TAB_BAR_SAFE_PADDING = TabBarMetrics.barHeight + 48;

export function Screen({ children, scroll = true, style }: Props) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, styles.flex, style]}>{children}</View>
  );

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(p: ColorPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: p.background },
    container: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: TAB_BAR_SAFE_PADDING,
      gap: Spacing.xl,
    },
  });
}
