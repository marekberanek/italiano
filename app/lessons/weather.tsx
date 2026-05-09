import weatherFallback from "@/assets/data/weather.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function WeatherLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="weather"
      fallback={weatherFallback as TopicLessonData}
      title="Počasí"
      subtitle="Sole, pioggia, neve, fa caldo… a krátké fráze"
    />
  );
}
