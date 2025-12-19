
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Trash2, Tag, LayoutGrid } from 'lucide-react';
import { UserProfile } from '../types';
import { getCategories, addCategory, deleteCategory } from '../services/storageService';
import { useToast } from '../context/ToastContext';

interface SettingsProps {
  user: UserProfile;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('');
  const { showToast } = useToast();

  const categories = useLiveQuery(() => getCategories(activeTab), [activeTab]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
        await addCategory(newCategory.trim(), activeTab);
        setNewCategory('');
        showToast('Category added successfully');
    } catch (e) {
        showToast('Failed to add category', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this category?')) {
        try {
            await deleteCategory(id);
            showToast('Category deleted');
        } catch (e) {
            showToast('Failed to delete', 'error');
        }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-5 pb-10 flex flex-col h-full"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Category Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surface border border-white/5 rounded-xl mb-6">
         <button 
           onClick={() => setActiveTab('expense')}
           className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'expense' ? 'bg-red-500/10 text-red-400' : 'text-slate-400'}`}
         >
           Expenses
         </button>
         <button 
           onClick={() => setActiveTab('income')}
           className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}
         >
           Income
         </button>
      </div>

      {/* Add New Input */}
      <div className="flex gap-2 mb-6">
         <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
               type="text" 
               value={newCategory}
               onChange={(e) => setNewCategory(e.target.value)}
               placeholder={`New ${activeTab} category...`}
               onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
               className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
            />
         </div>
         <button 
           onClick={handleAddCategory}
           disabled={!newCategory}
           className="w-12 h-12 flex items-center justify-center bg-primary rounded-xl text-white shadow-lg shadow-primary/20 disabled:opacity-50"
         >
            <Plus size={20} />
         </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
         <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Existing Categories</h3>
         <AnimatePresence>
            {categories?.map((cat) => (
                <motion.div
                   key={cat.id}
                   layout
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="flex justify-between items-center p-4 bg-surface rounded-xl border border-white/5 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                            <LayoutGrid size={16} />
                        </div>
                        <span className="font-medium text-slate-200">{cat.name}</span>
                        {cat.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">Default</span>}
                    </div>
                    
                    {!cat.isDefault && (
                        <button 
                          onClick={() => cat.id && handleDelete(cat.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </motion.div>
            ))}
         </AnimatePresence>
         {categories?.length === 0 && (
             <div className="text-center py-10 text-slate-500 text-sm">
                 No categories found.
             </div>
         )}
      </div>
    </motion.div>
  );
};

export default Settings;
