import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Check, X, Star, CheckCircle2, 
  Settings, Trophy, Flame, TrendingUp, Plus, ArrowLeft, Save, Cloud, Download, Upload, Loader2, Library, Play, Brain, BarChart3, List, BookOpen
} from 'lucide-react';

// ============================================================================
//  PREVIEW ENVIRONMENT FIX
//  To make the app run in this chat window, all components and utilities 
//  must be in this single file. 
//  
//  LOCALLY: You should keep your split structure (src/components, src/utils).
// ============================================================================

// --- 1. TYPES ---
interface SRSStats {
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: number;
}

interface Definition {
  pos: string;
  en: string;
  cn: string;
}

interface Example {
  en: string;
  cn: string;
}

interface Word {
  id: number | string;
  word: string;
  phonetic: string;
  category: string;
  status: 'learning' | 'known' | 'new';
  definitions: Definition[];
  examples: Example[];
  note: string;
  srs?: SRSStats;
  packId?: string;
}

interface WordPack {
  id: string;
  name: string;
  description: string;
  level: string;
  totalWords: number;
  sourceUrl: string;
}

// --- 2. UTILS: SRS ALGORITHM ---
function getInitialStats(): SRSStats {
  return { interval: 0, repetition: 0, efactor: 2.5, dueDate: Date.now() };
}

function getNextDueDate(intervalInDays: number): number {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return Date.now() + (intervalInDays * ONE_DAY_MS);
}

function calculateReview(currentStats: SRSStats, quality: number): SRSStats {
  let { interval, repetition, efactor } = currentStats;
  if (quality >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }
  const newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  efactor = Math.max(newEfactor, 1.3);
  return { interval, repetition, efactor, dueDate: 0 };
}

// --- 3. UTILS: SYNC ---
async function saveToGist(token: string, data: any, existingGistId?: string) {
  const url = existingGistId ? `https://api.github.com/gists/${existingGistId}` : `https://api.github.com/gists`;
  const method = existingGistId ? 'PATCH' : 'POST';
  const body = { description: "LinguaFlow Data", public: false, files: { "lingua-flow-data.json": { content: JSON.stringify(data, null, 2) } } };
  
  try {
    const response = await fetch(url, { method, headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(response.statusText);
    const json = await response.json();
    return { success: true, message: "Saved!", gistId: json.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function loadFromGist(token: string, gistId: string) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers: { 'Authorization': `token ${token}` } });
    if (!response.ok) throw new Error("Failed to load");
    const json = await response.json();
    const file = json.files["lingua-flow-data.json"];
    if (!file) throw new Error("Invalid Gist");
    return { success: true, message: "Loaded!", data: JSON.parse(file.content) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 4. UTILS: WORD BANK ---
const AVAILABLE_PACKS: WordPack[] = [
  { id: 'common-100', name: 'Essential 100', description: 'The 100 most common words.', level: 'Beginner', totalWords: 100, sourceUrl: 'mock' },
  { id: 'business-core', name: 'Business Pro', description: 'Corporate vocabulary.', level: 'Intermediate', totalWords: 500, sourceUrl: 'mock' },
  { id: 'academic-adv', name: 'Academic & IELTS', description: 'Advanced vocabulary.', level: 'Advanced', totalWords: 1200, sourceUrl: 'mock' }
];

async function fetchWordPack(packId: string): Promise<Word[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock generation
      const words = Array.from({ length: 20 }).map((_, i) => ({
        id: `${packId}_${Date.now()}_${i}`,
        word: `Word-${i + 1}`,
        phonetic: `/test-${i}/`,
        category: packId === 'business-core' ? 'Business' : 'General',
        status: 'new' as const,
        definitions: [{ pos: 'n.', en: `Definition for word ${i}`, cn: `单词 ${i} 的释义` }],
        examples: [{ en: `Example sentence for word ${i}.`, cn: `例句 ${i}` }],
        note: "",
        packId: packId,
        srs: getInitialStats()
      }));
      resolve(words);
    }, 800);
  });
}

