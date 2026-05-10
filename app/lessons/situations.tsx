import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import situationsFallback from "@/assets/data/situations.json";
import type { SituationsData } from "@/assets/data/types";
import { BackLink } from "@/components/back-link";
import { CategoryChip } from "@/components/category-chip";
import { PlayButton } from "@/components/play-button";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionCard } from "@/components/section-card";
import { Palette, Radius, Spacing, Typography } from "@/constants/theme";
import { useItalianTts } from "@/hooks/use-italian-tts";
import { useSyncedJson } from "@/hooks/use-synced-json";

export default function SituationsScreen() {
  const { data } = useSyncedJson("situations", situationsFallback as SituationsData);
  const tts = useItalianTts();
  const [activeId, setActiveId] = useState<string>(situationsFallback.categories[0]?.id ?? "");
  const active = data.categories.find((c) => c.id === activeId);

  useEffect(() => {
    setActiveId((prev) =>
      data.categories.some((c) => c.id === prev) ? prev : data.categories[0]?.id ?? "",
    );
  }, [data]);

  return (
    <Screen>
      <BackLink />
      <ScreenHeader title="Situace" subtitle="Užitečné fráze pro každý den" />

      <View style={styles.chipsRow}>
        {data.categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.title}
            icon={cat.icon as Parameters<typeof CategoryChip>[0]["icon"]}
            active={cat.id === activeId}
            onPress={() => setActiveId(cat.id)}
          />
        ))}
      </View>

      {active ? (
        <SectionCard title={active.title} tone="accent">
          <View style={{ gap: Spacing.sm + 2 }}>
            {active.phrases.map((p, idx) => (
              <View key={`${active.id}-${idx}`} style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.it}>{p.it}</Text>
                  {p.p ? <Text style={styles.pron}>{p.p}</Text> : null}
                  <Text style={styles.cz}>{p.cz}</Text>
                </View>
                <PlayButton size="sm" onPress={() => tts.speak(p.it)} />
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
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
    fontFamily: Typography.smallStrong.fontFamily,
    color: Palette.accent,
    fontSize: 12,
    fontStyle: "italic",
  },
  cz: { ...Typography.small, color: Palette.text },
});
