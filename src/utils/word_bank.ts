// FIX: Use 'import type' for interfaces
import type { Word, WordPack } from '../types';
import { getInitialStats } from './srs_algorithm';

export const AVAILABLE_PACKS: WordPack[] = [
  {
    id: 'common-100',
    name: 'Essential 100',
    description: 'The 100 most common words.',
    level: 'Beginner',
    totalWords: 100,
    sourceUrl: 'mock'
  },
  {
    id: 'business-core',
    name: 'Business Professional',
    description: 'Key vocabulary for office.',
    level: 'Intermediate',
    totalWords: 500,
    sourceUrl: 'mock' 
  },
  {
    id: 'academic-adv',
    name: 'Academic & IELTS',
    description: 'Sophisticated vocabulary for exams.',
    level: 'Advanced',
    totalWords: 1200,
    sourceUrl: 'mock'
  }
];

export async function fetchWordPack(packId: string): Promise<Word[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const words = generateMockWords(packId);
      resolve(words);
    }, 800);
  });
}

function generateMockWords(packId: string): Word[] {
  const count = 20; 
  const category = packId === 'business-core' ? 'Business' : 'General';
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `${packId}_${i}`,
    word: `Word-${packId}-${i + 1}`,
    phonetic: `/wɜːd ${i}/`,
    category: category,
    status: 'new', 
    definitions: [{ pos: 'n.', en: `Definition for word ${i}`, cn: `单词 ${i} 的释义` }],
    examples: [{ en: `Example sentence for word ${i}.`, cn: `例句 ${i}` }],
    note: "",
    packId: packId,
    srs: getInitialStats()
  }));
}