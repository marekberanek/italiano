import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Palette, Radius, Shadow } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.textInverse,
        tabBarInactiveTintColor: Palette.tabIconInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarActiveBackgroundColor: Palette.brand,
        sceneStyle: { backgroundColor: Palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hledat",
          tabBarIcon: ({ color }) => <MaterialIcons name="search" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vocab"
        options={{
          title: "Slovíčka",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bookmarks" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Opakování",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="track-changes" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: "Lekce",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="school" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: Platform.select({ ios: 24, android: 18, default: 18 }),
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 36,
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    ...Shadow.pop,
  },
  item: {
    borderRadius: Radius.xl,
    marginHorizontal: 2,
    height: 54,
  },
  label: {
    fontFamily: "Nunito_700Bold",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
