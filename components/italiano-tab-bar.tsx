import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { FontFamily, Radius, Spacing, TabBarMetrics } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

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
  const styles = useThemedStyles(createStyles);
  const iconPillRadius = TabBarMetrics.iconPillHeight / 2;
  const blurTint = colorScheme === "dark" ? "dark" : "light";

  const focusedRoute = state.routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  const focusedTabBarStyle = focusedOptions?.tabBarStyle as
    | { display?: "none" | "flex" }
    | undefined;
  if (focusedTabBarStyle?.display === "none") return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { paddingBottom: insets.bottom + Spacing.md }]}
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
          <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label = resolveLabel(options, route.name);
            const iconColor = isFocused ? styles.iconActive.color : styles.iconInactive.color;
            const labelColor = isFocused ? styles.labelActive.color : styles.labelInactive.color;

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
                <View
                  style={[
                    styles.iconPill,
                    { borderRadius: iconPillRadius },
                    isFocused && styles.iconPillActive,
                  ]}
                >
                  {options.tabBarIcon?.({
                    color: iconColor,
                    size: TabBarMetrics.iconSize,
                    focused: isFocused,
                  })}
                </View>
                <Text
                  style={[styles.label, { color: labelColor }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
    shell: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Spacing.lg,
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
      height: TabBarMetrics.barHeight,
      paddingHorizontal: TabBarMetrics.barPaddingH,
      paddingVertical: TabBarMetrics.barPaddingV,
      alignItems: "stretch",
      zIndex: 1,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 2,
      gap: TabBarMetrics.itemGap,
    },
    itemPressed: { opacity: 0.85 },
    iconPill: {
      height: TabBarMetrics.iconPillHeight,
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
    labelActive: { color: p.textStrong },
    labelInactive: { color: p.textMuted },
    label: {
      fontFamily: FontFamily.bold,
      fontSize: TabBarMetrics.labelSize,
      lineHeight: 14,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
  });
}
