import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";

import { ItalianoTabBar } from "@/components/italiano-tab-bar";
import { Palette } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ItalianoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        name="lessons"
        options={{
          title: "Lekce",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="school" size={20} color={color} />
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
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
