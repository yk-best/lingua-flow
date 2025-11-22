import { useState, useEffect } from 'react';
import { 
  RefreshCw, Check, X, Star, CheckCircle2, 
  Settings, Trophy, Flame, TrendingUp, Plus, ArrowLeft, Save
} from 'lucide-react';

// 1. Import your split components
import Layout from './components/Layout';
import Flashcard from './components/Flashcard';

// 2. Import your types
import type { Word } from './types';

// 3. Import the algorithm
import { calculateReview, getInitialStats, getNextDueDate } from './utils/srs_algorithm';

// --- MOCK DATA ---
const INITIAL_VOCAB: Word[] = [
  {
    id: 1,
    word: "Resilient",
    phonetic: "/rɪˈzɪliənt/",
    category: "Personality",
    status: 'learning',
    definitions: [
      { pos: "adj.", en: "Able to withstand or recover quickly.", cn: "有弹性的；能复原的" }
    ],
    examples: [
      { en: "The local economy is remarkably resilient.", cn: "当地经济具有惊人的恢复力。" }
    ],
    note: ""
  },
  {
    id: 2,
    word: "Ambiguous",
    phonetic: "/æmˈbɪɡjuəs/",
    category: "Academic",
    status: 'learning',
    definitions: [
      { pos: "adj.", en: "Open to more than one interpretation.", cn: "模棱两可的；含糊不清的" }
    ],
    examples: [
      { en: "The instructions were too ambiguous.", cn: "指示太含糊。" }
    ],
    note: ""
  }
];

