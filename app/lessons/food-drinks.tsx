import foodDrinksFallback from "@/assets/data/food-drinks.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function FoodDrinksLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="food-drinks"
      fallback={foodDrinksFallback as TopicLessonData}
      title="Jídlo a nápoje"
      subtitle="Nápoje, základní jídla, fráze u stolu"
    />
  );
}
