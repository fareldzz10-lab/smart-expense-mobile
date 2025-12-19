
import React from 'react';
import { Home, History, PieChart, Calculator, PiggyBank } from 'lucide-react';
import { TabItem } from '../../types';

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'history', label: 'History', icon: History, path: '/history' },
  { id: 'tools', label: 'Tools', icon: Calculator, path: '/tools' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, path: '/savings' },
  { id: 'budgets', label: 'Budgets', icon: PieChart, path: '/budgets' },
];

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-[calc(28rem-2rem)] mx-auto">
      <nav className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-2 h-16 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
              className={`
                relative flex flex-col items-center justify-center w-full h-full
                transition-all duration-300 group
              `}
            >
                {/* Active Indicator Glow */}
                <div className={`absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

                <div className={`
                    relative z-10 flex flex-col items-center transition-transform duration-300
                    ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}
                `}>
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-300
                    ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'text-slate-400 group-hover:text-slate-200'}
                  `}>
                    <Icon 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                </div>
                
                {/* Active Dot */}
                <span className={`
                    absolute bottom-1.5 w-1 h-1 rounded-full bg-primary transition-all duration-300
                    ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                `} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
