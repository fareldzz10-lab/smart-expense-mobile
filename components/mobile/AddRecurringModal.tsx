
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, DollarSign, Type } from 'lucide-react';
import { addRecurring } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'income' | 'expense';
}

const CATEGORIES = ['Salary', 'Rent', 'Utilities', 'Subscription', 'Insurance', 'Savings', 'Debt', 'Other'];

export const AddRecurringModal: React.FC<Props> = ({ isOpen, onClose, initialType }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async () => {
    if (!title || !amount || !dueDate) return;

    await addRecurring({
      title,
      amount: parseFloat(amount),
      type: initialType,
      category,
      frequency,
      nextDueDate: new Date(dueDate),
      active: true
    });

    // Reset
    setTitle('');
    setAmount('');
    setDueDate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[32px] border-t border-white/10 max-w-md mx-auto"
          >
            <div className="p-6 pb-safe">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarClock className={initialType === 'income' ? 'text-emerald-400' : 'text-red-400'} size={24} />
                  New Recurring {initialType === 'income' ? 'Income' : 'Expense'}
                </h3>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Rent"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Amount (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-500 text-sm">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-primary focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                    <select
                      value={frequency}
                      onChange={e => setFrequency(e.target.value as any)}
                      className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none appearance-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Next Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={!title || !amount || !dueDate}
                  className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 ${initialType === 'income' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}
                >
                  Save Automation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
