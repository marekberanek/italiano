import holidaysFallback from "@/assets/data/holidays-it.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function HolidaysItLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="holidays-it"
      fallback={holidaysFallback as TopicLessonData}
      title="Svátky v Itálii"
      subtitle="Stručný kulturní kontext — bez kalendáře v aplikaci"
    />
  );
}
