
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { saveBudget } from '../../services/storageService';
import { Budget } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  budgetToEdit?: Budget | null; // Added support for editing
}

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Housing', 'Education', 'Personal Care', 'Other'];

export const SetBudgetModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, budgetToEdit }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (budgetToEdit) {
            // Pre-fill
            if (CATEGORIES.includes(budgetToEdit.category)) {
                setCategory(budgetToEdit.category);
                setIsCustom(false);
            } else {
                setCategory('');
                setCustomCategory(budgetToEdit.category);
                setIsCustom(true);
            }
            setAmount(budgetToEdit.limit.toString());
        } else {
            // Reset
            setCategory(CATEGORIES[0]);
            setCustomCategory('');
            setAmount('');
            setIsCustom(false);
        }
    }
  }, [isOpen, budgetToEdit]);

  const handleSubmit = async () => {
    const finalCategory = isCustom ? customCategory : category;
    const limit = parseFloat(amount.replace(/[^0-9]/g, '')); // Simple clean
    
    if (!finalCategory || !limit) return;

    await saveBudget({
      id: budgetToEdit?.id, // Pass ID to update instead of create
      category: finalCategory,
      limit: limit,
      spent: budgetToEdit ? budgetToEdit.spent : 0, 
      period: 'monthly'
    });
    
    if (onSuccess) onSuccess();
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
                <h3 className="text-xl font-bold text-white">
                  {budgetToEdit ? 'Edit Budget' : 'Set Budget'}
                </h3>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                         {CATEGORIES.map(c => (
                             <button
                                key={c}
                                onClick={() => { setCategory(c); setIsCustom(false); }}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!isCustom && category === c ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'}`}
                             >
                                 {c}
                             </button>
                         ))}
                         <button
                            onClick={() => setIsCustom(true)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isCustom ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'}`}
                         >
                             + Custom
                         </button>
                    </div>
                    {isCustom && (
                        <input
                            type="text"
                            placeholder="Enter category name"
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                        />
                    )}
                </div>

                {/* Amount Input */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Monthly Limit (IDR)</label>
                    <input
                        type="number"
                        placeholder="e.g. 5000000"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl p-4 text-xl font-bold text-white focus:border-primary focus:outline-none placeholder-slate-600"
                    />
                </div>

                {/* Info */}
                <div className="flex gap-2 p-3 bg-blue-500/10 rounded-xl text-blue-300 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <p>This budget will repeat every month. We'll alert you if you get close to the limit.</p>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={!amount || (isCustom && !customCategory)}
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {budgetToEdit ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
