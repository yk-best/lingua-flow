import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Check, X, CheckCircle2, 
  Trophy, Flame, TrendingUp, Plus, ArrowLeft, Cloud, Download, Loader2, Library, ChevronRight, ChevronLeft, Search
} from 'lucide-react';

import Layout from './components/Layout';
import Flashcard from './components/Flashcard';
import type { Word, WordPack } from './types';
import { calculateReview, getInitialStats, getNextDueDate } from './utils/srs_algorithm';
import { saveToGist, loadFromGist } from './utils/sync';
import { AVAILABLE_PACKS, fetchWordPack } from './utils/word_bank';

// PROGRESS OVERLAY
interface UserProgress {
  [wordId: string]: {
    status?: 'learning' | 'known' | 'new';
    srs?: any;
    note?: string;
    customExamples?: any[];
  }
}

const LEVELS = ['All', 'Common', 'Intermediate', 'Advanced', 'Master'];

export default function App() {
  // 1. BASE DATA
  const [baseVocab, setBaseVocab] = useState<Word[]>([]);
  
  // 2. PROGRESS DATA
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem('lingua-flow-progress');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // 3. MERGED DATA
  const vocabList = useMemo(() => {
    if (baseVocab.length === 0) return [];
    return baseVocab.map(w => {
      const p = userProgress[w.id];
      if (!p) return w;
      return {
        ...w,
        status: p.status || w.status,
        srs: p.srs || w.srs,
        note: p.note || w.note,
        examples: p.customExamples ? [...p.customExamples, ...w.examples] : w.examples
      };
    });
  }, [baseVocab, userProgress]);

  // --- STATE ---
  const [filterLevel, setFilterLevel] = useState('All'); 
  const [page, setPage] = useState(0);
  const WORDS_PER_PAGE = 50;
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('lingua-flow-token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('lingua-flow-gist-id') || '');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [view, setView] = useState('learn');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0 });
  
  // Settings State
  const [dailyGoal, setDailyGoal] = useState(() => parseInt(localStorage.getItem('lingua-flow-goal') || '20'));
  
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [newWord, setNewWord] = useState({ word: '', translation: '', definition: '', example: '', category: 'General' });

  // --- INIT ---
  useEffect(() => {
    const loadBase = async () => {
      const shouldLoad = localStorage.getItem('has-30k');
      if (shouldLoad === 'true') {
        try {
          const res = await fetch('./vocab_30k.json');
          if (res.ok) {
            const data = await res.json();
            setBaseVocab(data);
          }
        } catch (e) { console.log("Could not auto-load 30k file"); }
      }
    };
    loadBase();
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem('lingua-flow-progress', JSON.stringify(userProgress));
    } catch(e) { alert("Storage Full"); }
  }, [userProgress]);

  useEffect(() => {
    localStorage.setItem('lingua-flow-token', githubToken);
    localStorage.setItem('lingua-flow-gist-id', gistId);
    localStorage.setItem('lingua-flow-goal', dailyGoal.toString());
  }, [githubToken, gistId, dailyGoal]);

  // --- FILTERED LIST (Level + Search) ---
  const filteredVocabList = useMemo(() => {
    let list = vocabList;
    
    // 1. Level Filter
    if (filterLevel !== 'All') {
      list = list.filter(w => w.category === filterLevel);
    }

    // 2. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w => w.word.toLowerCase().includes(q) || w.definitions[0].cn.includes(q));
    }
    
    return list;
  }, [vocabList, filterLevel, searchQuery]);

  // --- QUEUE LOGIC ---
  const learningQueue = useMemo(() => {
    const now = Date.now();
    
    const sourceList = filterLevel === 'All' ? vocabList : filteredVocabList;

    const dueReviews = sourceList
      .filter(w => w.status === 'learning' && w.srs && w.srs.dueDate <= now)
      .sort((a, b) => (a.srs?.dueDate || 0) - (b.srs?.dueDate || 0));
    
    const remaining = Math.max(0, dailyGoal - sessionStats.reviewed);
    const newWords = sourceList
      .filter(w => w.status === 'new')
      .slice(0, remaining);
    
    return [...dueReviews, ...newWords];
  }, [vocabList, filteredVocabList, filterLevel, dailyGoal, sessionStats.reviewed]);

  const safeIndex = currentCardIndex < learningQueue.length ? currentCardIndex : 0;
  const currentCard = learningQueue[safeIndex];
  const knownVocabCount = useMemo(() => vocabList.filter(v => v.status === 'known').length, [vocabList]);

  // --- ACTIONS ---
  const updateWordProgress = (id: string | number, updates: any) => {
    setUserProgress(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates }
    }));
  };

  const handleDownloadPack = async (pack: WordPack) => {
    setDownloadingPackId(pack.id);
    try {
      if (pack.totalWords > 10000) {
        const res = await fetch('./vocab_30k.json');
        if(!res.ok) throw new Error("File missing");
        const data = await res.json();
        setBaseVocab(data);
        localStorage.setItem('has-30k', 'true');
        alert("30k Pack Loaded! (Performance Mode)");
      } else {
        const newWords = await fetchWordPack(pack.id);
        setBaseVocab(prev => [...prev, ...newWords]);
      }
      setView('list');
    } catch (e) { alert("Failed to load pack."); }
    finally { setDownloadingPackId(null); }
  };

  const handleReview = (difficulty: string) => {
    if (!currentCard) return;
    let quality = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 3 : 1;
    const srs = currentCard.srs || getInitialStats();
    const newSrs = calculateReview(srs, quality);
    const dueDate = getNextDueDate(newSrs.interval);
    
    updateWordProgress(currentCard.id, { status: 'learning', srs: { ...newSrs, dueDate } });
    setSessionStats(p => ({ ...p, reviewed: p.reviewed + 1 }));
    if (currentCardIndex >= learningQueue.length - 1) setCurrentCardIndex(0);
  };

  const markAsKnown = () => {
    if (!currentCard) return;
    updateWordProgress(currentCard.id, { status: 'known' });
    setSessionStats(p => ({ ...p, mastered: p.mastered + 1 }));
  };

  const updateNote = (id: string|number, note: string) => updateWordProgress(id, { note });
  const updateExample = (id: string|number, ex: string) => {
    const oldEx = userProgress[id]?.customExamples || [];
    updateWordProgress(id, { customExamples: [{en: ex, cn: ''}, ...oldEx] });
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newWord.word) return;
    const w: Word = {
      id: Date.now(), word: newWord.word, phonetic: '', category: newWord.category, status: 'new',
      definitions: [{pos:'n.', en:newWord.definition, cn:newWord.translation}], examples: [{en:newWord.example, cn:''}], note:'', srs: getInitialStats()
    };
    setBaseVocab(prev => [w, ...prev]);
    updateWordProgress(w.id, { status: 'new' });
    setNewWord({word:'', translation:'', definition:'', example:'', category:'General'});
    setView('list');
  };

  const handleSync = async (dir: 'upload' | 'download') => {
    if(!githubToken) return;
    setIsSyncing(true);
    if (dir === 'upload') {
      const res = await saveToGist(githubToken, userProgress, gistId);
      if (res.success && res.gistId) { setGistId(res.gistId); setSyncStatus('Progress Saved!'); }
    } else {
      const res = await loadFromGist(githubToken, gistId);
      if (res.success) { setUserProgress(res.data); setSyncStatus('Progress Loaded!'); }
    }
    setIsSyncing(false);
  };

  const resetData = () => {
    if (confirm("Wipe progress?")) {
      localStorage.removeItem('lingua-flow-progress');
      localStorage.removeItem('has-30k');
      window.location.reload();
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredVocabList.length / WORDS_PER_PAGE);
  const visibleList = filteredVocabList.slice(page * WORDS_PER_PAGE, (page + 1) * WORDS_PER_PAGE);

  // Component
  const FilterBar = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
      {LEVELS.map(level => (
        <button
          key={level}
          onClick={() => { setFilterLevel(level); setPage(0); setCurrentCardIndex(0); }}
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filterLevel === level 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'bg-white text-slate-500 border border-slate-200'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === 'learn' && (
        <>
          {learningQueue.length > 0 ? (
            <>
              <div className="flex justify-between items-end mb-2 px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue</span>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded">{filterLevel}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-700">{learningQueue.length}</div>
                </div>
                <div className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{sessionStats.reviewed} / {dailyGoal} Reviewed</div>
              </div>
              
              <FilterBar />

              <Flashcard word={currentCard} onMarkKnown={markAsKnown} onUpdateNote={updateNote} onUpdateExample={updateExample} />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <button onClick={()=>handleReview('forgot')} className="py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold active:scale-95 transition-all"><X className="w-6 h-6 mx-auto mb-1"/>Forgot</button>
                <button onClick={()=>handleReview('hard')} className="py-4 bg-amber-50 text-amber-500 rounded-2xl font-bold active:scale-95 transition-all"><RefreshCw className="w-6 h-6 mx-auto mb-1"/>Hard</button>
                <button onClick={()=>handleReview('easy')} className="py-4 bg-emerald-50 text-emerald-500 rounded-2xl font-bold active:scale-95 transition-all"><Check className="w-6 h-6 mx-auto mb-1"/>Easy</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><CheckCircle2 className="w-12 h-12 text-indigo-500"/></div>
              <h2 className="text-2xl font-bold text-slate-800">All Caught Up!</h2>
              <p className="text-slate-400 mt-2 mb-6 text-sm">No {filterLevel !== 'All' ? filterLevel : ''} words due.</p>
              <div className="mb-8"><FilterBar /></div>
              <button onClick={()=>setView('library')} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Library className="w-5 h-5"/> Get Words</button>
            </div>
          )}
        </>
      )}

      {view === 'library' && (
        <div className="space-y-4 pb-24">
          <h2 className="text-2xl font-bold text-slate-800">Library</h2>
          {AVAILABLE_PACKS.map(pack => (
            <div key={pack.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-lg">{pack.name}</h3>
                <span className="text-xs font-bold text-slate-400">{pack.totalWords} words</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{pack.description}</p>
              <button onClick={()=>handleDownloadPack(pack)} disabled={downloadingPackId===pack.id} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-70">
                {downloadingPackId===pack.id ? <Loader2 className="animate-spin w-4 h-4"/> : <Download className="w-4 h-4"/>} Download
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-6 pb-24">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Vocab</h2>
              <div className="flex gap-2">
                <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="p-2 disabled:opacity-30"><ChevronLeft/></button>
                <span className="text-xs self-center font-bold text-slate-400">{page+1}/{Math.max(1, totalPages)}</span>
                <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} className="p-2 disabled:opacity-30"><ChevronRight/></button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search words..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              />
            </div>

            <FilterBar />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {visibleList.length > 0 ? visibleList.map(item => (
              <div key={item.id} className="p-4 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${item.status==='known'?'text-slate-400 line-through':''}`}>{item.word}</span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">{item.category}</span>
                  </div>
                  {item.status==='known' && <CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
                </div>
                <div className="text-sm text-slate-500">{item.definitions[0]?.cn}</div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400 italic">No words found matching filters.</div>
            )}
          </div>
          <button onClick={()=>setView('add')} className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center z-50"><Plus/></button>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="space-y-6 pb-20">
          <h2 className="text-2xl font-bold text-slate-800">Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-600 text-white p-5 rounded-2xl"><Trophy className="mb-2 opacity-50"/><div className="text-xs uppercase">Mastered</div><div className="text-3xl font-bold">{knownVocabCount}</div></div>
            <div className="bg-white p-5 rounded-2xl border"><Flame className="mb-2 text-amber-500"/><div className="text-xs uppercase text-slate-400">Review</div><div className="text-3xl font-bold text-slate-800">{sessionStats.reviewed}</div></div>
          </div>
        </div>
      )}
      
      {view === 'settings' && (
        <div className="space-y-6 pb-24">
           <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
           
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <h3 className="font-bold text-slate-700 flex gap-2"><TrendingUp className="w-5 h-5"/> Daily Goal</h3>
             <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Words per Day: {dailyGoal}</label>
               <input 
                 type="range" min="5" max="100" step="5" 
                 value={dailyGoal} 
                 onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                 className="w-full accent-indigo-600"
               />
               <div className="flex justify-between text-xs text-slate-400 mt-1"><span>5</span><span>50</span><span>100</span></div>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <h3 className="font-bold text-slate-700 flex gap-2"><Cloud className="w-5 h-5"/> Sync</h3>
             <input type="password" className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Token" value={githubToken} onChange={e=>setGithubToken(e.target.value)} />
             <input type="text" className="w-full p-3 bg-slate-50 rounded-xl text-sm" placeholder="Gist ID" value={gistId} onChange={e=>setGistId(e.target.value)} />
             <div className="grid grid-cols-2 gap-3">
               <button onClick={()=>handleSync('upload')} disabled={isSyncing} className="py-3 bg-indigo-600 text-white rounded-xl font-bold">Save Progress</button>
               <button onClick={()=>handleSync('download')} disabled={isSyncing} className="py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">Load Progress</button>
             </div>
             {syncStatus && <div className="text-center text-xs text-slate-500">{syncStatus}</div>}
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <button onClick={resetData} className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-bold">Reset All</button>
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