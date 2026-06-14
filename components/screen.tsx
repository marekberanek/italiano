import { useFocusEffect } from "expo-router";
import { useCallback, useRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import { useTabBarScroll } from "@/lib/navigation/tab-bar-scroll-context";
import { useTheme } from "@/lib/theme/theme-context";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

/** Fixed tab bar + floating gap + home indicator + extra scroll breathing room. */
const TAB_BAR_SAFE_PADDING = TabBarMetrics.barHeight + Spacing.lg + 48;
const SCROLL_DIRECTION_THRESHOLD = 18;
const TOP_RESET_OFFSET = 12;

export function Screen({ children, scroll = true, style }: Props) {
  const { palette } = useTheme();
  const { setCompact } = useTabBarScroll();
  const styles = useThemedStyles(createStyles);
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef<"down" | "up" | null>(null);
  const accumulatedDeltaRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      lastScrollYRef.current = 0;
      scrollDirectionRef.current = null;
      accumulatedDeltaRef.current = 0;
      setCompact(false);
    }, [setCompact]),
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (y <= TOP_RESET_OFFSET) {
        scrollDirectionRef.current = null;
        accumulatedDeltaRef.current = 0;
        setCompact(false);
        return;
      }

      if (Math.abs(delta) < 1) return;

      const direction = delta > 0 ? "down" : "up";
      if (scrollDirectionRef.current !== direction) {
        scrollDirectionRef.current = direction;
        accumulatedDeltaRef.current = Math.abs(delta);
      } else {
        accumulatedDeltaRef.current += Math.abs(delta);
      }

      if (accumulatedDeltaRef.current < SCROLL_DIRECTION_THRESHOLD) return;

      setCompact(direction === "down");
      accumulatedDeltaRef.current = 0;
    },
    [setCompact],
  );

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      onScroll={handleScroll}
      scrollEventThrottle={16}
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
