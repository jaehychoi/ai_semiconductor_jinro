import React from 'react';
import { Home, ArrowLeft, Lock, Briefcase } from 'lucide-react';

interface LayoutProps {
  title: string;
  color: 'blue' | 'green';
  job?: string;
  onHome: () => void;
  onBack?: () => void;
  onAdmin?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  title, 
  color, 
  job, 
  onHome, 
  onBack, 
  onAdmin, 
  children 
}) => {
  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-green-500';
  const badgeBg = color === 'blue' ? 'bg-blue-100' : 'bg-green-100';
  const badgeText = color === 'blue' ? 'text-blue-700' : 'text-green-700';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className={`bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center justify-between border-b-4 ${borderColor}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onHome} 
            className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
            aria-label="홈으로"
          >
            <Home size={24} />
          </button>
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
              aria-label="뒤로 가기"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-800 hidden md:block">{title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-4 py-1.5 rounded-full ${badgeBg} ${badgeText} font-bold text-sm flex items-center gap-2 shadow-sm`}>
            <Briefcase size={14} />
            <span className="truncate max-w-[120px] md:max-w-xs">
              {job ? `나의 진로: ${job}` : '진로 탐색 중'}
            </span>
          </div>
          {onAdmin && (
            <button 
              onClick={onAdmin} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              title="관리자 모드"
            >
              <Lock size={18} />
            </button>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24">
        {children}
      </main>
    </div>
  );
};