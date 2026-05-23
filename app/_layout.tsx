import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useVocabReminders } from "@/hooks/use-vocab-reminders";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider, useTheme } from "@/lib/theme/theme-context";
import { syncRemoteContent } from "@/lib/content/sync-content";
import { installNotificationHandler } from "@/lib/notifications/scheduler";

installNotificationHandler();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Routes the user to the quiz screen with the word from the tapped notification. */
function openQuizForNotification(notification: Notifications.Notification | null | undefined) {
  if (!notification) return;
  const data = notification.request.content.data as { clientUuid?: unknown } | null;
  const uuid = typeof data?.clientUuid === "string" ? data.clientUuid : null;
  if (!uuid) return;
  router.push({ pathname: "/(tabs)/quiz", params: { startWord: uuid } });
}

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

  useEffect(() => {
    if (!loaded) return;
    // Cold-start case: app was opened by tapping a notification while killed.
    Notifications.getLastNotificationResponseAsync()
      .then((res) => openQuizForNotification(res?.notification))
      .catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openQuizForNotification(response.notification);
    });
    return () => sub.remove();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <RootNavigation />
    </ThemeProvider>
  );
}

function RootNavigation() {
  const { palette, colorScheme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          {/* Reminder scheduler must live INSIDE AuthProvider — it reads the
              session via useAuth() and cancels notifications on sign-out. */}
          <RemindersScheduler />
          <Stack screenOptions={{ contentStyle: { backgroundColor: palette.background } }}>
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
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Renders nothing; exists only so `useVocabReminders` runs INSIDE the
 * AuthProvider tree (the hook calls `useAuth()`).
 */
function RemindersScheduler(): null {
  useVocabReminders();
  return null;
}
