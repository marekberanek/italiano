import seasonsFallback from "@/assets/data/seasons.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function SeasonsLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="seasons"
      fallback={seasonsFallback as TopicLessonData}
      title="Roční období"
      subtitle="Primavera, estate, autunno, inverno a typické věty"
    />
  );
}
