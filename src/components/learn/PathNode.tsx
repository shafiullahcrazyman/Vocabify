import React from 'react';
import { motion } from 'motion/react';
import { Lock, Check, LucideIcon } from 'lucide-react';

export type NodeState = 'complete' | 'current' | 'locked';

export interface PhaseNode {
  id: string;
  label: string;
  sublabel: string;
  Icon: LucideIcon;
  color: string;       // active/complete bg
  iconColor: string;   // icon color inside circle
}

interface Props {
  node: PhaseNode;
  state: NodeState;
  side: 'left' | 'right'; // which side the circle sits on
  onTap: () => void;
}

export const PathNode: React.FC<Props> = ({ node, state, side, onTap }) => {
  const { Icon, label, sublabel, color, iconColor } = node;
  // Completed nodes are non-interactive to prevent accidentally re-running a phase.
  const isLocked   = state === 'locked';
  const isComplete = state === 'complete';
  const isDisabled = isLocked || isComplete;

  const circleBg =
    state === 'locked'
      ? 'bg-surface-container-highest'
      : `${color} border-[4px] border-white/10`;

  const glowRing =
    state === 'current'
      ? 'ring-4 ring-offset-2 ring-offset-background ring-primary/40'
      : '';

  const labelColor =
    state === 'locked'
      ? 'text-on-surface-variant/30'
      : state === 'complete'
      ? 'text-on-surface/70'
      : 'text-on-surface';

  const sublabelColor =
    state === 'locked'
      ? 'text-on-surface-variant/20'
      : 'text-on-surface-variant/60';

  const circle = (
    <motion.button
      onClick={!isDisabled ? onTap : undefined}
      disabled={isDisabled}
      animate={state === 'current' ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={
        state === 'current'
          ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
      whileTap={!isDisabled ? { scale: 0.84 } : {}}
      aria-label={`${label} phase`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`w-[86px] h-[86px] shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${circleBg} ${glowRing} ${
        isLocked ? 'opacity-30' : ''
      }`}
    >
      {state === 'complete' ? (
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      ) : state === 'locked' ? (
        <Lock className="w-9 h-9 text-on-surface-variant/30" />
      ) : (
        <Icon className={`w-11 h-11 ${iconColor}`} />
      )}
    </motion.button>
  );

  const textBlock = (
    <div className={`flex flex-col ${side === 'left' ? 'items-start' : 'items-end'}`}>
      {/* "TAP TO START" badge for current */}
      {state === 'current' && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1.5 bg-primary text-on-primary text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
        >
          Tap to start
        </motion.span>
      )}
      {state === 'complete' && (
        <span className="mb-1.5 bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
          Completed
        </span>
      )}

      <span className={`m3-title-medium font-extrabold leading-tight ${labelColor}`}>
        {label}
      </span>
      <span className={`m3-body-small mt-0.5 leading-tight ${sublabelColor}`}>
        {sublabel}
      </span>
    </div>
  );

  return (
    <div
      className={`flex items-center gap-5 w-full ${
        side === 'left' ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      {circle}
      {textBlock}
    </div>
  );
};
