import React from 'react';
import { motion } from 'motion/react';
import { Lock, Check, LucideIcon } from 'lucide-react';

export type NodeState = 'complete' | 'current' | 'locked';

export interface PhaseNode {
  id: string;
  label: string;       // e.g. "Flashcards"
  sublabel: string;    // e.g. "10 words"
  Icon: LucideIcon;
  color: string;       // Tailwind bg for active/complete state
  textColor: string;   // Tailwind text for icon inside colored bg
}

interface Props {
  node: PhaseNode;
  state: NodeState;
  xPct: number;        // horizontal % across screen
  onTap: () => void;
}

export const PathNode: React.FC<Props> = ({ node, state, xPct, onTap }) => {
  const { Icon, label, sublabel, color, textColor } = node;
  const isLocked = state === 'locked';

  // Outer ring / bg
  const circleClass =
    state === 'complete'
      ? `${color} border-[3px] border-white/20`
      : state === 'current'
      ? `${color} border-[6px] border-white/25 shadow-2xl`
      : 'bg-surface-container border-[2px] border-outline/20';

  const iconClass =
    state === 'locked'
      ? 'text-on-surface-variant/30'
      : state === 'complete'
      ? `${textColor}`
      : `${textColor}`;

  const labelClass =
    state === 'complete'
      ? 'text-on-surface font-semibold opacity-80'
      : state === 'current'
      ? 'text-on-surface font-extrabold'
      : 'text-on-surface-variant/35 font-medium';

  const sublabelClass =
    state === 'locked'
      ? 'text-on-surface-variant/25'
      : 'text-on-surface-variant/70';

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${xPct}%`, transform: 'translateX(-50%)', top: 0, width: 120 }}
    >
      {/* Bounce label above current node */}
      <div className="h-9 flex items-end justify-center mb-1">
        {state === 'current' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.3 },
              y: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
            }}
            className="bg-on-surface text-surface px-3 py-1 rounded-full text-[11px] font-black tracking-wider shadow-md whitespace-nowrap"
          >
            TAP TO START
          </motion.div>
        )}
        {state === 'complete' && (
          <div className="h-9" /> // spacer to keep layout stable
        )}
      </div>

      {/* Main circle */}
      <motion.button
        onClick={!isLocked ? onTap : undefined}
        disabled={isLocked}
        animate={state === 'current' ? { scale: [1, 1.07, 1] } : { scale: 1 }}
        transition={
          state === 'current'
            ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
        whileTap={!isLocked ? { scale: 0.84 } : {}}
        aria-label={`${label} phase`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={`w-[90px] h-[90px] rounded-full flex items-center justify-center transition-colors duration-200 ${circleClass} ${
          isLocked ? 'opacity-30' : ''
        }`}
      >
        {state === 'complete' ? (
          <Check className={`w-10 h-10 ${iconClass}`} strokeWidth={3} />
        ) : state === 'locked' ? (
          <Lock className="w-8 h-8 text-on-surface-variant/30" />
        ) : (
          <Icon className={`w-10 h-10 ${iconClass}`} />
        )}
      </motion.button>

      {/* Labels */}
      <span className={`text-[13px] text-center leading-tight mt-2 tracking-wide ${labelClass}`}>
        {label}
      </span>
      <span className={`text-[11px] text-center leading-tight mt-0.5 ${sublabelClass}`}>
        {sublabel}
      </span>
    </div>
  );
};
