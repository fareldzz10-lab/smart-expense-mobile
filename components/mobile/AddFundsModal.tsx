
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PiggyBank, ArrowRight, Coins } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { addTransaction } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onConfirm: (amount: number) => void;
}

export const AddFundsModal: React.FC<Props> = ({ isOpen, onClose, goal, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [recordExpense, setRecordExpense] = useState(true);

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    // Optional: Create a transaction record so the wallet balance decreases
    if (recordExpense && goal) {
      await addTransaction({
        title: `Savings: ${goal.name}`,
        amount: value,
        type: 'expense',
        category: 'Savings',
        date: new Date(),
        savingsGoalId: goal.id, // This links it to the goal logic in storageService
        notes: 'Auto-added via Add Funds'
      });
      // Note: addTransaction already updates the savings goal amount if savingsGoalId is present
      // So we might not need to call onConfirm if onConfirm just calls updateSavingsGoal
      // BUT, the parent implementation of onConfirm currently updates the goal manually.
      // To avoid double counting, we should rely on addTransaction's internal logic OR the parent.
      // Given the architecture, let's rely on addTransaction to handle the balance update 
      // AND skip the parent's manual update if we recorded an expense.
    } else {
        // Just update the number without transaction
        onConfirm(value); 
    }

    setAmount('');
    onClose();
  };

  if (!goal) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed top-1/2 left-4 right-4 -translate-y-1/2 z-[70] bg-surface rounded-3xl border border-white/10 shadow-2xl p-6 max-w-sm mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                   <div 
                     className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                     style={{ backgroundColor: goal.color }}
                   >
                      <PiggyBank size={20} />
                   </div>
                   <div>
                       <h3 className="font-bold text-white text-lg leading-tight">{goal.name}</h3>
                       <p className="text-xs text-slate-400">Current: {formatCurrency(goal.currentAmount)}</p>
                   </div>
               </div>
               <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400">
                 <X size={20} />
               </button>
            </div>

            <div className="space-y-4">
                <div>
                   <label className="text-xs text-slate-400 font-medium ml-1 mb-2 block">Amount to Add</label>
                   <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                       <input 
                         type="number" 
                         autoFocus
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         placeholder="0"
                         className="w-full bg-background border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:border-primary focus:outline-none placeholder-slate-600"
                       />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[50000, 100000, 500000].map(val => (
                        <button 
                          key={val}
                          onClick={() => setAmount(val.toString())}
                          className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/5 transition-colors"
                        >
                            +{val / 1000}k
                        </button>
                    ))}
                </div>

                {/* Option to record as expense */}
                <div 
                    onClick={() => setRecordExpense(!recordExpense)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${recordExpense ? 'bg-primary border-primary' : 'border-slate-500'}`}>
                        {recordExpense && <X size={14} className="text-white rotate-45" style={{transform: 'rotate(0deg)'}} />} 
                        {/* Using X as Checkmark substitute or implicit check */}
                        {recordExpense && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white font-medium">Record as Expense</p>
                        <p className="text-[10px] text-slate-400">Deduct from main wallet balance</p>
                    </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={!amount}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                  <Coins size={20} />
                  Add Funds
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
