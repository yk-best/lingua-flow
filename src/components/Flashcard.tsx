import React, { useState, useEffect } from 'react';
import { Volume2, ChevronRight, CheckCircle2, X, Edit3, Plus } from 'lucide-react';
import type { Word } from '../types';

interface FlashcardProps {
  word: Word;
  onMarkKnown: () => void;
  onUpdateNote: (id: number | string, note: string) => void;
  onUpdateExample?: (id: number | string, example: string) => void;
}

export default function Flashcard({ word, onMarkKnown, onUpdateNote, onUpdateExample }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [manualExample, setManualExample] = useState('');
  const [isAddingExample, setIsAddingExample] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setIsAddingExample(false);
    setManualExample('');
  }, [word.id]);

  const speakText = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const saveManualExample = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualExample.trim() && onUpdateExample) {
      onUpdateExample(word.id, manualExample);
      setIsAddingExample(false);
      setManualExample('');
    }
  };

  // Helper to safely get examples
  const hasExamples = word.examples && Array.isArray(word.examples) && word.examples.length > 0;

  return (
    <div 
      className="flex-1 relative [perspective:1000px] cursor-pointer group min-h-[460px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* --- FRONT SIDE --- */}
        <div className={`absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-xl shadow-indigo-200/40 p-8 flex flex-col items-center justify-center border border-white [backface-visibility:hidden] ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          <div className="absolute top-6 w-full px-8 flex justify-between items-center">
            <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full">
              {word.category}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onMarkKnown(); }}
              className="group/btn flex items-center gap-2 p-2 pr-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full transition-all border border-slate-100 hover:border-emerald-200"
              title="Mark Known"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-bold max-w-0 overflow-hidden group-hover/btn:max-w-[100px] transition-all duration-300 whitespace-nowrap">
                Mark Known
              </span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-4">
            <h2 className="text-5xl font-bold text-slate-800 mb-4 text-center tracking-tight">{word.word}</h2>
            <p className="text-slate-400 font-mono mb-10 text-xl">{word.phonetic}</p>
            
            <button 
              onClick={(e) => speakText(word.word, e)}
              className="p-5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-indigo-200"
            >
              <Volume2 className="w-8 h-8" />
            </button>
          </div>

          <div className="mt-auto text-sm text-slate-400 flex items-center gap-2 font-medium animate-pulse">
            Tap card to flip <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* --- BACK SIDE --- */}
        <div 
          className={`absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-xl shadow-indigo-200/40 p-6 flex flex-col border border-white [backface-visibility:hidden] [transform:rotateY(180deg)] ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-indigo-600 leading-none">{word.word}</h3>
              <span className="text-sm text-slate-400 font-mono mt-1">{word.phonetic}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => speakText(word.word, e)} className="text-indigo-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
              <button onClick={() => setIsFlipped(false)} className="text-slate-300 hover:text-slate-500 p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scroll">
            {/* Definitions */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Definitions</h4>
              {word.definitions.map((def, i) => (
                <div key={i} className="mb-4 last:mb-0 group">
                  <div className="flex gap-3 mb-1">
                    <span className="text-xs font-bold text-white bg-indigo-500 px-2 py-1 rounded-md h-fit mt-0.5 shadow-sm shadow-indigo-200">{def.pos}</span>
                    <span className="text-slate-800 font-bold text-lg leading-snug">{def.cn}</span>
                  </div>
                  <p className="text-sm text-slate-500 ml-10 leading-relaxed border-l-2 border-slate-100 pl-3">{def.en}</p>
                </div>
              ))}
            </div>

            {/* Examples */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Examples ({word.examples ? word.examples.length : 0})
                </h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsAddingExample(!isAddingExample); }}
                  className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {isAddingExample && (
                <div className="mb-4" onClick={e => e.stopPropagation()}>
                  <input 
                    autoFocus
                    className="w-full p-2 border border-indigo-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Type your own example..."
                    value={manualExample}
                    onChange={e => setManualExample(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveManualExample(e)}
                  />
                  <button onClick={saveManualExample} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">Save Example</button>
                </div>
              )}

              <div className="space-y-3">
                {hasExamples ? (
                  word.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <p className="text-slate-700 text-[15px] italic font-medium leading-relaxed">"{ex.en}"</p>
                        <button onClick={(e) => speakText(ex.en, e)} className="shrink-0 mt-0.5 text-slate-300 hover:text-indigo-500">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Only show translation if it exists and is not empty string */}
                      {ex.cn && ex.cn.trim() !== "" && <p className="text-xs text-slate-500 font-medium">{ex.cn}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-400 italic text-center">
                    No examples available.
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                <Edit3 className="w-3 h-3" /> My Notes
              </h4>
              <textarea 
                className="w-full p-4 text-sm text-slate-600 bg-amber-50/50 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none resize-none transition-all placeholder:text-amber-200/70"
                rows={3}
                placeholder="Write your memory hooks here..."
                value={word.note}
                onChange={(e) => onUpdateNote(word.id, e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}