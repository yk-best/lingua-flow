export interface SRSStats {
  interval: number;    // Days until next review
  repetition: number;  // Consecutive correct answers
  efactor: number;     // Easiness Factor
  dueDate: number;     // Timestamp for next review
}

export interface Definition {
  pos: string;
  en: string;
  cn: string;
}

export interface Example {
  en: string;
  cn: string;
}

export interface Word {
  id: number | string;
  word: string;
  phonetic: string;
  category: string;
  status: 'learning' | 'known' | 'new';
  definitions: Definition[];
  examples: Example[];
  note: string;
  srs?: SRSStats;
}