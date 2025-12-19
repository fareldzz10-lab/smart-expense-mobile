
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Info, Wallet, Trash2, Edit2 } from 'lucide-react';
import { db, getBudgetsWithStats, deleteBudget } from '../services/storageService';
import { formatCurrency } from '../utils/formatters';
import { SetBudgetModal } from '../components/mobile/SetBudgetModal';
import { UserProfile, Budget } from '../types';

interface BudgetProps {
  user: UserProfile;
}

const Budgets: React.FC<BudgetProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  
  // Use live query with implicit dependency on user specific data
  const budgets = useLiveQuery(async () => {
    return await getBudgetsWithStats();
  }, [db.transactions, db.budgets]); // re-run when DB changes

  const totalBudgeted = budgets?.reduce((acc, b) => acc + b.limit, 0) || 0;
  const totalSpent = budgets?.reduce((acc, b) => acc + b.spent, 0) || 0;
  const remaining = Math.max(0, totalBudgeted - totalSpent);
  
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());
  const dailySafeSpend = remaining / daysRemaining;

  const handleDelete = async (e: React.MouseEvent, id?: number) => {
    e.stopPropagation();
    if (id && confirm('Delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const handleEdit = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setBudgetToEdit(null);
    setIsModalOpen(true);
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
            Monthly Budgets
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Set spending limits to keep your finances on track.
          </p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus size={16} />
          Set Budget
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-5 border border-white/5 shadow-xl mb-6 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100" />
         
         <div className="relative z-10">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Total Budgeted</p>
               <h2 className="text-3xl font-bold text-white">{formatCurrency(totalBudgeted)}</h2>
             </div>
             <div className="text-right">
               <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Remaining</p>
               <p className={`text-xl font-bold ${remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                 {formatCurrency(remaining)}
               </p>
             </div>
           </div>

           <div className="mb-4">
              <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, overallProgress)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${overallProgress > 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-primary'}`}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                <span>Spent: {formatCurrency(totalSpent)}</span>
                <span>{overallProgress.toFixed(1)}% used</span>
              </div>
           </div>

           <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
             <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-blue-200 text-sm font-bold mb-0.5">Daily Safe Spend</h4>
               <p className="text-blue-300/80 text-xs leading-relaxed">
                 You can spend <span className="text-white font-bold">{formatCurrency(dailySafeSpend)}</span> per day for the remaining {daysRemaining} days to stay on budget.
               </p>
             </div>
           </div>
         </div>
      </div>

      <div className="flex-1">
        {(!budgets || budgets.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
             <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-white/5 shadow-inner">
               <Wallet size={32} className="opacity-50" />
             </div>
             <p className="text-sm">No budgets set.</p>
             <p className="text-xs mt-1">Click "Set Budget" to start tracking.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {budgets.map((budget) => {
                const percent = Math.min(100, (budget.spent / budget.limit) * 100);
                const isOver = budget.spent > budget.limit;
                
                return (
                  <motion.div
                    key={budget.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleEdit(budget)}
                    className="bg-surface rounded-xl p-4 border border-white/5 relative group cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOver ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-primary'}`}>
                           <span className="text-lg font-bold">{budget.category.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{budget.category}</h3>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="p-2 text-slate-500">
                            <Edit2 size={16} />
                        </div>
                        <button 
                            onClick={(e) => handleDelete(e, budget.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${percent}%` }}
                         className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-primary'}`}
                       />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <SetBudgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        budgetToEdit={budgetToEdit}
      />
    </motion.div>
  );
};

export default Budgets;
