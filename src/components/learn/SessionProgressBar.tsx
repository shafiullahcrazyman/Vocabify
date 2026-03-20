import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  progressPct: number; // 0–100
  phase: string;
  onExit: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  flashcard:      'Phase 1 · Flashcards',
  pre_matching:   'Phase 1 · Flashcards',
  matching:       'Phase 2 · Match Pairs',
  pre_fillblank:  'Phase 2 · Match Pairs',
  fillblank:      'Phase 3 · Fill in the Blank',
};

export const SessionProgressBar: React.FC<Props> = ({ progressPct, phase, onExit }) => {
  const { settings } = useAppContext();
  const label = PHASE_LABELS[phase] ?? '';

  return (
    <div className="sticky top-0 z-20 bg-background px-4 pt-3 pb-2">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => { triggerHaptic(settings.hapticsEnabled, 'tap'); onExit(); }}
          aria-label="Exit learning session"
          className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 h-[6px] bg-surface-container-high rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPct, 100)}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          />
        </div>

        <span className="m3-label-small text-primary font-bold w-8 text-right shrink-0">
          {Math.round(progressPct)}%
        </span>
      </div>

      {label && (
        <p className="m3-label-small text-on-surface-variant text-center tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
};
