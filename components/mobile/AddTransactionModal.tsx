
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Send, X, Sparkles, Calendar, Tag, Camera, Link as LinkIcon, Image as ImageIcon, Loader2, ScanLine, Plus } from 'lucide-react';
import { parseTransactionInput, parseReceipt } from '../../services/geminiService';
import { addTransaction, updateTransaction, db, getCategories, addCategory } from '../../services/storageService';
import { Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultInput?: string;
  initialType?: 'income' | 'expense';
  transactionToEdit?: Transaction | null; 
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

export const AddTransactionModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  defaultInput = '', 
  initialType = 'expense',
  transactionToEdit = null
}) => {
  // Form State
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [savingsGoalId, setSavingsGoalId] = useState<number | undefined>(undefined);
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  
  // Custom Category State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Data Selectors
  const savingsGoals = useLiveQuery(() => db.savings.toArray());
  const categories = useLiveQuery(() => getCategories(type), [type]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // If not creating custom, and categories loaded, and no category selected yet
    if (!isCreatingCategory && categories && categories.length > 0 && !category) {
        setCategory(categories[0].name);
    }
  }, [categories, isCreatingCategory]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        // Edit Mode: Pre-fill
        setType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString());
        setCategory(transactionToEdit.category);
        setDate(transactionToEdit.date.toISOString().split('T')[0]);
        setDescription(transactionToEdit.title);
        setSavingsGoalId(transactionToEdit.savingsGoalId);
        setAttachment(transactionToEdit.attachment);
        setAiInput(transactionToEdit.notes || '');
      } else if (defaultInput) {
        setAiInput(defaultInput);
      } else {
        resetForm();
        setType(initialType);
      }
    }
  }, [isOpen, defaultInput, initialType, transactionToEdit]);

  const resetForm = () => {
    setType(initialType);
    setAmount('');
    setCategory(''); 
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setSavingsGoalId(undefined);
    setAttachment(undefined);
    setAiInput('');
    setIsScanning(false);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    const result = await parseTransactionInput(aiInput);
    
    if (result) {
      if (result.type) setType(result.type as 'income' | 'expense');
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.date) setDate(result.date.toISOString().split('T')[0]);
      if (result.title) setDescription(result.title);
      showToast('Magic applied! ✨');
    } else {
      showToast('Could not understand that. Try again.', 'error');
    }
    setIsAiLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAttachment(base64String);
        
        // Auto-scan receipt logic
        if (confirm("Do you want AI to scan this receipt for details?")) {
            setIsScanning(true);
            const scanResult = await parseReceipt(base64String);
            
            if (scanResult) {
                if (scanResult.title) setDescription(scanResult.title);
                if (scanResult.amount) setAmount(scanResult.amount.toString());
                if (scanResult.category) setCategory(scanResult.category); 
                if (scanResult.date) setDate(scanResult.date.toISOString().split('T')[0]);
                setType('expense');
                showToast('Receipt scanned successfully! 🧾');
            } else {
                showToast('Failed to read receipt details', 'error');
            }
            setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuickAmount = (val: number) => {
     const current = parseFloat(amount) || 0;
     setAmount((current + val).toString());
  };

  const handleSubmit = async () => {
    if (!amount || !description) return;

    let finalCategory = category;

    // Logic for creating new category on the fly
    if (isCreatingCategory && newCategoryName.trim()) {
        const newCatName = newCategoryName.trim();
        await addCategory(newCatName, type);
        finalCategory = newCatName;
    } else if (!finalCategory) {
        finalCategory = 'Other';
    }

    const txData = {
      title: description,
      amount: parseFloat(amount),
      type,
      category: finalCategory,
      date: new Date(date),
      savingsGoalId,
      attachment,
      notes: aiInput
    };

    try {
        if (transactionToEdit && transactionToEdit.id) {
            await updateTransaction({ ...txData, id: transactionToEdit.id, userId: transactionToEdit.userId });
            showToast('Transaction updated');
        } else {
            await addTransaction(txData);
            showToast('Transaction saved');
        }
        onClose();
    } catch (e) {
        showToast('Failed to save', 'error');
        console.error(e);
    }
  };

  const themeBg = type === 'expense' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[32px] border-t border-white/10 max-w-md mx-auto h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">
                {transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
              </h3>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* AI Assist Text */}
              {!transactionToEdit && (
                <div className="relative group">
                   <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50 group-focus-within:opacity-100 transition-opacity" />
                   <div className="relative flex items-center bg-background border border-white/10 rounded-xl p-1 pr-2">
                      <div className="p-3 text-primary">
                          <Sparkles size={18} />
                      </div>
                      <input 
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
                        placeholder="AI Assist: 'Spent 50k on Coffee'"
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button 
                        onClick={handleAiParse}
                        disabled={isAiLoading || !aiInput}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 disabled:opacity-50 transition-colors"
                      >
                          {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                   </div>
                </div>
              )}

              {/* Receipt / Attachment & Scan */}
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1">Receipt / Attachment</label>
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-24 rounded-xl border border-dashed border-white/20 hover:border-primary/50 bg-background/50 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center overflow-hidden relative group"
                 >
                    <input 
                       ref={fileInputRef}
                       type="file" 
                       accept="image/*" 
                       onChange={handleFileChange}
                       className="hidden" 
                    />
                    
                    {isScanning ? (
                        <div className="flex flex-col items-center gap-2 text-primary animate-pulse">
                            <ScanLine size={24} />
                            <span className="text-xs font-bold">Scanning Receipt...</span>
                        </div>
                    ) : attachment ? (
                        <>
                           <img src={attachment} alt="Receipt" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-black/70 px-3 py-1 rounded-full text-xs text-white">Change Image</span>
                           </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                           <Camera size={20} />
                           <span className="text-xs">Tap to scan receipt (AI)</span>
                        </div>
                    )}
                 </div>
              </div>

              {/* Type & Amount */}
              <div className="space-y-3">
                  <div className="grid grid-cols-[1fr,1.5fr] gap-4">
                    <div className="bg-background rounded-xl p-1 flex border border-white/5 h-[56px]">
                       <button 
                         onClick={() => { setType('expense'); setCategory(''); setIsCreatingCategory(false); }}
                         className={`flex-1 rounded-lg text-sm font-medium transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                         Exp
                       </button>
                       <button 
                         onClick={() => { setType('income'); setCategory(''); setIsCreatingCategory(false); }}
                         className={`flex-1 rounded-lg text-sm font-medium transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                         Inc
                       </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full h-[56px] bg-background border border-white/10 rounded-xl pl-10 pr-4 text-xl font-bold text-white focus:border-primary focus:outline-none placeholder-slate-600"
                      />
                    </div>
                  </div>
                  
                  {/* Quick Chips */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {QUICK_AMOUNTS.map(val => (
                          <button
                            key={val}
                            onClick={() => handleAddQuickAmount(val)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 whitespace-nowrap active:scale-95 transition-all"
                          >
                              +{val / 1000}k
                          </button>
                      ))}
                  </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1">Category</label>
                        <button 
                            onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                            className="text-[10px] text-primary hover:underline"
                        >
                            {isCreatingCategory ? 'Select Existing' : '+ Create New'}
                        </button>
                    </div>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        {isCreatingCategory ? (
                            <input
                                type="text"
                                autoFocus
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Type new category..."
                                className="w-full bg-background border border-primary/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none"
                            />
                        ) : (
                            <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-8 text-sm text-white appearance-none focus:border-primary focus:outline-none"
                            >
                                <option value="" disabled>Select</option>
                                {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        )}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-primary focus:outline-none [color-scheme:dark]" 
                        />
                    </div>
                 </div>
              </div>

              {/* Link to Savings Goal */}
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1">Link to Savings Goal (Optional)</label>
                 <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                      value={savingsGoalId || ''}
                      onChange={(e) => setSavingsGoalId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-background border border-white/10 rounded-xl py-3 pl-10 pr-8 text-sm text-white appearance-none focus:border-primary focus:outline-none"
                    >
                        <option value="">None</option>
                        {savingsGoals?.map(goal => (
                            <option key={goal.id} value={goal.id}>{goal.name}</option>
                        ))}
                    </select>
                 </div>
              </div>

              {/* Description (Title) */}
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase ml-1">Description</label>
                 <textarea
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="What was this transaction for?"
                   className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary h-24 resize-none"
                 />
              </div>

            </div>

            {/* Footer / Submit */}
            <div className="p-6 border-t border-white/5 bg-surface pb-safe">
               <button 
                 onClick={handleSubmit}
                 disabled={!amount || !description || (!category && !newCategoryName)}
                 className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none ${themeBg} ${type === 'income' ? 'shadow-emerald-500/25' : 'shadow-red-500/25'}`}
               >
                 <span className="text-lg">
                   {transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
                 </span>
               </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
