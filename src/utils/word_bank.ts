import { Word, WordPack } from '../types';
import { getInitialStats } from './srs_algorithm';

// --- 1. DEFINING THE PACKS ---
// We define packs covering roughly 20,000+ words in total potential.
export const AVAILABLE_PACKS: WordPack[] = [
  {
    id: 'cet-4',
    name: 'CET-4 Core (University)',
    description: 'Essential English vocabulary for university students (approx 4,500 words).',
    level: 'Intermediate',
    totalWords: 4500,
    sourceUrl: 'mock-generate' 
  },
  {
    id: 'cet-6',
    name: 'CET-6 Advanced',
    description: 'Advanced vocabulary for higher education (approx 6,000 words).',
    level: 'Advanced',
    totalWords: 6000,
    sourceUrl: 'mock-generate' 
  },
  {
    id: 'toefl-core',
    name: 'TOEFL Essential',
    description: 'Crucial vocabulary for studying abroad in English-speaking countries.',
    level: 'Advanced',
    totalWords: 3000,
    sourceUrl: 'mock-generate'
  },
  {
    id: 'gre-master',
    name: 'GRE Master Class',
    description: 'High-difficulty words for graduate school entry exams.',
    level: 'Expert',
    totalWords: 4000,
    sourceUrl: 'mock-generate'
  },
  {
    id: 'business-pro',
    name: 'Business Professional',
    description: 'Corporate, finance, and marketing terminology.',
    level: 'Business',
    totalWords: 2000,
    sourceUrl: 'mock-generate'
  },
  {
    id: 'medical-basic',
    name: 'Medical English',
    description: 'Fundamental terms for healthcare professionals.',
    level: 'Specialized',
    totalWords: 1500,
    sourceUrl: 'mock-generate'
  },
  {
    id: 'cs-tech',
    name: 'Computer Science & Tech',
    description: 'Vocabulary for programmers and tech industry workers.',
    level: 'Specialized',
    totalWords: 1000,
    sourceUrl: 'mock-generate'
  }
];

// --- 2. FETCH LOGIC ---
export async function fetchWordPack(packId: string): Promise<Word[]> {
  const pack = AVAILABLE_PACKS.find(p => p.id === packId);
  if (!pack) throw new Error("Pack not found");

  // A. REAL FETCHING (If you add a real URL later)
  if (pack.sourceUrl.startsWith('http')) {
    try {
      const response = await fetch(pack.sourceUrl);
      const data = await response.json();
      // Ensure the data is mapped correctly to our 'Word' shape
      return data.map((item: any) => ({
        ...item,
        packId: packId, // Tag it
        srs: getInitialStats() // Ensure it has SRS tracking
      }));
    } catch (e) {
      console.error("Failed to fetch pack, falling back to generator", e);
    }
  }

  // B. MASSIVE SIMULATION (Fallback)
  // Generates thousands of unique placeholder words so you can test the UI limits.
  return new Promise((resolve) => {
    setTimeout(() => {
      const words = generateMassiveMockData(pack);
      resolve(words);
    }, 1500); // Fake a slightly longer loading time for realism
  });
}

// --- 3. GENERATOR ENGINE ---
function generateMassiveMockData(pack: WordPack): Word[] {
  const { id, totalWords, level } = pack;
  
  // We create "deterministic" mock data based on the index
  // so Word #500 is always the same word for testing.
  return Array.from({ length: totalWords }).map((_, i) => {
    // Create a unique ID
    const wordId = `${id}_word_${i}`;
    
    // Simulate different word lengths/styles based on index
    const suffix = i % 2 === 0 ? 'tion' : (i % 3 === 0 ? 'ing' : 'ment');
    const fakeWord = `${id.split('-')[0]}${i}${suffix}`; 
    
    return {
      id: wordId,
      word: fakeWord.charAt(0).toUpperCase() + fakeWord.slice(1), // Capitalize
      phonetic: `/ˈ${id.split('-')[0]}...${i}/`,
      category: level,
      status: 'new', 
      packId: id,
      srs: getInitialStats(),
      
      // Richer definitions to make it look populated
      definitions: [
        { 
          pos: i % 2 === 0 ? 'n.' : 'v.', 
          en: `A specific term used in ${pack.name} contexts (Mock definition #${i}).`, 
          cn: `[${pack.name}] 相关的一个术语 (模拟释义 #${i})` 
        },
        // Add a second definition for every 3rd word
        ...(i % 3 === 0 ? [{
          pos: 'adj.',
          en: `Secondary meaning relating to concept ${i}.`,
          cn: `关于概念 ${i} 的引申含义。`
        }] : [])
      ],
      
      examples: [
        { 
          en: `The ${fakeWord} was critical to the project's success.`, 
          cn: `这个 ${fakeWord} 对项目的成功至关重要。` 
        },
        {
          en: `He questioned the validity of the ${fakeWord}.`,
          cn: `他对 ${fakeWord} 的有效性提出了质疑。`
        }
      ],
      
      note: ""
    };
  });
}