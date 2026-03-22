import React from 'react';
import { motion } from 'motion/react';
import { Home, RotateCcw, Flame, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  wordsCompleted: number;
  totalXP: number;
  onPlayAgain: () => void;
}

// M3 emphasized easing — used throughout Material You for entrances
const M3_EASE = [0.2, 0, 0, 1] as const;

// Spring config for the stat cards pop-in
const CARD_SPRING = { type: 'spring', damping: 22, stiffness: 280 } as const;

export const SessionComplete: React.FC<Props> = ({ wordsCompleted, totalXP, onPlayAgain }) => {
  const navigate = useNavigate();
  const { settings, streak } = useAppContext();
  const sessionXP = wordsCompleted * 10;

  const cards = [
    {
      bg: 'bg-primary',
      Icon: BookOpen,
      iconCls: 'text-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      value: String(wordsCompleted),
      label: 'Words Learned',
    },
    {
      bg: 'bg-primary',
      Icon: Zap,
      iconCls: 'text-on-primary fill-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      value: `+${sessionXP}`,
      label: 'XP Earned',
    },
    {
      bg: 'bg-primary',
      Icon: Flame,
      iconCls: 'text-on-primary',
      valueCls: 'text-on-primary',
      labelCls: 'text-on-primary/80',
      value: String(streak.current),
      label: 'Day Streak',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Scrollable upper content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6 gap-8">

        {/* Title — fade + slide up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: M3_EASE }}
          className="text-center"
        >
          <h1 className="m3-headline-large text-on-surface mb-1">Session Complete!</h1>
          <p className="m3-body-large text-on-surface-variant">Keep it up, great work!</p>
        </motion.div>

        {/* Stat cards — staggered spring pop-in */}
        <div className="w-full max-w-sm flex gap-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.72, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...CARD_SPRING, delay: 0.18 + i * 0.09 }}
              className={`flex-1 ${card.bg} rounded-[24px] flex flex-col items-center gap-3 py-7 px-3`}
            >
              <card.Icon className={`w-10 h-10 ${card.iconCls}`} />
              <div className="text-center">
                <p className={`text-[34px] leading-none font-bold tracking-tight ${card.valueCls}`}>
                  {card.value}
                </p>
                <p className={`m3-label-small mt-2 uppercase tracking-wide leading-snug ${card.labelCls}`}>
                  {card.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Sticky bottom buttons ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: M3_EASE, delay: 0.45 }}
        className="w-full px-6 pb-10 pt-4 flex flex-col gap-3 bg-background"
      >
        <motion.button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onPlayAgain();
          }}
          aria-label="Start a new learning session"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12, ease: M3_EASE }}
          className="w-full py-5 rounded-full bg-primary text-on-primary flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <RotateCcw className="w-6 h-6" />
          Keep Learning
        </motion.button>

        <motion.button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            navigate('/home');
          }}
          aria-label="Go to home screen"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12, ease: M3_EASE }}
          className="w-full py-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <Home className="w-6 h-6" />
          Go Home
        </motion.button>
      </motion.div>
    </div>
  );
};