export default function App() {
  // --- STATE ---
  const [vocabList, setVocabList] = useState<Word[]>(() => {
    const saved = localStorage.getItem('lingua-flow-vocab');
    return saved ? JSON.parse(saved) : INITIAL_VOCAB;
  });

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [view, setView] = useState('learn');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0 });
  const dailyGoal = 20;

  // Form State for adding words
  const [newWord, setNewWord] = useState({ word: '', translation: '', definition: '', example: '', category: 'General' });

  // Persistence
  useEffect(() => {
    localStorage.setItem('lingua-flow-vocab', JSON.stringify(vocabList));
  }, [vocabList]);

  // Computed Stats
  const activeVocab = vocabList.filter(v => v.status !== 'known');
  const knownVocab = vocabList.filter(v => v.status === 'known');
  
  const safeIndex = currentCardIndex >= activeVocab.length ? 0 : currentCardIndex;
  const currentCard = activeVocab[safeIndex];

  // --- HANDLERS ---

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.translation) return;

    const wordEntry: Word = {
      id: Date.now(), // Simple unique ID
      word: newWord.word,
      phonetic: "", // Optional
      category: newWord.category,
      status: 'new',
      definitions: [{ pos: 'n.', en: newWord.definition, cn: newWord.translation }],
      examples: [{ en: newWord.example, cn: '' }],
      note: "",
      srs: getInitialStats() // Start tracking immediately
    };

    setVocabList(prev => [wordEntry, ...prev]); // Add to top of list
    setNewWord({ word: '', translation: '', definition: '', example: '', category: 'General' }); // Reset form
    setView('list'); // Go to list to see it
  };

  const markAsKnown = () => {
    if (!currentCard) return;
    const updatedList = vocabList.map(item => 
      item.id === currentCard.id ? { ...item, status: 'known' as const } : item
    );
    setVocabList(updatedList);
    setSessionStats({ ...sessionStats, mastered: sessionStats.mastered + 1 });
  };

  const updateNote = (id: number | string, newNote: string) => {
    setVocabList(vocabList.map(item => item.id === id ? { ...item, note: newNote } : item));
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

    const updatedWord = {
      ...currentCard,
      srs: { ...newStats, dueDate: nextDueDate }
    };

    setVocabList(prev => prev.map(w => w.id === currentCard.id ? updatedWord : w));
    setSessionStats({ ...sessionStats, reviewed: sessionStats.reviewed + 1 });

    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % activeVocab.length);
    }, 300);
  };

  const resetData = () => {
    if (confirm("Are you sure? This will wipe all progress.")) {
      setVocabList(INITIAL_VOCAB);
      localStorage.removeItem('lingua-flow-vocab');
      window.location.reload();
    }
  };

  return (
    <Layout currentView={view} onNavigate={setView}>
      
      {/* --- ADD WORD VIEW --- */}
      {view === 'add' && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setView('list')} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-indigo-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-extrabold text-slate-800">Add New Word</h2>
          </div>

          <form onSubmit={handleAddWord} className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">English Word</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full p-4 text-lg font-bold text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all"
                  placeholder="e.g. Serendipity"
                  value={newWord.word}
                  onChange={e => setNewWord({...newWord, word: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Chinese Meaning</label>
                <input 
                  type="text" 
                  className="w-full p-4 text-lg text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all"
                  placeholder="e.g. 意外发现珍奇事物的本领"
                  value={newWord.translation}
                  onChange={e => setNewWord({...newWord, translation: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Category</label>
                    <select 
                      className="w-full p-4 text-sm text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0"
                      value={newWord.category}
                      onChange={e => setNewWord({...newWord, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Academic</option>
                      <option>Work</option>
                      <option>Travel</option>
                    </select>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Definition (Optional)</label>
                <textarea 
                  rows={2}
                  className="w-full p-4 text-sm text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all"
                  placeholder="English definition..."
                  value={newWord.definition}
                  onChange={e => setNewWord({...newWord, definition: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Example Sentence (Optional)</label>
                <textarea 
                  rows={2}
                  className="w-full p-4 text-sm text-slate-800 bg-slate-50 rounded-xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all"
                  placeholder="Use the word in a sentence..."
                  value={newWord.example}
                  onChange={e => setNewWord({...newWord, example: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!newWord.word || !newWord.translation}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Word
            </button>
          </form>
        </div>
      )}

      {/* --- LEARN VIEW --- */}
      {view === 'learn' && (
        <>
          {activeVocab.length > 0 && currentCard ? (
            <>
              <div className="flex justify-between items-end mb-3 px-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Goal</span>
                  <span className="text-2xl font-bold text-slate-700 leading-none">{sessionStats.reviewed}<span className="text-slate-300 text-lg">/{dailyGoal}</span></span>
                </div>
                <div className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                  {Math.round((sessionStats.reviewed / dailyGoal) * 100)}% Done
                </div>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min((sessionStats.reviewed / dailyGoal) * 100, 100)}%` }}></div>
              </div>

              <Flashcard 
                word={currentCard} 
                onMarkKnown={markAsKnown}
                onUpdateNote={updateNote}
              />

              <div className="mt-6 grid grid-cols-3 gap-4">
                <button onClick={() => handleReview('forgot')} className="flex flex-col items-center justify-center py-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 hover:-translate-y-1 transition-all duration-200 active:scale-95 border border-rose-100">
                  <X className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold tracking-wide">Forgot</span>
                </button>
                <button onClick={() => handleReview('hard')} className="flex flex-col items-center justify-center py-4 bg-amber-50 text-amber-500 rounded-2xl hover:bg-amber-100 hover:-translate-y-1 transition-all duration-200 active:scale-95 border border-amber-100">
                  <RefreshCw className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold tracking-wide">Hard</span>
                </button>
                <button onClick={() => handleReview('easy')} className="flex flex-col items-center justify-center py-4 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-100 hover:-translate-y-1 transition-all duration-200 active:scale-95 border border-emerald-100">
                  <Check className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold tracking-wide">Easy</span>
                </button>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <Star className="w-12 h-12 text-indigo-500 fill-indigo-500" />
               </div>
               <h2 className="text-2xl font-extrabold text-slate-800 mb-2">You did it!</h2>
               <p className="text-slate-500 max-w-[200px] leading-relaxed">You've reviewed all your active cards for now.</p>
               <button onClick={() => setView('list')} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl active:scale-95">
                  Review List
               </button>
             </div>
          )}
        </>
      )}

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
        <div className="space-y-6 pb-24 relative min-h-full">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-2xl font-extrabold text-slate-800">Vocabulary List</h2>
            <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{vocabList.length} Words</span>
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {vocabList.map((item) => (
              <div key={item.id} className={`p-5 border-b border-slate-100 last:border-0 flex justify-between items-start hover:bg-slate-50 transition-colors ${item.status === 'known' ? 'bg-slate-50/50' : ''}`}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-lg ${item.status === 'known' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                      {item.word}
                    </span>
                    {item.status === 'known' && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> KNOWN
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {item.definitions.map((d, i) => (
                      <div key={i} className="text-sm text-slate-600 leading-snug">
                        <span className="inline-block text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mr-2 align-middle uppercase tracking-wide">{d.pos}</span>
                        {d.cn}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Add Button */}
          <button 
            onClick={() => setView('add')}
            className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <h2 className="text-2xl font-extrabold text-slate-800 px-1 mb-2">Your Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-[1.5rem] shadow-lg shadow-indigo-200 relative overflow-hidden">
              <Trophy className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-400 opacity-20" />
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Mastered</div>
              <div className="text-4xl font-extrabold">{knownVocab.length}</div>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-400 opacity-10" />
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Streak</div>
              <div className="text-4xl font-extrabold text-slate-800">3 <span className="text-lg text-slate-400">days</span></div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Weekly Activity
            </h3>
            <div className="flex justify-between items-end h-32">
              {[40, 65, 30, 80, 20, 90, sessionStats.reviewed * 5].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full flex justify-center items-end h-full relative">
                     <div style={{ height: `${Math.min(h, 100)}%` }} className={`w-2.5 rounded-full transition-all duration-1000 ${i === 6 ? 'bg-indigo-500 shadow-lg shadow-indigo-200' : 'bg-slate-100 group-hover:bg-indigo-200'}`}></div>
                  </div>
                  <span className={`text-[10px] font-bold ${i === 6 ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {['M','T','W','T','F','S','S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-extrabold text-slate-800 px-1 mb-2">Settings</h2>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              App Data
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your learning progress is saved to this browser.
            </p>
            <button onClick={resetData} className="w-full py-4 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors border border-rose-100">
              <X className="w-5 h-5" /> Reset All Progress
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}