import React from 'react';
import { motion } from 'motion/react';
import { Home, RotateCcw, Flame, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  wordsCompleted: number;
  // FIX: totalXP is now the persisted lifetime total from IndexedDB (via streak.totalXP),
  // not a session-only calculation that reset every time.
  totalXP: number;
  onPlayAgain: () => void;
}

export const SessionComplete: React.FC<Props> = ({ wordsCompleted, totalXP, onPlayAgain }) => {
  const navigate = useNavigate();
  const { settings, streak } = useAppContext();
  const sessionXP = wordsCompleted * 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6 bg-background"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-center"
      >
        <h1 className="m3-headline-large text-on-surface mb-1">Session Complete!</h1>
        <p className="m3-body-large text-on-surface-variant">Keep it up, great work!</p>
      </motion.div>

      {/* 3 stat cards — same colours as PathNode phases: primary, #B5838D, #2D6A4F */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="w-full max-w-sm flex gap-3"
      >
        {/* Words Learned — primary (purple, same as Flashcards node) */}
        <div className="flex-1 bg-primary rounded-[24px] flex flex-col items-center gap-3 py-7 px-3">
          <BookOpen className="w-10 h-10 text-on-primary" />
          <div className="text-center">
            <p className="text-[34px] leading-none font-bold text-on-primary tracking-tight">
              {wordsCompleted}
            </p>
            <p className="m3-label-small text-on-primary/80 mt-2 uppercase tracking-wide leading-snug">
              Words Learned
            </p>
          </div>
        </div>

        {/* XP Earned — rose (same as Match Pairs node) */}
        <div className="flex-1 bg-[#B5838D] rounded-[24px] flex flex-col items-center gap-3 py-7 px-3">
          <Zap className="w-10 h-10 text-white fill-white" />
          <div className="text-center">
            <p className="text-[34px] leading-none font-bold text-white tracking-tight">
              +{sessionXP}
            </p>
            <p className="m3-label-small text-white/80 mt-2 uppercase tracking-wide leading-snug">
              XP Earned
            </p>
          </div>
        </div>

        {/* Streak — forest green (same as Fill in Blank node) */}
        {/* Flame icon style matches Progress tab: text-orange-500 fill-orange-500 */}
        <div className="flex-1 bg-[#2D6A4F] rounded-[24px] flex flex-col items-center gap-3 py-7 px-3">
          <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
          <div className="text-center">
            <p className="text-[34px] leading-none font-bold text-white tracking-tight">
              {streak.current}
            </p>
            <p className="m3-label-small text-white/80 mt-2 uppercase tracking-wide leading-snug">
              Day Streak
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-3"
      >
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onPlayAgain();
          }}
          aria-label="Start a new learning session"
          className="w-full py-5 rounded-full bg-primary text-on-primary flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <RotateCcw className="w-6 h-6" />
          Keep Learning
        </button>

        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            navigate('/home');
          }}
          aria-label="Go to home screen"
          className="w-full py-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <Home className="w-6 h-6" />
          Go Home
        </button>
      </motion.div>
    </motion.div>
  );
};
