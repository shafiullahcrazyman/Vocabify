import React from 'react';
import { motion } from 'motion/react';
import { Lock, Check, Zap } from 'lucide-react';
import { WordFamily } from '../../types';
import { getPrimaryForm } from '../../utils/sessionAlgorithm';

export type NodeState = 'complete' | 'current' | 'locked';

interface Props {
  word: WordFamily;
  state: NodeState;
  xPct: number; // horizontal position as % of container width
  onTap: () => void;
}

export const PathNode: React.FC<Props> = ({ word, state, xPct, onTap }) => {
  const label = getPrimaryForm(word);
  const isLocked = state === 'locked';

  const ringClass =
    state === 'complete'
      ? 'bg-primary border-[3px] border-primary/30'
      : state === 'current'
      ? 'bg-primary border-[5px] border-on-surface/10 shadow-2xl'
      : 'bg-surface-container-high border-[2px] border-outline/20';

  const labelColor =
    state === 'complete'
      ? 'text-primary font-semibold'
      : state === 'current'
      ? 'text-on-surface font-bold'
      : 'text-on-surface-variant/40';

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${xPct}%`, transform: 'translateX(-50%)', top: 0, width: 96 }}
    >
      {/* "START" bounce bubble for current node */}
      <div className="h-8 flex items-end justify-center mb-1">
        {state === 'current' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.3 },
              y: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
            }}
            className="bg-on-surface text-surface px-3 py-[5px] rounded-full text-[11px] font-black tracking-wide shadow-lg whitespace-nowrap"
          >
            START
          </motion.div>
        )}
      </div>

      {/* Circle button */}
      <motion.button
        onClick={!isLocked ? onTap : undefined}
        disabled={isLocked}
        animate={state === 'current' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={
          state === 'current'
            ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        whileTap={!isLocked ? { scale: 0.86 } : {}}
        className={`w-[78px] h-[78px] rounded-full flex items-center justify-center transition-colors duration-200 ${ringClass} ${
          isLocked ? 'opacity-35' : ''
        }`}
        aria-label={`Learn: ${label}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {state === 'complete' ? (
          <Check className="w-9 h-9 text-on-primary" strokeWidth={3} />
        ) : state === 'current' ? (
          <Zap className="w-9 h-9 text-on-primary" />
        ) : (
          <Lock className="w-7 h-7 text-on-surface-variant/40" />
        )}
      </motion.button>

      {/* Word label */}
      <span className={`text-[12px] text-center leading-tight mt-2 max-w-[88px] ${labelColor}`}>
        {label}
      </span>
    </div>
  );
};
