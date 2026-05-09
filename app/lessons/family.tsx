import familyFallback from "@/assets/data/family.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function FamilyLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="family"
      fallback={familyFallback as TopicLessonData}
      title="Rodina a vztahy"
      subtitle="Madre, padre, figlio, marito, moglie…"
    />
  );
}
