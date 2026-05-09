import ordinalsFallback from "@/assets/data/ordinals.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function OrdinalsLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="ordinals"
      fallback={ordinalsFallback as TopicLessonData}
      title="Řadová čísla"
      subtitle="Primo, secondo… — datum, patro, pořadí"
    />
  );
}
