import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface ScoreSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function ScoreSelector({ value, onChange, label, min = 0, max = 15, disabled = false, ariaLabel = 'النتيجة' }: ScoreSelectorProps) {
  const increment = () => {
    if (!disabled && value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (!disabled && value > min) onChange(value - 1);
  };

  return (
    <div className="score-selector flex flex-col items-center gap-2">
      {label && <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>}
      <div className="flex flex-col items-center gap-1">
        <motion.button
          type="button"
          disabled={disabled || value >= max}
          aria-label={`زيادة نتيجة ${ariaLabel}`}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); increment(); }}
          className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors"
        >
          <ChevronUp size={20} />
        </motion.button>
        
        <div className="ds-content-card w-16 h-16 ds-surface border-2 border-primary/20 rounded-lg flex items-center justify-center text-2xl font-bold text-slate-800 dark:text-white shadow-inner">
          {value}
        </div>

        <motion.button
          type="button"
          disabled={disabled || value <= min}
          aria-label={`تقليل نتيجة ${ariaLabel}`}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrement(); }}
          className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors"
        >
          <ChevronDown size={20} />
        </motion.button>
      </div>
    </div>
  );
}
