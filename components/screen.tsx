import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Palette, Spacing } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

/** Floating tab bar height + bottom inset + breathing room so the last screen
 * element (e.g. a "Stop" link) is not visually glued to the bar. */
const TAB_BAR_SAFE_PADDING = 140;

export function Screen({ children, scroll = true, style }: Props) {
  if (!scroll) {
    return (
      <SafeAreaView edges={["top"]} style={styles.flex}>
        <View style={[styles.container, style]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.background },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: TAB_BAR_SAFE_PADDING,
    gap: Spacing.xl,
  },
});
