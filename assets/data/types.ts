/** [person, italian, czech, czech-friendly pronunciation in brackets] */
export type VerbRow = [string, string, string, string];

export type VerbConjugation = {
  id: string;
  title: string;
  rows: VerbRow[];
};

export type GrammarRule = {
  rule: string;
  example: string;
  translation: string;
  p?: string;
};

export type GrammarData = {
  verbs: VerbConjugation[];
  rules: GrammarRule[];
};

/** [number, italian word, czech-friendly pronunciation in brackets] */
export type NumberRow = [number, string, string];

export type NumbersData = {
  list: NumberRow[];
  composition: NumberRow[];
};

/** [letter, italian name, czech-friendly pronunciation in brackets] */
export type AlphabetRow = [string, string, string];

export type AlphabetData = {
  letters: AlphabetRow[];
};

export type CalendarNote = {
  title: string;
  it: string;
  cz: string;
  p?: string;
};

export type WeekdayEntry = {
  it: string;
  cz: string;
  p?: string;
};

export type WeekdaysData = {
  days: WeekdayEntry[];
  notes?: CalendarNote[];
};

export type MonthEntry = {
  it: string;
  cz: string;
  p?: string;
};

export type MonthsData = {
  months: MonthEntry[];
  notes?: CalendarNote[];
};

export type PronunciationRule = {
  combo: string;
  pronunciation: string;
  example: string;
};

export type PronunciationData = {
  rules: PronunciationRule[];
};

export type SituationPhrase = {
  it: string;
  cz: string;
  p?: string;
};

export type SituationCategory = {
  id: string;
  title: string;
  icon: string;
  phrases: SituationPhrase[];
};

export type SituationsData = {
  categories: SituationCategory[];
};

export type TopicLessonLine = {
  it: string;
  cz: string;
  p?: string;
  /** Extra context (e.g. false friend warning) */
  hint?: string;
};

export type TopicLessonSection = {
  title: string;
  subtitle?: string;
  items: TopicLessonLine[];
};

export type TopicLessonData = {
  sections: TopicLessonSection[];
};

export type CuratedVocabItem = {
  it: string;
  cz: string;
  tags?: string[];
};

export type CuratedVocabData = {
  items: CuratedVocabItem[];
};

export type VocabWord = {
  id: number;
  /** Stable id across devices; used for Supabase upsert / merge. */
  clientUuid: string;
  it: string;
  cz: string;
  p: string;
  /** Optional example sentence (usually from lookup); used for cloze-style prompts in quiz. */
  exIt?: string;
  exCz?: string;
  learned: boolean;
  streak: number;
  /** ISO 8601; used for last-write-wins text merge with server `updated_at`. */
  updatedAt?: string;
};

export type VocabState = {
  vocab: VocabWord[];
  nextId: number;
};

export type LookupResult = {
  it: string;
  cz: string;
  p?: string;
  ex_it?: string;
  ex_cz?: string;
};
