import bodyHealthFallback from "@/assets/data/body-health.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function BodyHealthLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="body-health"
      fallback={bodyHealthFallback as TopicLessonData}
      title="Tělo a zdraví"
      subtitle="Rozšíření + odkaz na situaci Zdraví v lekci Situace"
    />
  );
}
