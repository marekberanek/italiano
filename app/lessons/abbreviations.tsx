import abbreviationsFallback from "@/assets/data/abbreviations.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function AbbreviationsLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="abbreviations"
      fallback={abbreviationsFallback as TopicLessonData}
      title="Zkratky a značky"
      subtitle="ecc., sig., ca. a fráze z cest (doprava)"
    />
  );
}
