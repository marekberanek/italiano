import colorsShapesFallback from "@/assets/data/colors-shapes.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function ColorsShapesLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="colors-shapes"
      fallback={colorsShapesFallback as TopicLessonData}
      title="Barvy a tvary"
      subtitle="Základní slovíček a shoda: il vestito rosso"
    />
  );
}
