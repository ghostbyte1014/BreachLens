import React from 'react';
import { ShieldCheck, HardDrive, Lock } from 'lucide-react';

interface NavbarProps {
  dbStatus: 'ready' | 'initializing' | 'error';
  onGoToDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ dbStatus, onGoToDashboard }) => {
  return (
    <header className="sticky top-0 z-50 py-4 px-4 sm:px-8 bg-paper/95 backdrop-blur-md border-b border-line flex items-center justify-between transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          title="Go to BreachLens Dashboard"
        >
          <div className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center relative bg-paper group-hover:border-accent group-hover:scale-105 transition-all shadow-xs">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
              BreachLens
            </span>
            <span className="text-[11px] font-mono text-ink-faint hidden sm:inline-block">
              Personal Data Exposure &amp; Privacy Shield
            </span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-2.5 ml-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-xs px-3 py-1 rounded-full border border-line bg-paper-card text-ink-soft">
            <Lock className="w-3.5 h-3.5 text-resolve" /> No account required
          </span>
          <span className="inline-flex items-center gap-1.5 font-sans text-xs px-3 py-1 rounded-full border border-line bg-paper-card text-ink-soft">
            <HardDrive className="w-3.5 h-3.5 text-ink-soft" /> Private to your device
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-full border ${
          dbStatus === 'ready'
            ? 'border-resolve/30 bg-resolve-tint/60 text-resolve font-medium'
            : dbStatus === 'error'
            ? 'border-accent/30 bg-accent-tint/60 text-accent-dark font-medium'
            : 'border-line text-ink-faint'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            dbStatus === 'ready' ? 'bg-resolve' : dbStatus === 'error' ? 'bg-accent' : 'bg-ink-faint animate-pulse'
          }`} />
          {dbStatus === 'ready' ? 'Private Storage Active' : dbStatus === 'error' ? 'Storage Error' : 'Setting up...'}
        </span>
      </div>
    </header>
  );
};
