import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontFamily, Palette, Shadow } from "@/constants/theme";

const BAR_HEIGHT = 70;
const BAR_PAD_V = 8;
const PILL_HEIGHT = 30;
const PILL_RADIUS = 16;

function resolveLabel(
  options: BottomTabBarProps["descriptors"][string]["options"],
  routeName: string,
): string {
  const raw = options.tabBarLabel ?? options.title;
  return typeof raw === "string" ? raw : routeName;
}

export function ItalianoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8) + 12;

  // Allow individual screens to opt out of the floating tab bar by setting
  // `navigation.setOptions({ tabBarStyle: { display: "none" } })`. The bar is
  // a fully custom component so the navigator can't honor that style itself —
  // we read it from the focused route's descriptor here.
  const focusedRoute = state.routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  const focusedTabBarStyle = focusedOptions?.tabBarStyle as
    | { display?: "none" | "flex" }
    | undefined;
  if (focusedTabBarStyle?.display === "none") return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = resolveLabel(options, route.name);
          const iconColor = isFocused ? Palette.textInverse : Palette.tabIconInactive;
          const labelColor = isFocused ? Palette.textStrong : Palette.textMuted;

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
              <View style={[styles.pill, isFocused && styles.pillActive]}>
                {options.tabBarIcon?.({ color: iconColor, size: 20, focused: isFocused })}
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "stretch",
  },
  bar: {
    flexDirection: "row",
    height: BAR_HEIGHT,
    borderRadius: 26,
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: BAR_PAD_V,
    ...Shadow.pop,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
    gap: 4,
  },
  itemPressed: { opacity: 0.85 },
  pill: {
    height: PILL_HEIGHT,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: PILL_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  pillActive: { backgroundColor: Palette.brand },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
});
