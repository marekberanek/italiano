import falseFriendsFallback from "@/assets/data/false-friends.json";
import type { TopicLessonData } from "@/assets/data/types";
import { TopicLessonScreen } from "@/components/topic-lesson-screen";

export default function FalseFriendsLessonScreen() {
  return (
    <TopicLessonScreen
      bundleId="false-friends"
      fallback={falseFriendsFallback as TopicLessonData}
      title="Falešní přátelé"
      subtitle="Slova podobná češtině / angličtině, ale význam jiný"
    />
  );
}
