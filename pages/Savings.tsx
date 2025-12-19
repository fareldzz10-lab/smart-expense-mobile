
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, PiggyBank, Target, Calendar, Trash2, Check, Coins } from 'lucide-react';
import { db, updateSavingsGoal, deleteSavingsGoal } from '../services/storageService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AddSavingsModal } from '../components/mobile/AddSavingsModal';
import { AddFundsModal } from '../components/mobile/AddFundsModal';
import { SavingsGoal, UserProfile } from '../types';

interface SavingsProps {
  user: UserProfile;
}

const Savings: React.FC<SavingsProps> = ({ user }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const goals = useLiveQuery(() => 
    db.savings.where('userId').equals(user.email).toArray()
  );

  const totalSaved = goals?.reduce((acc, g) => acc + g.currentAmount, 0) || 0;

  const handleOpenFundModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setFundModalOpen(true);
  };

  const handleConfirmFunds = async (amount: number) => {
    // Logic moved inside AddFundsModal to handle Transaction creation
    // If we wanted to handle simple updates here:
    if (selectedGoal && selectedGoal.id !== undefined) {
         await updateSavingsGoal({ 
            ...selectedGoal, 
            currentAmount: selectedGoal.currentAmount + amount 
        });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this savings goal?')) {
        await deleteSavingsGoal(id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-5 pb-24 min-h-full flex flex-col"
    >
       <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Savings Goals
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track your progress towards financial targets.
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-5 shadow-lg mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Total Saved</p>
            <h2 className="text-3xl font-bold">{formatCurrency(totalSaved)}</h2>
        </div>
        <PiggyBank className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
      </div>

      <div className="flex-1">
        {(!goals || goals.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12">
                <button 
                  onClick={() => setModalOpen(true)}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors group bg-surface/20"
                >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">Create New Goal</span>
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <AnimatePresence>
                    {goals.map((goal) => {
                        const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                        const isCompleted = goal.currentAmount >= goal.targetAmount;
                        
                        return (
                            <motion.div
                                key={goal.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-surface rounded-2xl p-5 border border-white/5 relative overflow-hidden group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div 
                                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                                          style={{ backgroundColor: goal.color }}
                                        >
                                          {goal.icon === 'PiggyBank' ? <PiggyBank size={20} /> : <Target size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                                            {goal.deadline && (
                                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} /> {formatDate(goal.deadline)}
                                              </p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => goal.id && handleDelete(goal.id)}
                                        className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">{formatCurrency(goal.currentAmount)}</span>
                                    <span className="font-medium text-slate-200">{formatCurrency(goal.targetAmount)}</span>
                                  </div>
                                  <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-white/5">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${progress}%` }}
                                       transition={{ duration: 1 }}
                                       className="h-full rounded-full relative"
                                       style={{ backgroundColor: goal.color }}
                                     >
                                       <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                     </motion.div>
                                  </div>
                                </div>

                                {!isCompleted && (
                                  <button 
                                    onClick={() => handleOpenFundModal(goal)}
                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors border border-white/5 flex items-center justify-center gap-2 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"
                                  >
                                    <Coins size={14} /> Add Funds
                                  </button>
                                )}
                                
                                {isCompleted && (
                                  <div className="mt-2 py-2 bg-emerald-500/20 rounded-lg flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold border border-emerald-500/20">
                                    <Check size={16} /> Goal Reached!
                                  </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        )}
      </div>

      <AddSavingsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />

      <AddFundsModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        goal={selectedGoal}
        onConfirm={handleConfirmFunds}
      />
    </motion.div>
  );
};

export default Savings;
