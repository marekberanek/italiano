import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Palette } from "@/constants/theme";
import { AuthProvider } from "@/lib/auth/auth-context";
import { syncRemoteContent } from "@/lib/content/sync-content";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      void syncRemoteContent();
    }, 400);
    return () => clearTimeout(t);
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Palette.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ contentStyle: { backgroundColor: Palette.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="lessons/grammar"
            options={{ title: "Slovesa", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/sentence-structure"
            options={{ title: "Stavba věty", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/situations"
            options={{ title: "Situace", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/numbers"
            options={{ title: "Číslovky", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/alphabet"
            options={{ title: "Abeceda", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/weekdays"
            options={{ title: "Dny v týdnu", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/months"
            options={{ title: "Měsíce", headerShown: false }}
          />
          <Stack.Screen
            name="lessons/curated-vocab"
            options={{ title: "Výběr slovíček", headerShown: false }}
          />
          <Stack.Screen name="lessons/time" options={{ title: "Čas a hodiny", headerShown: false }} />
          <Stack.Screen name="lessons/seasons" options={{ title: "Roční období", headerShown: false }} />
          <Stack.Screen name="lessons/colors-shapes" options={{ title: "Barvy a tvary", headerShown: false }} />
          <Stack.Screen name="lessons/ordinals" options={{ title: "Řadová čísla", headerShown: false }} />
          <Stack.Screen name="lessons/holidays-it" options={{ title: "Svátky v Itálii", headerShown: false }} />
          <Stack.Screen name="lessons/weather" options={{ title: "Počasí", headerShown: false }} />
          <Stack.Screen name="lessons/family" options={{ title: "Rodina", headerShown: false }} />
          <Stack.Screen name="lessons/body-health" options={{ title: "Tělo a zdraví", headerShown: false }} />
          <Stack.Screen name="lessons/food-drinks" options={{ title: "Jídlo a nápoje", headerShown: false }} />
          <Stack.Screen name="lessons/false-friends" options={{ title: "Falešní přátelé", headerShown: false }} />
          <Stack.Screen name="lessons/abbreviations" options={{ title: "Zkratky", headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
