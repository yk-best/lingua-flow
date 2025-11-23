import type { Word, WordPack } from '../types';
import { getInitialStats } from './srs_algorithm';

// 1. DEFINE PACKS
export const AVAILABLE_PACKS: WordPack[] = [
  {
    id: 'full-30k',
    name: 'Complete 30k Database',
    description: 'The ultimate vocabulary list. Ranked by frequency from common to obscure.',
    level: 'All Levels',
    totalWords: 30000,
    // Note: This URL assumes you deploy to GitHub Pages. 
    // Locally it will look for http://localhost:5173/vocab_30k.json
    // When deployed, it looks for https://user.github.io/lingua-flow/vocab_30k.json
    sourceUrl: './vocab_30k.json' 
  },
  // ... keep your other packs if you want
];

// 2. FETCH LOGIC
export async function fetchWordPack(packId: string): Promise<Word[]> {
  const pack = AVAILABLE_PACKS.find(p => p.id === packId);
  if (!pack) throw new Error("Pack not found");

  // If it's a real file path (starts with . or http)
  if (pack.sourceUrl.startsWith('.') || pack.sourceUrl.startsWith('http')) {
    try {
      // Correct the path for GitHub Pages subfolder if needed
      // If running locally, './vocab_30k.json' works.
      // If deployed, we might need to prepend the base path if not automatic.
      const response = await fetch(pack.sourceUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // IMPORTANT: Map the raw JSON to ensure it has SRS defaults
      // (The Python script adds them, but safety first)
      return data.map((item: any) => ({
        ...item,
        packId: packId,
        srs: item.srs || getInitialStats()
      }));
    } catch (e) {
      console.error("Fetch Error:", e);
      alert("Could not load the large file. Make sure 'vocab_30k.json' is in the public folder.");
      return [];
    }
  }

  // Fallback for mock packs
  return generateMockWords(packId);
}

// ... keep generateMockWords function ...
function generateMockWords(packId: string): Word[] {
    // ... existing mock code ...
    return [];
}