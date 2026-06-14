import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, TabBarMetrics } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTabBarScroll } from "@/lib/navigation/tab-bar-scroll-context";
import { useTheme } from "@/lib/theme/theme-context";

const COMPACT_BAR_HEIGHT = 46;
const COMPACT_ICON_PILL_HEIGHT = 28;
const COMPACT_ICON_SCALE = 0.88;

function resolveLabel(
  options: BottomTabBarProps["descriptors"][string]["options"],
  routeName: string,
): string {
  const raw = options.tabBarLabel ?? options.title;
  return typeof raw === "string" ? raw : routeName;
}

export function ItalianoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { compact } = useTabBarScroll();
  const styles = useThemedStyles(createStyles);
  const blurTint = colorScheme === "dark" ? "dark" : "light";
  const compactAnim = useRef(new Animated.Value(compact ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(compactAnim, {
      toValue: compact ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [compact, compactAnim]);

  const shellPaddingBottom = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [insets.bottom + Spacing.md, insets.bottom + Spacing.xs],
  });
  const shellPaddingHorizontal = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Spacing.lg, Spacing.xxl],
  });
  const barHeight = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [TabBarMetrics.barHeight, COMPACT_BAR_HEIGHT],
  });
  const iconPillHeight = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [TabBarMetrics.iconPillHeight, COMPACT_ICON_PILL_HEIGHT],
  });
  const iconScale = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, COMPACT_ICON_SCALE],
  });

  const focusedRoute = state.routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  const focusedTabBarStyle = focusedOptions?.tabBarStyle as
    | { display?: "none" | "flex" }
    | undefined;
  if (focusedTabBarStyle?.display === "none") return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.shell,
        {
          paddingBottom: shellPaddingBottom,
          paddingHorizontal: shellPaddingHorizontal,
        },
      ]}
    >
      <View style={styles.panelShadow}>
        <View style={styles.panel}>
          <BlurView
            intensity={60}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassOverlay} />
          <View style={styles.glassHighlight} />
          <Animated.View style={[styles.bar, { height: barHeight }]}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = resolveLabel(options, route.name);
              const iconColor = isFocused ? styles.iconActive.color : styles.iconInactive.color;

              const onPress = () => {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: "tabLongPress", target: route.key });
              };

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                  testID={options.tabBarButtonTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <Animated.View
                    style={[
                      styles.iconPill,
                      {
                        borderRadius: TabBarMetrics.iconPillHeight / 2,
                        height: iconPillHeight,
                        transform: [{ scale: iconScale }],
                      },
                      isFocused && styles.iconPillActive,
                    ]}
                  >
                    {options.tabBarIcon?.({
                      color: iconColor,
                      size: TabBarMetrics.iconSize,
                      focused: isFocused,
                    })}
                  </Animated.View>
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
    shell: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    },
    panelShadow: {
      borderRadius: Radius.xl,
      ...s.pop,
    },
    panel: {
      borderRadius: Radius.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: p.glassEdge,
    },
    glassOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: p.glassBar,
    },
    glassHighlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "40%",
      backgroundColor: p.glassHighlight,
      pointerEvents: "none",
    },
    bar: {
      flexDirection: "row",
      paddingHorizontal: TabBarMetrics.barPaddingH,
      paddingVertical: TabBarMetrics.barPaddingV,
      alignItems: "stretch",
      zIndex: 1,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    itemPressed: { opacity: 0.85 },
    iconPill: {
      minWidth: TabBarMetrics.iconPillMinWidth,
      paddingHorizontal: TabBarMetrics.iconPillPaddingH,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    iconPillActive: {
      backgroundColor: p.brand,
    },
    iconActive: { color: p.textInverse },
    iconInactive: { color: p.tabIconInactive },
  });
}
