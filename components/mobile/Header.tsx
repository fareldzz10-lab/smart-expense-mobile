
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LogOut, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserProfile } from '../../types';
import { db, getMonthlyStats } from '../../services/storageService';

interface HeaderProps {
  user: UserProfile;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch stats for the progress ring (Income vs Expense)
  const stats = useLiveQuery(getMonthlyStats, [], { income: 1, expense: 0 });
  
  // Calculate percentage of income spent
  const percentageSpent = stats && stats.income > 0 
    ? Math.min(100, (stats.expense / stats.income) * 100) 
    : 0;

  // Determine ring color based on spending health
  const getRingColor = (percent: number) => {
    if (percent > 85) return '#ef4444'; // Red (Danger)
    if (percent > 50) return '#f59e0b'; // Amber (Warning)
    return '#10b981'; // Emerald (Safe)
  };

  const ringColor = getRingColor(percentageSpent);
  
  // SVG Math for the ring
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageSpent / 100) * circumference;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('smart_expense_user');
      window.location.reload();
    }
    setIsMenuOpen(false);
  };

  const handleResetData = async () => {
    if (confirm('WARNING: This will delete ALL transactions and local data. This action cannot be undone.\n\nAre you sure?')) {
      try {
        await (db as any).delete();
        localStorage.clear(); // Clear user session too
        window.location.reload();
      } catch (err) {
        alert('Failed to reset data.');
        console.error(err);
      }
    }
    setIsMenuOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between relative">
      <div className="flex items-center gap-3">
        {/* Interactive Avatar with Progress Ring */}
        <button 
          onClick={() => onNavigate && onNavigate('/profile')}
          className="relative group w-12 h-12 flex items-center justify-center"
        >
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 50 50">
              {/* Background Ring */}
              <circle
                cx="25" cy="25" r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/10"
              />
              {/* Progress Ring */}
              <circle
                cx="25" cy="25" r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Avatar Image */}
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-background relative z-10 transition-transform group-active:scale-95">
                <img 
                    src={user.avatarUrl} 
                    alt="Avatar" 
                    onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;
                    }}
                    className="w-full h-full object-cover"
                />
            </div>
            
            {/* Status Indicator Dot (Optional: Show if near limit) */}
            {percentageSpent > 90 && (
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-red-500 border-2 border-background rounded-full z-20 animate-pulse" />
            )}
        </button>

        <div>
           {/* We can hide the text on very small screens if needed, or keep it simple */}
        </div>
      </div>
      
      <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 absolute left-1/2 -translate-x-1/2">
        Smart Expense
      </h1>

      <div className="relative" ref={menuRef}>
        <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 -mr-2 text-slate-400 hover:text-white transition-colors rounded-full ${isMenuOpen ? 'bg-white/5 text-white' : ''}`}
        >
            <MoreVertical size={24} />
        </button>

        <AnimatePresence>
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
                >
                    <div className="p-1.5 space-y-0.5">
                        <button 
                            onClick={handleRefresh}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                        >
                            <RefreshCw size={16} />
                            Refresh App
                        </button>
                        
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        
                        <button 
                            onClick={handleResetData}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                            <Trash2 size={16} />
                            Reset Data
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </header>
  );
};
