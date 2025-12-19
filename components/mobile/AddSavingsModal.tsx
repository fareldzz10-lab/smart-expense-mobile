
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, PiggyBank, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addSavingsGoal } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const AddSavingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = async () => {
    if (!name || !targetAmount) return;

    await addSavingsGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      color: selectedColor,
      icon: 'PiggyBank'
    });

    // Confetti Effect
    const end = Date.now() + 1000;
    const colors = [selectedColor, '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Reset
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
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
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-surface rounded-t-[32px] border-t border-white/10 max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target size={24} className="text-primary" />
                  New Savings Goal
                </h3>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                  <X size={20} className="text-slate-400" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1 pb-10">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium ml-1">Goal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. New Laptop"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-2xl p-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                {/* Target Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium ml-1">Target Amount (IDR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000000"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-2xl p-4 text-lg font-bold text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder-slate-600"
                  />
                </div>

                {/* Current Saved */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium ml-1">Already Saved (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000000"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-2xl p-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium ml-1">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-2xl p-4 text-white focus:border-primary focus:outline-none [color-scheme:dark] transition-all"
                  />
                </div>

                {/* Color Tag & Submit Action */}
                <div className="pt-4 flex items-end justify-between gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-slate-400 mb-3 block font-medium ml-1">Color Tag</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-10 h-10 rounded-full transition-all ${selectedColor === color ? 'scale-110 ring-2 ring-white shadow-lg shadow-white/20' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <button 
                      onClick={handleSubmit}
                      disabled={!name || !targetAmount}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none hover:shadow-primary/50 shrink-0"
                    >
                      <Plus size={32} strokeWidth={3} />
                    </button>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
