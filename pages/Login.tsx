
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome, ShieldCheck, PlayCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithGoogle } from '../services/firebase';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    const user = await loginWithGoogle();
    
    if (user) {
      onLogin(user);
    } else {
      setError('Failed to sign in with Google. Configuration might be missing.');
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
        onLogin({
            name: 'Demo User',
            email: 'demo@smartexpense.app',
            currency: 'IDR',
            avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
        });
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] animate-pulse delay-75" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-5xl">💎</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Smart Expense</h1>
        <p className="text-slate-400 mb-8">Secure, AI-Powered Finance Tracking</p>

        <div className="bg-surface/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Chrome size={20} />
              )}
              Continue with Google
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/5 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-70"
            >
              <PlayCircle size={20} className="text-emerald-400" />
              Try Demo Mode
            </motion.button>

            {error && (
              <p className="text-red-400 text-xs mt-4 bg-red-500/10 py-2 rounded-lg">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
               <ShieldCheck size={12} className="text-emerald-500" />
               <span>Secured by Google Firebase</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
