import React from 'react';
import { useCart } from '../context/CartContext';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function QuotaNotice() {
  const { quotaExceeded } = useCart();

  return (
    <AnimatePresence>
      {quotaExceeded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#fbbf24] text-[#064e3b] px-4 py-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 overflow-hidden"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Daily FREE data limit reached. Viewing offline/stale data. Updates will resume soon.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
