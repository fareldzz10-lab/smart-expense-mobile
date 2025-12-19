import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface FABProps {
  onClick: () => void;
}

export const FAB: React.FC<FABProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/40 flex items-center justify-center text-white"
    >
      <Plus size={32} strokeWidth={2.5} />
    </motion.button>
  );
};
