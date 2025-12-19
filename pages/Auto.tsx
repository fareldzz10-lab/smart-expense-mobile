
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowUpCircle, ArrowDownCircle, RefreshCcw, Trash2, Calendar } from 'lucide-react';
import { db, deleteRecurring } from '../services/storageService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AddRecurringModal } from '../components/mobile/AddRecurringModal';
import { RecurringTransaction, UserProfile } from '../types';

interface AutoProps {
  user: UserProfile;
}

const Auto: React.FC<AutoProps> = ({ user }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('income');

  const recurringItems = useLiveQuery(() => 
    db.recurring.where('userId').equals(user.email).toArray()
  );

  const incomes = recurringItems?.filter(i => i.type === 'income') || [];
  const expenses = recurringItems?.filter(i => i.type === 'expense') || [];

  const handleOpenModal = (type: 'income' | 'expense') => {
    setAddType(type);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this automation rule?')) {
      await deleteRecurring(id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-5 pb-24 min-h-full flex flex-col"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCcw className="text-primary" />
          Automation
        </h1>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
          Manage your fixed income and expenses. Rules automatically generate transactions when due.
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        <button 
          onClick={() => handleOpenModal('income')}
          className="flex-1 h-12 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all active:scale-95"
        >
          <ArrowUpCircle size={18} />
          Add Income
        </button>
        <button 
          onClick={() => handleOpenModal('expense')}
          className="flex-1 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all active:scale-95"
        >
          <ArrowDownCircle size={18} />
          Add Expense
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
          <ArrowUpCircle size={16} />
          Recurring Income
        </h3>
        <div className="bg-surface/30 rounded-2xl border border-white/5 min-h-[100px] p-1">
          {incomes.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-slate-500 text-sm">
              No recurring income set.
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {incomes.map(item => (
                  <RecurringItem key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-red-400 font-medium mb-3 flex items-center gap-2">
          <ArrowDownCircle size={16} />
          Recurring Expenses
        </h3>
        <div className="bg-surface/30 rounded-2xl border border-white/5 min-h-[100px] p-1">
           {expenses.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-slate-500 text-sm">
              No recurring expenses set.
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {expenses.map(item => (
                  <RecurringItem key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AddRecurringModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialType={addType} 
      />
    </motion.div>
  );
};

const RecurringItem: React.FC<{ item: RecurringTransaction, onDelete: (id: number) => void }> = ({ item, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, height: 0 }}
    className="p-3 hover:bg-white/5 rounded-xl flex items-center justify-between group transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-white/5 text-slate-300 font-bold text-lg">
        {item.title.charAt(0)}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200">{item.title}</h4>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
           <span className="capitalize">{item.frequency}</span>
           <span>•</span>
           <span className="flex items-center gap-1">
             <Calendar size={10} /> {formatDate(item.nextDueDate)}
           </span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
        {formatCurrency(item.amount)}
      </span>
      <button 
        onClick={() => item.id !== undefined && onDelete(item.id)}
        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </motion.div>
);

export default Auto;
