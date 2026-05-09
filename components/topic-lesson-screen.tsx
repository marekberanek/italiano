import { StyleSheet, Text, View } from "react-native";

import type { ContentBundleId } from "@/lib/content/bundle-ids";
import type { TopicLessonData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

const TONES = ["brand", "accent", "ochre", "navy"] as const;

type Props = {
  bundleId: ContentBundleId;
  fallback: TopicLessonData;
  title: string;
  subtitle?: string;
};

export function TopicLessonScreen({ bundleId, fallback, title, subtitle }: Props) {
  const { data } = useSyncedJson(bundleId, fallback);
  const tts = useItalianTts();

  return (
    <Screen>
      <BackLink />
      <ScreenHeader title={title} subtitle={subtitle} />

      {data.sections.map((section, sIdx) => (
        <SectionCard
          key={`${section.title}-${sIdx}`}
          title={section.title}
          subtitle={section.subtitle}
          tone={TONES[sIdx % TONES.length]}
        >
          <View style={{ gap: Spacing.md }}>
            {section.items.map((item, iIdx) => (
              <View key={`${item.it}-${iIdx}`} style={styles.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.it}>{item.it}</Text>
                  {item.p ? <Text style={styles.pron}>{item.p}</Text> : null}
                  <Text style={styles.cz}>{item.cz}</Text>
                  {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
                </View>
                <PlayButton size="sm" onPress={() => tts.speak(item.it)} />
              </View>
            ))}
          </View>
        </SectionCard>
      ))}
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
    backgroundColor: Palette.surfaceMuted,
  },
  it: {
    fontFamily: Typography.bodyStrong.fontFamily,
    color: Palette.textStrong,
    fontSize: 15,
    fontStyle: "italic",
  },
  pron: {
    ...Typography.small,
    color: Palette.textMuted,
    fontStyle: "italic",
    fontSize: 12,
  },
  cz: { ...Typography.body, color: Palette.text, fontSize: 14 },
  hint: {
    ...Typography.small,
    color: Palette.accent,
    fontSize: 12,
  },
});