// --- 5. COMPONENTS: LAYOUT ---
function Layout({ children, currentView, onNavigate }: any) {
  const NavButton = ({ id, icon: Icon, label }: any) => (
    <button onClick={() => onNavigate(id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${currentView === id ? 'text-indigo-600 bg-indigo-50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white h-[100dvh] md:h-[850px] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden flex flex-col border-0 md:border border-slate-200/60 relative">
        <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xl tracking-tight"><Brain className="w-7 h-7 fill-indigo-600 text-indigo-100" /><span>LinguaFlow</span></div>
          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">K</div>
        </header>
        <main className="flex-1 flex flex-col relative overflow-y-auto bg-slate-50/50 scrollbar-hide"><div className="flex-1 p-5 flex flex-col">{children}</div></main>
        <nav className="bg-white px-6 py-3 border-t border-slate-100 flex justify-between items-center pb-6 md:pb-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <NavButton id="learn" icon={BookOpen} label="Learn" /><NavButton id="library" icon={Library} label="Library" /><NavButton id="list" icon={List} label="Vocab" /><NavButton id="dashboard" icon={BarChart3} label="Stats" /><NavButton id="settings" icon={Settings} label="Settings" />
        </nav>
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } .custom-scroll::-webkit-scrollbar { width: 4px; } .custom-scroll::-webkit-scrollbar-track { background: transparent; } .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  );
}

// --- 6. COMPONENTS: FLASHCARD ---
function Flashcard({ word, onMarkKnown, onUpdateNote }: any) {
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => setIsFlipped(false), [word.id]);
  const speakText = (text: string, e?: React.MouseEvent) => { e?.stopPropagation(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u); };
  
  return (
    <div className="flex-1 relative [perspective:1000px] cursor-pointer group min-h-[460px]" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* Front */}
        <div className={`absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-xl shadow-indigo-200/40 p-8 flex flex-col items-center justify-center border border-white [backface-visibility:hidden] ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute top-6 w-full px-8 flex justify-between items-center">
            <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full">{word.category}</span>
            <button onClick={(e) => { e.stopPropagation(); onMarkKnown(); }} className="group/btn flex items-center gap-2 p-2 pr-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full transition-all border border-slate-100 hover:border-emerald-200" title="Mark Known"><CheckCircle2 className="w-6 h-6" /><span className="text-xs font-bold max-w-0 overflow-hidden group-hover/btn:max-w-[100px] transition-all duration-300 whitespace-nowrap">Mark Known</span></button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-4">
            <h2 className="text-5xl font-bold text-slate-800 mb-4 text-center tracking-tight">{word.word}</h2>
            <p className="text-slate-400 font-mono mb-10 text-xl">{word.phonetic}</p>
            <button onClick={(e) => speakText(word.word, e)} className="p-5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-indigo-200"><Volume2 className="w-8 h-8" /></button>
          </div>
          <div className="mt-auto text-sm text-slate-400 flex items-center gap-2 font-medium animate-pulse">Tap card to flip <ChevronRight className="w-4 h-4" /></div>
        </div>
        {/* Back */}
        <div className={`absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-xl shadow-indigo-200/40 p-6 flex flex-col border border-white [backface-visibility:hidden] [transform:rotateY(180deg)] ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
            <div className="flex flex-col"><h3 className="text-2xl font-bold text-indigo-600 leading-none">{word.word}</h3><span className="text-sm text-slate-400 font-mono mt-1">{word.phonetic}</span></div>
            <div className="flex gap-2">
              <button onClick={(e) => speakText(word.word, e)} className="text-indigo-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 className="w-5 h-5" /></button>
              <button onClick={() => setIsFlipped(false)} className="text-slate-300 hover:text-slate-500 p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scroll">
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Definitions</h4>{word.definitions.map((def: any, i: number) => (<div key={i} className="mb-4 last:mb-0 group"><div className="flex gap-3 mb-1"><span className="text-xs font-bold text-white bg-indigo-500 px-2 py-1 rounded-md h-fit mt-0.5 shadow-sm shadow-indigo-200">{def.pos}</span><span className="text-slate-800 font-bold text-lg leading-snug">{def.cn}</span></div><p className="text-sm text-slate-500 ml-10 leading-relaxed border-l-2 border-slate-100 pl-3">{def.en}</p></div>))}</div>
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Examples</h4><div className="space-y-3">{word.examples.map((ex: any, i: number) => (<div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors"><div className="flex justify-between items-start gap-3 mb-2"><p className="text-slate-700 text-[15px] italic font-medium leading-relaxed">"{ex.en}"</p><button onClick={(e) => speakText(ex.en, e)} className="shrink-0 mt-0.5 text-slate-300 hover:text-indigo-500"><Volume2 className="w-4 h-4" /></button></div><p className="text-xs text-slate-500 font-medium">{ex.cn}</p></div>))}</div></div>
            <div><h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider"><Edit3 className="w-3 h-3" /> My Notes</h4><textarea className="w-full p-4 text-sm text-slate-600 bg-amber-50/50 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none resize-none transition-all placeholder:text-amber-200/70" rows={3} placeholder="Write your memory hooks here..." value={word.note} onChange={(e) => onUpdateNote(word.id, e.target.value)}/></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 7. MAIN APP LOGIC ---
export default function App() {
  const [vocabList, setVocabList] = useState<Word[]>(() => {
    const saved = localStorage.getItem('lingua-flow-vocab');
    return saved ? JSON.parse(saved) : [];
  });

  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('lingua-flow-token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('lingua-flow-gist-id') || '');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [view, setView] = useState('learn');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0 });
  const [dailyGoal, setDailyGoal] = useState(20);
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [newWord, setNewWord] = useState({ word: '', translation: '', definition: '', example: '', category: 'General' });

  useEffect(() => { localStorage.setItem('lingua-flow-vocab', JSON.stringify(vocabList)); }, [vocabList]);
  useEffect(() => { localStorage.setItem('lingua-flow-token', githubToken); localStorage.setItem('lingua-flow-gist-id', gistId); }, [githubToken, gistId]);

  const learningQueue = useMemo(() => {
    const now = Date.now();
    const dueReviews = vocabList.filter(w => w.status === 'learning' && w.srs && w.srs.dueDate <= now).sort((a, b) => (a.srs?.dueDate || 0) - (b.srs?.dueDate || 0));
    const remainingNewWords = Math.max(0, dailyGoal - sessionStats.reviewed);
    const newWords = vocabList.filter(w => w.status === 'new').slice(0, remainingNewWords);
    return [...dueReviews, ...newWords];
  }, [vocabList, dailyGoal, sessionStats.reviewed]);

  const currentCard = learningQueue[currentCardIndex];
  const knownVocabCount = vocabList.filter(v => v.status === 'known').length;

  const handleDownloadPack = async (pack: WordPack) => {
    setDownloadingPackId(pack.id);
    try {
      const newWords = await fetchWordPack(pack.id);
      const uniqueNewWords = newWords.filter(nw => !vocabList.some(existing => existing.word === nw.word));
      setVocabList(prev => [...prev, ...uniqueNewWords]);
      alert(`Successfully added ${uniqueNewWords.length} words from ${pack.name}!`);
      setView('list');
    } catch (e) { alert("Failed to download pack."); } finally { setDownloadingPackId(null); }
  };

  const markAsKnown = () => {
    if (!currentCard) return;
    setVocabList(prev => prev.map(w => w.id === currentCard.id ? { ...w, status: 'known' } : w));
    setSessionStats(prev => ({ ...prev, mastered: prev.mastered + 1 }));
  };

  const updateNote = (id: number | string, newNote: string) => {
    setVocabList(prev => prev.map(w => w.id === id ? { ...w, note: newNote } : w));
  };

  const handleReview = (difficulty: 'forgot' | 'hard' | 'easy') => {
    if (!currentCard) return;
    let quality = 0;
    switch (difficulty) {
      case 'forgot': quality = 1; break;
      case 'hard': quality = 3; break;
      case 'easy': quality = 5; break;
    }
    const currentStats = currentCard.srs || getInitialStats();
    const newStats = calculateReview(currentStats, quality);
    const nextDueDate = getNextDueDate(newStats.interval);
    console.log(`[SRS] ${currentCard.word}: Quality ${quality} -> Next: ${newStats.interval}d`);
    
    setVocabList(prev => prev.map(w => w.id === currentCard.id ? { ...w, status: 'learning', srs: { ...newStats, dueDate: nextDueDate } } : w));
    setSessionStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));
    
    if (currentCardIndex >= learningQueue.length - 1) { setCurrentCardIndex(0); }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word) return;
    const wordEntry: Word = {
      id: Date.now(), word: newWord.word, phonetic: "", category: newWord.category, status: 'new',
      definitions: [{ pos: 'n.', en: newWord.definition, cn: newWord.translation }], examples: [{ en: newWord.example, cn: '' }], note: "", srs: getInitialStats()
    };
    setVocabList(prev => [wordEntry, ...prev]);
    setNewWord({ word: '', translation: '', definition: '', example: '', category: 'General' });
    setView('list');
  };

  const handleSync = async (direction: 'upload' | 'download') => {
    if (!githubToken) { setSyncStatus('Error: Token missing'); return; }
    setIsSyncing(true);
    if (direction === 'upload') {
      const res = await saveToGist(githubToken, vocabList, gistId);
      if (res.success && res.gistId) { setGistId(res.gistId); setSyncStatus('Saved!'); } else setSyncStatus('Failed.');
    } else {
      const res = await loadFromGist(githubToken, gistId);
      if (res.success && res.data) { setVocabList(res.data); setSyncStatus('Loaded!'); } else setSyncStatus('Failed.');
    }
    setIsSyncing(false);
  };

  const resetData = () => {
    if (confirm("Reset all data?")) { setVocabList([]); localStorage.removeItem('lingua-flow-vocab'); window.location.reload(); }
  };

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === 'learn' && (
        <>
          {learningQueue.length > 0 ? (
            <>
              <div className="flex justify-between items-end mb-3 px-1">
                <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Today</span><div className="text-2xl font-bold text-slate-700 leading-none">{learningQueue.length} <span className="text-base text-slate-400 font-normal">words</span></div></div>
                <div className="text-right"><div className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{sessionStats.reviewed} Reviewed</div></div>
              </div>
              <Flashcard word={currentCard} onMarkKnown={markAsKnown} onUpdateNote={updateNote} />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <button onClick={() => handleReview('forgot')} className="flex flex-col items-center justify-center py-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 active:scale-95 transition-all border border-rose-100"><X className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Forgot</span></button>
                <button onClick={() => handleReview('hard')} className="flex flex-col items-center justify-center py-4 bg-amber-50 text-amber-500 rounded-2xl hover:bg-amber-100 active:scale-95 transition-all border border-amber-100"><RefreshCw className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Hard</span></button>
                <button onClick={() => handleReview('easy')} className="flex flex-col items-center justify-center py-4 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-100"><Check className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Easy</span></button>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><CheckCircle2 className="w-12 h-12 text-indigo-500" /></div>
               <h2 className="text-2xl font-extrabold text-slate-800 mb-2">All Caught Up!</h2>
               <p className="text-slate-500 max-w-[200px] leading-relaxed mb-8">Your queue is empty. Great job!</p>
               <button onClick={() => setView('library')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-95"><Library className="w-5 h-5" /> Get More Words</button>
             </div>
          )}
        </>
      )}

      {view === 'library' && (
        <div className="space-y-6 pb-24 animate-in slide-in-from-right-8 duration-300">
          <h2 className="text-2xl font-extrabold text-slate-800 px-1">Word Packs</h2>
          <div className="space-y-4">
            {AVAILABLE_PACKS.map(pack => (
              <div key={pack.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div><h3 className="font-bold text-slate-800 text-lg">{pack.name}</h3><span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{pack.level}</span></div>
                  <div className="text-right"><span className="text-xs font-bold text-slate-400">{pack.totalWords} words</span></div>
                </div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{pack.description}</p>
                <button onClick={() => handleDownloadPack(pack)} disabled={downloadingPackId === pack.id} className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 transition-all active:scale-95">
                  {downloadingPackId === pack.id ? (<><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>) : (<><Download className="w-4 h-4" /> Add to My List</>)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-6 pb-24 relative min-h-full">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-2xl font-extrabold text-slate-800">My Vocabulary</h2>
            <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{vocabList.length} Words</span>
          </div>
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {vocabList.length === 0 ? (<div className="p-8 text-center text-slate-400">No words yet. Go to Library to add some!</div>) : (
              vocabList.map((item) => (
                <div key={item.id} className={`p-5 border-b border-slate-100 last:border-0 flex justify-between items-start hover:bg-slate-50 transition-colors ${item.status === 'known' ? 'bg-slate-50/50' : ''}`}>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-lg ${item.status === 'known' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{item.word}</span>
                      {item.status === 'known' && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> KNOWN</span>}
                      {item.status === 'new' && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">NEW</span>}
                    </div>
                    <div className="space-y-1">{item.definitions.map((d, i) => (<div key={i} className="text-sm text-slate-600 leading-snug"><span className="inline-block text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mr-2 align-middle uppercase tracking-wide">{d.pos}</span>{d.cn}</div>))}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => setView('add')} className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50"><Plus className="w-8 h-8" /></button>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <h2 className="text-2xl font-extrabold text-slate-800 px-1 mb-2">Your Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-[1.5rem] shadow-lg shadow-indigo-200 relative overflow-hidden"><Trophy className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-400 opacity-20" /><div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Mastered</div><div className="text-4xl font-extrabold">{knownVocabCount}</div></div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden"><Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-400 opacity-10" /><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Reviewed Today</div><div className="text-4xl font-extrabold text-slate-800">{sessionStats.reviewed}</div></div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <h2 className="text-2xl font-extrabold text-slate-800 px-1 mb-2">Settings</h2>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Cloud className="w-5 h-5 text-indigo-500" /> Cloud Sync</h3>
            <div className="space-y-4">
              <input type="password" className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="GitHub Token" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
              <input type="text" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-mono" placeholder="Gist ID (Optional)" value={gistId} onChange={(e) => setGistId(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSync('upload')} disabled={isSyncing || !githubToken} className="py-3 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50">{isSyncing ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />} Save</button>
                <button onClick={() => handleSync('download')} disabled={isSyncing || !githubToken} className="py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50">{isSyncing ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />} Load</button>
              </div>
              {syncStatus && <div className="text-xs text-center text-slate-500">{syncStatus}</div>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" /> Data</h3>
            <button onClick={resetData} className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-bold">Reset All Progress</button>
          </div>
        </div>
      )}

      {view === 'add' && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-2 mb-6"><button onClick={() => setView('list')} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-indigo-600"><ArrowLeft className="w-5 h-5" /></button><h2 className="text-2xl font-extrabold text-slate-800">Add New Word</h2></div>
          <form onSubmit={handleAddWord} className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">English Word</label><input autoFocus type="text" className="w-full p-4 text-lg font-bold text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all" placeholder="e.g. Serendipity" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Chinese Meaning</label><input type="text" className="w-full p-4 text-lg text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all" placeholder="e.g. 意外发现珍奇事物的本领" value={newWord.translation} onChange={e => setNewWord({...newWord, translation: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Word</button>
          </form>
        </div>
      )}
    </Layout>
  );
}