
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ArrowUpRight, ArrowDownLeft, Search, 
  Trash2, Check, Inbox,
  List as ListIcon, Calendar as CalendarIcon,
  ArrowUpCircle, ArrowDownCircle, Square, CheckSquare,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { db, deleteTransactions } from '../services/storageService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AddTransactionModal } from '../components/mobile/AddTransactionModal';
import { UserProfile, Transaction } from '../types';

interface HistoryProps {
  user: UserProfile;
}

const History: React.FC<HistoryProps> = ({ user }) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const transactions = useLiveQuery(() => 
    db.transactions.where('userId').equals(user.email).reverse().sortBy('date')
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const matchesDate = txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
      const matchesType = filterType === 'all' || tx.type === filterType;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        tx.title.toLowerCase().includes(searchLower) || 
        tx.category.toLowerCase().includes(searchLower);
      
      return matchesDate && matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchQuery, selectedMonth, selectedYear]);

  const handleItemClick = (tx: Transaction) => {
    if (isSelectMode) {
      if (tx.id) toggleSelection(tx.id);
    } else {
      // Open Edit Modal
      setTransactionToEdit(tx);
      setModalType(tx.type);
      setIsModalOpen(true);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected transactions?`)) {
      await deleteTransactions(selectedIds);
      setSelectedIds([]);
      setIsSelectMode(false);
    }
  };

  const openAddModal = (type: 'income' | 'expense') => {
    setTransactionToEdit(null); // Ensure clean state
    setModalType(type);
    setIsModalOpen(true);
  };

  const changeMonth = (delta: number) => {
      let newMonth = selectedMonth + delta;
      let newYear = selectedYear;
      
      if (newMonth > 11) {
          newMonth = 0;
          newYear++;
      } else if (newMonth < 0) {
          newMonth = 11;
          newYear--;
      }
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
  };

  const renderCalendarView = () => {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
      
      // Create grid array
      const grid = [];
      // Empty cells for days before the 1st
      for(let i=0; i<firstDayOfMonth; i++) grid.push(null);
      // Days
      for(let i=1; i<=daysInMonth; i++) grid.push(i);

      // Group transactions by day
      const txByDay = new Map<number, Transaction[]>();
      filteredTransactions.forEach(tx => {
          const day = new Date(tx.date).getDate();
          if(!txByDay.has(day)) txByDay.set(day, []);
          txByDay.get(day)?.push(tx);
      });

      return (
        <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-2">{d}</div>
            ))}
            {grid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                
                const txs = txByDay.get(day) || [];
                const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                const hasActivity = txs.length > 0;

                return (
                    <div key={day} className="aspect-square bg-surface border border-white/5 rounded-lg flex flex-col items-center justify-start pt-1 relative overflow-hidden">
                        <span className={`text-xs font-medium ${hasActivity ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                        {hasActivity && (
                            <div className="flex flex-col items-center gap-0.5 mt-1 w-full px-0.5">
                                {income > 0 && <div className="h-1 w-full bg-emerald-500 rounded-full" />}
                                {expense > 0 && <div className="h-1 w-full bg-red-500 rounded-full" />}
                            </div>
                        )}
                        {hasActivity && (
                             <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[8px] text-center py-0.5 text-white font-bold backdrop-blur-sm">
                                 {txs.length}
                             </div>
                        )}
                    </div>
                );
            })}
        </div>
      );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-5 pb-24 min-h-full flex flex-col space-y-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Transactions
            </h1>
            <p className="text-slate-400 text-xs mt-1">Manage and view your financial history.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => openAddModal('income')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <ArrowUpCircle size={14} /> Add
            </button>
            <button 
              onClick={() => openAddModal('expense')}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-rose-500/20 active:scale-95"
            >
              <ArrowDownCircle size={14} /> Add
            </button>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-surface/50 border border-white/10 rounded-xl p-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                <ChevronLeft size={20} />
            </button>
            <div className="text-center">
                <h3 className="text-sm font-bold text-white">
                    {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center bg-surface border border-white/10 rounded-lg p-1 shrink-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <ListIcon size={14} /> List
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'calendar' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <CalendarIcon size={14} /> Calendar
          </button>
        </div>

        <div className="flex items-center bg-surface border border-white/10 rounded-lg p-1 shrink-0">
           {['all', 'income', 'expense'].map((t) => (
             <button
               key={t}
               onClick={() => setFilterType(t as any)}
               className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                 filterType === t 
                   ? 'bg-slate-700 text-white shadow-sm' 
                   : 'text-slate-400 hover:text-white'
               }`}
             >
               {t === 'income' ? 'Inc' : t === 'expense' ? 'Exp' : 'All'}
             </button>
           ))}
        </div>

        {viewMode === 'list' && (
            <button 
            onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds([]);
            }}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 ${
                isSelectMode 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'
            }`}
            >
            {isSelectMode ? <CheckSquare size={16} /> : <Square size={16} />}
            Select
            </button>
        )}
      </div>

      {viewMode === 'list' && (
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            <Search size={16} />
            </div>
            <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search current month..."
            className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            />
        </div>
      )}

      <AnimatePresence>
        {isSelectMode && selectedIds.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl p-3"
          >
            <span className="text-xs font-medium text-red-300">{selectedIds.length} selected</span>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/20"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative min-h-[300px]">
        {filteredTransactions.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 mt-10">
            <div className="w-20 h-20 bg-surface/50 rounded-3xl flex items-center justify-center mb-4 border border-white/5">
              <Inbox size={40} strokeWidth={1} className="opacity-50" />
            </div>
            <h3 className="text-slate-300 font-medium mb-1">No transactions found</h3>
            <p className="text-xs text-slate-500">Try changing the date or filters.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
             <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx, idx) => (
                <motion.div
                  layout
                  key={tx.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleItemClick(tx)}
                  className={`
                    flex items-center justify-between p-4 bg-surface rounded-xl border transition-all group active:scale-[0.99] cursor-pointer
                    ${isSelectMode ? 'hover:border-primary/50' : 'border-white/5 hover:border-white/10'}
                    ${isSelectMode && tx.id && selectedIds.includes(tx.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {isSelectMode && (
                      <div className={`
                         w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                         ${tx.id && selectedIds.includes(tx.id) ? 'bg-primary border-primary' : 'border-slate-600 bg-black/20'}
                      `}>
                          {tx.id && selectedIds.includes(tx.id) && <Check size={12} className="text-white" />}
                      </div>
                    )}
                    
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5
                      ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
                    `}>
                      {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-200 text-sm truncate">{tx.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatDate(tx.date)}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="truncate">{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`font-bold text-sm whitespace-nowrap ml-3 ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
            // Calendar View
            renderCalendarView()
        )}
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialType={modalType}
        transactionToEdit={transactionToEdit}
      />
    </motion.div>
  );
};

export default History;
