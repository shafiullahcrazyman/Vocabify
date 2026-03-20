import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Home, RotateCcw, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  wordsCompleted: number;
  onPlayAgain: () => void;
}

export const SessionComplete: React.FC<Props> = ({ wordsCompleted, onPlayAgain }) => {
  const navigate = useNavigate();
  const { settings, streak } = useAppContext();
  const xp = wordsCompleted * 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6 bg-background"
    >
      {/* Trophy icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 bg-primary rounded-full flex items-center justify-center"
      >
        <Sparkles className="w-12 h-12 text-on-primary" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center"
      >
        <h1 className="m3-headline-large text-on-surface mb-1">Session Complete!</h1>
        <p className="m3-body-large text-on-surface-variant">Keep it up, great work!</p>
      </motion.div>

      {/* Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="w-full max-w-sm bg-primary rounded-[28px] p-6 text-on-primary"
      >
        <div className="grid grid-cols-2 divide-x divide-on-primary/20">
          <div className="text-center pr-4">
            <p className="text-[52px] leading-none font-bold">{wordsCompleted}</p>
            <p className="m3-label-small opacity-80 mt-1 uppercase tracking-wide">
              Words Learned
            </p>
          </div>
          <div className="text-center pl-4">
            <p className="text-[52px] leading-none font-bold">{xp}</p>
            <p className="m3-label-small opacity-80 mt-1 uppercase tracking-wide">
              XP Earned
            </p>
          </div>
        </div>

        {streak.current > 0 && (
          <div className="mt-4 pt-4 border-t border-on-primary/20 flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <p className="m3-body-medium opacity-90">
              {streak.current}-day streak!
            </p>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-3"
      >
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onPlayAgain();
          }}
          aria-label="Start a new learning session"
          className="w-full py-5 rounded-full bg-primary text-on-primary flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150 shadow-lg"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <RotateCcw className="w-4 h-4" />
          Keep Learning
        </button>

        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            navigate('/home');
          }}
          aria-label="Go to home screen"
          className="w-full py-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150 shadow-lg"
          style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </motion.div>
    </motion.div>
  );
};
