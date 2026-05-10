import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
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
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      // Lets the user tap a "Send"/"Submit" button without the keyboard
      // intercepting the first tap to dismiss itself.
      keyboardShouldPersistTaps="handled"
      // On iOS the system tries to scroll the focused TextInput into view but
      // its default offset assumes a screen-level inset; ours is the floating
      // tab bar so we set it explicitly.
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, styles.flex, style]}>{children}</View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        // iOS keyboard would otherwise overlap the bottom of the focused
        // input by `Screen`'s top safe-area inset; we already use `edges:
        // ["top"]` so 0 is correct here.
        keyboardVerticalOffset={0}
      >
        {inner}
      </KeyboardAvoidingView>
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
