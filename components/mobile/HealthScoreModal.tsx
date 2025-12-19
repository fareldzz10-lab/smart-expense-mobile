
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, ShieldCheck, Target, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface HealthData {
  score: number;
  savingsRate: number;
  budgetAdherence: number;
  hasSavings: boolean;
  totalSavings: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: HealthData;
}

export const HealthScoreModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const getGrade = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: ShieldCheck };
    if (score >= 60) return { label: 'Healthy', color: 'text-blue-400', bg: 'bg-blue-500', icon: Activity };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500', icon: Target };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500', icon: AlertTriangle };
  };

  const grade = getGrade(data.score);
  const Icon = grade.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-[60] bg-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-w-sm mx-auto"
          >
            {/* Header */}
            <div className="relative h-32 bg-background flex items-center justify-center overflow-hidden shrink-0">
               <div className={`absolute inset-0 opacity-20 ${grade.bg} blur-3xl`} />
               <button 
                 onClick={onClose}
                 className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-20 backdrop-blur-md"
               >
                 <X size={20} />
               </button>
               
               <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                      <Icon className={grade.color} size={24} />
                      <span className={`text-lg font-bold ${grade.color}`}>{grade.label}</span>
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter">
                    {data.score}<span className="text-2xl text-slate-500 font-medium">/100</span>
                  </h2>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface">
                
                {/* 1. Cashflow Health (50%) */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" />
                        Cashflow Stability
                      </h3>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-slate-400">Max 50pts</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-background/50 border border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                         <span className="text-slate-400">Savings Rate</span>
                         <span className={data.savingsRate > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {data.savingsRate.toFixed(1)}%
                         </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${data.savingsRate > 20 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                           style={{ width: `${Math.min(100, data.savingsRate * 3)}%` }} // Visual scaling
                         />
                      </div>
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                         {data.savingsRate > 20 
                           ? "Great job! You are saving more than 20% of your income." 
                           : data.savingsRate > 0 
                             ? "You are saving a bit, but try to aim for 20% to boost your score."
                             : "You are spending more than you earn. Reduce expenses immediately."}
                      </p>
                   </div>
                </div>

                {/* 2. Budget Discipline (30%) */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <Target size={18} className="text-blue-400" />
                        Budget Discipline
                      </h3>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-slate-400">Max 30pts</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-background/50 border border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                         <span className="text-slate-400">Adherence</span>
                         <span className="text-blue-400 font-bold">
                            {(data.budgetAdherence * 100).toFixed(0)}%
                         </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                         {data.budgetAdherence === 1 
                           ? "Perfect! All your budgets are currently within limits." 
                           : "Some budgets have exceeded their limits. Review your spending categories."}
                      </p>
                   </div>
                </div>

                {/* 3. Asset Growth (20%) */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-400" />
                        Asset Growth
                      </h3>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-slate-400">Max 20pts</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-background/50 border border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                         <span className="text-slate-400">Total Savings</span>
                         <span className="text-white font-bold">
                            {formatCurrency(data.totalSavings)}
                         </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                         {data.hasSavings 
                           ? "You have active savings goals. Keep building your safety net!" 
                           : "You haven't set up any Savings Goals or funds yet. Start small!"}
                      </p>
                   </div>
                </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
