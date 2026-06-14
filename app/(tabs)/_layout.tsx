import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";

import { ItalianoTabBar } from "@/components/italiano-tab-bar";
import { TabBarMetrics } from "@/constants/theme";
import { TabBarScrollProvider } from "@/lib/navigation/tab-bar-scroll-context";
import { useTheme } from "@/lib/theme/theme-context";

const TAB_ICON = TabBarMetrics.iconSize;

export default function TabLayout() {
  const { palette } = useTheme();

  return (
    <TabBarScrollProvider>
      <Tabs
        tabBar={(props) => <ItalianoTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: palette.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hledat",
            tabBarIcon: ({ color }) => <MaterialIcons name="search" size={TAB_ICON} color={color} />,
          }}
        />
        <Tabs.Screen
          name="vocab"
          options={{
            title: "Slovíčka",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bookmarks" size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{
            title: "Lekce",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="school" size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: "Opakování",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="track-changes" size={TAB_ICON} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={TAB_ICON} color={color} />,
          }}
        />
      </Tabs>
    </TabBarScrollProvider>
  );
}
