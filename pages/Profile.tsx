
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, LogOut, Moon, Bell, FileText, Save, Download, Upload } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../services/storageService';
import { useToast } from '../context/ToastContext';
import { generatePDFReport, generateBackup, generateCSVExport } from '../utils/exportHelpers';
import { logoutUser } from '../services/firebase';

interface ProfileProps {
  user: UserProfile;
  onNavigate?: (path: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleLogout = async () => {
    if (confirm('Sign out?')) {
        await logoutUser();
        // The App.tsx listener will handle the redirect to login
    }
  };

  const handlePDFExport = async () => {
    const success = await generatePDFReport(user);
    if (success) showToast('PDF Report generated');
    else showToast('Failed to generate PDF', 'error');
  };

  const handleBackup = async () => {
    const success = await generateBackup(user);
    if (success) showToast('Backup downloaded successfully');
    else showToast('Backup failed', 'error');
  };

  const handleCSVExport = async () => {
    const success = await generateCSVExport();
    if (success) showToast('CSV Exported');
    else showToast('Failed to export CSV', 'error');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            
            if (!confirm(`Restore backup from ${new Date(data.timestamp).toLocaleDateString()}?\nThis will merge with your current data.`)) {
                return;
            }

            // Restore tables
            if (data.transactions) await db.transactions.bulkPut(data.transactions);
            if (data.budgets) await db.budgets.bulkPut(data.budgets);
            if (data.recurring) await db.recurring.bulkPut(data.recurring);
            if (data.savings) await db.savings.bulkPut(data.savings);
            if (data.categories) await db.categories.bulkPut(data.categories);

            showToast('Data restored successfully! Please refresh.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            console.error(err);
            showToast('Invalid backup file', 'error');
        }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="p-5"
    >
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 pt-4">
        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-accent mb-4 relative group">
          <img 
            src={user.avatarUrl} 
            alt="Profile" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;
            }}
            className="w-full h-full rounded-full object-cover border-4 border-background"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-white/10" />
        </div>
        <h2 className="text-xl font-bold text-white">{user.name}</h2>
        <p className="text-slate-500 text-sm">{user.email}</p>
      </div>

      <div className="space-y-6">
        
        {/* Data Management Buttons */}
        <div>
           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-1">Data & Export</p>
           <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={handlePDFExport}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 active:scale-95 transition-all"
              >
                <FileText size={20} className="mb-1.5" />
                <span className="text-[10px] font-medium">PDF</span>
              </button>
              
              <button 
                onClick={handleBackup}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all"
              >
                <Save size={20} className="mb-1.5" />
                <span className="text-[10px] font-medium">Backup</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                <Upload size={20} className="mb-1.5" />
                <span className="text-[10px] font-medium">Restore</span>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden" 
                />
              </button>

              <button 
                onClick={handleCSVExport}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 transition-all"
              >
                <Download size={20} className="mb-1.5" />
                <span className="text-[10px] font-medium">CSV</span>
              </button>
           </div>
        </div>

        {/* Menu Items */}
        <div className="bg-surface rounded-xl p-1 border border-white/5">
          <MenuItem icon={Moon} label="Dark Mode" value="On" />
          <div className="h-[1px] bg-white/5 mx-4" />
          <MenuItem icon={Bell} label="Notifications" value="Daily" />
          <div className="h-[1px] bg-white/5 mx-4" />
          <MenuItem 
            icon={Settings} 
            label="Category Settings" 
            onClick={() => onNavigate && onNavigate('/settings')} 
          />
        </div>

        <button 
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-center gap-2 text-red-400 bg-surface/50 rounded-xl border border-red-500/10 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};

const MenuItem: React.FC<{ icon: any, label: string, value?: string, onClick?: () => void }> = ({ icon: Icon, label, value, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-background rounded-lg text-primary">
        <Icon size={18} />
      </div>
      <span className="text-slate-200 font-medium">{label}</span>
    </div>
    {value && <span className="text-slate-500 text-sm">{value}</span>}
  </button>
);

export default Profile;
