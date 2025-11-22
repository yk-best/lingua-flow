export interface SRSStats {
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: number;
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
  packId?: string; // New field to track origin
}

// New Interface for Word Packs
export interface WordPack {
  id: string;
  name: string;
  description: string;
  level: string;
  totalWords: number;
  sourceUrl: string; // Where to fetch the JSON from
  isDownloaded?: boolean;
}