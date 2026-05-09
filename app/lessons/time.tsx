import timeFallback from "@/assets/data/time.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function TimeLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="time"
      fallback={timeFallback as TopicLessonData}
      title="Čas a hodiny"
      subtitle="Jak říct hodinu, půl a čtvrt, poledne, půlnoc, 24h vs hovorově"
    />
  );
}
