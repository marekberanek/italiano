import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import type { ColorPalette, ThemeShadows } from "@/constants/theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useTheme } from "@/lib/theme/theme-context";

type CardSpec = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bg: string;
  fg: string;
  href: string;
};

function buildCards(p: ColorPalette): CardSpec[] {
  return [
    {
      title: "Slovesa",
      subtitle: "Časování v přítomném čase",
      icon: "menu-book",
      bg: p.brandSoft,
      fg: p.brandDark,
      href: "/lessons/grammar",
    },
    {
      title: "Stavba věty",
      subtitle: "Členy, předložky, časy, otázky…",
      icon: "spellcheck",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/sentence-structure",
    },
    {
      title: "Situace",
      subtitle: "Fráze do restaurace, na cestu…",
      icon: "place",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/situations",
    },
    {
      title: "Výběr slovíček",
      subtitle: "Redakční sada frází",
      icon: "bookmark",
      bg: p.navySoft,
      fg: p.navy,
      href: "/lessons/curated-vocab",
    },
    {
      title: "Číslovky",
      subtitle: "0–1000 + skládání",
      icon: "tag",
      bg: p.ochreSoft,
      fg: p.ochre,
      href: "/lessons/numbers",
    },
    {
      title: "Abeceda",
      subtitle: "21 písmen + výslovnost",
      icon: "abc",
      bg: p.navySoft,
      fg: p.navy,
      href: "/lessons/alphabet",
    },
    {
      title: "Dny v týdnu",
      subtitle: "Lunedì … domenica",
      icon: "calendar-today",
      bg: p.brandSoft,
      fg: p.brandDark,
      href: "/lessons/weekdays",
    },
    {
      title: "Měsíce",
      subtitle: "Gennaio … dicembre",
      icon: "calendar-month",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/months",
    },
    {
      title: "Čas a hodiny",
      subtitle: "Sono le tre e mezza…",
      icon: "schedule",
      bg: p.navySoft,
      fg: p.navy,
      href: "/lessons/time",
    },
    {
      title: "Počasí",
      subtitle: "Piove, fa caldo…",
      icon: "wb-sunny",
      bg: p.ochreSoft,
      fg: p.ochre,
      href: "/lessons/weather",
    },
    {
      title: "Roční období",
      subtitle: "Primavera, estate…",
      icon: "eco",
      bg: p.brandSoft,
      fg: p.brandDark,
      href: "/lessons/seasons",
    },
    {
      title: "Barvy a tvary",
      subtitle: "Rosso, il vestito rosso",
      icon: "palette",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/colors-shapes",
    },
    {
      title: "Řadová čísla",
      subtitle: "Primo, secondo, il primo piano",
      icon: "format-list-numbered",
      bg: p.navySoft,
      fg: p.navy,
      href: "/lessons/ordinals",
    },
    {
      title: "Svátky v IT",
      subtitle: "Kulturní kontext",
      icon: "celebration",
      bg: p.brandSoft,
      fg: p.brandDark,
      href: "/lessons/holidays-it",
    },
    {
      title: "Zkratky a značky",
      subtitle: "ecc., sig., doprava",
      icon: "label",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/abbreviations",
    },
    {
      title: "Falešní přátelé",
      subtitle: "parenti, libreria…",
      icon: "warning",
      bg: p.ochreSoft,
      fg: p.ochre,
      href: "/lessons/false-friends",
    },
    {
      title: "Rodina",
      subtitle: "Madre, padre, figlio…",
      icon: "family-restroom",
      bg: p.brandSoft,
      fg: p.brandDark,
      href: "/lessons/family",
    },
    {
      title: "Tělo a zdraví",
      subtitle: "Navázání na situaci Zdraví",
      icon: "healing",
      bg: p.navySoft,
      fg: p.navy,
      href: "/lessons/body-health",
    },
    {
      title: "Jídlo a nápoje",
      subtitle: "Caffè, pasta, pizza",
      icon: "restaurant",
      bg: p.accentSoft,
      fg: p.accent,
      href: "/lessons/food-drinks",
    },
  ];
}

export default function LessonsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const cards = useMemo(() => buildCards(palette), [palette]);

  return (
    <Screen>
      <ScreenHeader title="Lekce" subtitle="Základy italského jazyka" />

      <View style={styles.streakCard}>
        <View style={styles.streakIcon}>
          <MaterialIcons name="local-fire-department" size={24} color={palette.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakTitle}>5 dní v řadě</Text>
          <Text style={styles.streakSub}>Pokračuj v učení denně</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map((c, i) => {
          const isLeft = i % 2 === 0;
          return (
            <Pressable
              key={c.href}
              onPress={() => router.push(c.href as never)}
              style={({ pressed }) => [
                styles.card,
                isLeft ? styles.cardLeft : styles.cardRight,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
                <MaterialIcons name={c.icon} size={26} color={c.fg} />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardSub}>{c.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function createStyles(p: ColorPalette, s: ThemeShadows) {
  return StyleSheet.create({
    streakCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md + 2,
      backgroundColor: p.accentSoft,
      padding: Spacing.lg + 2,
      borderRadius: Radius.lg,
    },
    streakIcon: {
      width: 48,
      height: 48,
      borderRadius: Radius.pill,
      backgroundColor: p.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    streakTitle: {
      fontFamily: Typography.display.fontFamily,
      fontSize: 17,
      color: p.textStrong,
    },
    streakSub: { ...Typography.body, color: p.text, fontSize: 13 },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
    },
    card: {
      width: "48%",
      minHeight: 168,
      backgroundColor: p.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg + 4,
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: p.border,
      ...s.card,
    },
    cardLeft: {},
    cardRight: {},
    pressed: { opacity: 0.7 },
    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontFamily: Typography.display.fontFamily,
      fontSize: 18,
      color: p.textStrong,
    },
    cardSub: { ...Typography.body, color: p.textMuted, fontSize: 13 },
  });
}
