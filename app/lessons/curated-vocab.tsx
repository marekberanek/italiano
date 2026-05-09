import { StyleSheet, Text, View } from "react-native";

import curatedVocabFallback from "@/assets/data/curated-vocab.json";
import type { CuratedVocabData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function CuratedVocabScreen() {
  const { data } = useSyncedJson("curated-vocab", curatedVocabFallback as CuratedVocabData);
  const tts = useItalianTts();

  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Výběr slovíček" subtitle="Fráze z redakčního obsahu" />

      <SectionCard title="Slovíčka a fráze" tone="brand">
        <View style={{ gap: Spacing.md }}>
          {data.items.map((item, idx) => (
            <View key={`${item.it}-${idx}`} style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.it}>{item.it}</Text>
                <Text style={styles.cz}>{item.cz}</Text>
                {item.tags && item.tags.length > 0 ? (
                  <Text style={styles.tags}>{item.tags.join(" · ")}</Text>
                ) : null}
              </View>
              <PlayButton size="sm" onPress={() => tts.speak(item.it)} />
            </View>
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.brandSoft,
  },
  it: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textStrong,
    fontSize: 16,
    fontStyle: "italic",
  },
  cz: { ...Typography.body, color: Palette.text, fontSize: 14 },
  tags: { ...Typography.small, color: Palette.textMuted },
});
