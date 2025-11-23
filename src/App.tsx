import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, Check, X, CheckCircle2, 
  Settings, Trophy, Flame, TrendingUp, Plus, ArrowLeft, Cloud, Download, Upload, Loader2, Library, Volume2
} from 'lucide-react';

// 1. Import your split components
import Layout from './components/Layout';
import Flashcard from './components/Flashcard';

// 2. Import your types
import type { Word, WordPack } from './types';

// 3. Import the algorithm & Sync
import { calculateReview, getInitialStats, getNextDueDate } from './utils/srs_algorithm';
import { saveToGist, loadFromGist } from './utils/sync';
import { AVAILABLE_PACKS, fetchWordPack } from './utils/word_bank';

export default function App() {
  // --- STATE ---
  const [vocabList, setVocabList] = useState<Word[]>(() => {
    const saved = localStorage.getItem('lingua-flow-vocab');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync State
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('lingua-flow-token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('lingua-flow-gist-id') || '');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Learning Session State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [view, setView] = useState('learn');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dailyGoal] = useState(20); 
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);

  // Form State
  const [newWord, setNewWord] = useState({ word: '', translation: '', definition: '', example: '', category: 'General' });

  // Persistence
  useEffect(() => {
    localStorage.setItem('lingua-flow-vocab', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('lingua-flow-token', githubToken);
    localStorage.setItem('lingua-flow-gist-id', gistId);
  }, [githubToken, gistId]);

  // --- SMART QUEUE LOGIC ---
  const learningQueue = useMemo(() => {
    const now = Date.now();
    
    const dueReviews = vocabList.filter(w => 
      w.status === 'learning' && w.srs && w.srs.dueDate <= now
    ).sort((a, b) => (a.srs?.dueDate || 0) - (b.srs?.dueDate || 0));

    const remainingNewWords = Math.max(0, dailyGoal - sessionStats.reviewed);
    const newWords = vocabList.filter(w => w.status === 'new').slice(0, remainingNewWords);

    return [...dueReviews, ...newWords];
  }, [vocabList, dailyGoal, sessionStats.reviewed]);

  const currentCard = learningQueue[currentCardIndex];
  const knownVocabCount = vocabList.filter(v => v.status === 'known').length;

  // --- HANDLERS ---

  const handleDownloadPack = async (pack: WordPack) => {
    setDownloadingPackId(pack.id);
    try {
      const newWords = await fetchWordPack(pack.id);
      const uniqueNewWords = newWords.filter(nw => !vocabList.some(existing => existing.word === nw.word));
      setVocabList(prev => [...prev, ...uniqueNewWords]);
      alert(`Successfully added ${uniqueNewWords.length} words from ${pack.name}!`);
      setView('list');
    } catch (e) {
      alert("Failed to download pack.");
    } finally {
      setDownloadingPackId(null);
    }
  };

  const markAsKnown = () => {
    if (!currentCard) return;
    updateWordStatus(currentCard.id, 'known');
    setSessionStats(prev => ({ ...prev, mastered: prev.mastered + 1 }));
  };

  const updateWordStatus = (id: string | number, status: 'known' | 'learning' | 'new', srs?: any) => {
    setVocabList(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, status, srs: srs || w.srs };
      }
      return w;
    }));
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

    updateWordStatus(currentCard.id, 'learning', { ...newStats, dueDate: nextDueDate });
    setSessionStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));

    if (currentCardIndex >= learningQueue.length - 1) {
        setCurrentCardIndex(0); 
    }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word) return;
    const wordEntry: Word = {
      id: Date.now(),
      word: newWord.word,
      phonetic: "",
      category: newWord.category,
      status: 'new',
      definitions: [{ pos: 'n.', en: newWord.definition, cn: newWord.translation }],
      examples: [{ en: newWord.example, cn: '' }],
      note: "",
      srs: getInitialStats()
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
      if (res.success && res.gistId) { setGistId(res.gistId); setSyncStatus('Saved!'); }
      else setSyncStatus('Failed.');
    } else {
      const res = await loadFromGist(githubToken, gistId);
      if (res.success && res.data) { setVocabList(res.data); setSyncStatus('Loaded!'); }
      else setSyncStatus('Failed.');
    }
    setIsSyncing(false);
  };

  const resetData = () => {
    if (confirm("Reset all data?")) {
      setVocabList([]);
      localStorage.removeItem('lingua-flow-vocab');
      window.location.reload();
    }
  };

  // --- RENDER ---
  return (
    <Layout currentView={view} onNavigate={setView}>
      
      {view === 'learn' && (
        <>
          {learningQueue.length > 0 ? (
            <>
              <div className="flex justify-between items-end mb-3 px-1">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Today</span>
                  <div className="text-2xl font-bold text-slate-700 leading-none">
                    {learningQueue.length} <span className="text-base text-slate-400 font-normal">words</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                     {sessionStats.reviewed} Reviewed
                   </div>
                </div>
              </div>
              
              <Flashcard 
                word={currentCard} 
                onMarkKnown={markAsKnown}
                onUpdateNote={updateNote}
              />

              <div className="mt-6 grid grid-cols-3 gap-4">
                <button onClick={() => handleReview('forgot')} className="flex flex-col items-center justify-center py-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 active:scale-95 transition-all border border-rose-100">
                  <X className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Forgot</span>
                </button>
                <button onClick={() => handleReview('hard')} className="flex flex-col items-center justify-center py-4 bg-amber-50 text-amber-500 rounded-2xl hover:bg-amber-100 active:scale-95 transition-all border border-amber-100">
                  <RefreshCw className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Hard</span>
                </button>
                <button onClick={() => handleReview('easy')} className="flex flex-col items-center justify-center py-4 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-100">
                  <Check className="w-6 h-6 mb-1" /><span className="text-xs font-bold">Easy</span>
                </button>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <CheckCircle2 className="w-12 h-12 text-indigo-500" />
               </div>
               <h2 className="text-2xl font-extrabold text-slate-800 mb-2">All Caught Up!</h2>
               <p className="text-slate-500 max-w-[200px] leading-relaxed mb-8">Your queue is empty. Great job!</p>
               
               <button onClick={() => setView('library')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-95">
                  <Library className="w-5 h-5" />
                  Get More Words
               </button>
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
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{pack.name}</h3>
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{pack.level}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">{pack.totalWords} words</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{pack.description}</p>
                
                <button 
                  onClick={() => handleDownloadPack(pack)}
                  disabled={downloadingPackId === pack.id}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 transition-all active:scale-95"
                >
                  {downloadingPackId === pack.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Add to My List</>
                  )}
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
            {vocabList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No words yet. Go to Library to add some!</div>
            ) : (
              vocabList.map((item) => (
                <div key={item.id} className={`p-5 border-b border-slate-100 last:border-0 flex justify-between items-start hover:bg-slate-50 transition-colors ${item.status === 'known' ? 'bg-slate-50/50' : ''}`}>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-lg ${item.status === 'known' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{item.word}</span>
                      {item.status === 'known' && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> KNOWN
                        </span>
                      )}
                      {item.status === 'new' && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {item.definitions.map((d, i) => (
                        <div key={i} className="text-sm text-slate-600 leading-snug">
                          <span className="inline-block text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mr-2 align-middle uppercase tracking-wide">{d.pos}</span>{d.cn}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { const u = new SpeechSynthesisUtterance(item.word); window.speechSynthesis.speak(u); }} className="text-indigo-300 hover:text-indigo-600 p-3 hover:bg-indigo-50 rounded-xl transition-all">
                    <Volume2 className="w-5 h-5" />
                  </button>
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
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-[1.5rem] shadow-lg shadow-indigo-200 relative overflow-hidden">
              <Trophy className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-400 opacity-20" />
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Mastered</div>
              <div className="text-4xl font-extrabold">{knownVocabCount}</div>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-400 opacity-10" />
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Reviewed Today</div>
              <div className="text-4xl font-extrabold text-slate-800">{sessionStats.reviewed}</div>
            </div>
          </div>
          
          {/* Weekly Chart using TrendingUp */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Weekly Activity
            </h3>
            <div className="flex justify-between items-end h-32">
              {[40, 65, 30, 80, 20, 90, sessionStats.reviewed * 5].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex justify-center items-end h-full">
                     <div style={{ height: `${Math.min(h, 100)}%` }} className={`w-2.5 rounded-full ${i === 6 ? 'bg-indigo-500' : 'bg-slate-100'}`}></div>
                  </div>
                </div>
              ))}
            </div>
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
              
              {/* Editable Gist ID for multi-device sync */}
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-mono text-slate-600"
                placeholder="Paste Gist ID here to sync..."
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
              />
              
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