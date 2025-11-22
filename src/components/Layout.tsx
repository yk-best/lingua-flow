import React from 'react';
import { Brain, BarChart3, List, BookOpen, Settings, Library } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const NavButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => onNavigate(id)} 
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${currentView === id ? 'text-indigo-600 bg-indigo-50 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-6 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white h-[100dvh] md:h-[850px] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden flex flex-col border-0 md:border border-slate-200/60 relative">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xl tracking-tight">
            <Brain className="w-7 h-7 fill-indigo-600 text-indigo-100" />
            <span>LinguaFlow</span>
          </div>
          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
            K
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 flex flex-col relative overflow-y-auto bg-slate-50/50 scrollbar-hide">
          <div className="flex-1 p-5 flex flex-col">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white px-6 py-3 border-t border-slate-100 flex justify-between items-center pb-6 md:pb-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <NavButton id="learn" icon={BookOpen} label="Learn" />
          <NavButton id="library" icon={Library} label="Library" />
          <NavButton id="list" icon={List} label="Vocab" />
          <NavButton id="dashboard" icon={BarChart3} label="Stats" />
          <NavButton id="settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}