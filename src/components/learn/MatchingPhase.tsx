import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { WordFamily } from '../../types';
import { getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  batch: WordFamily[];
  batchIndex: number;
  totalBatches: number;
  onComplete: () => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export const MatchingPhase: React.FC<Props> = ({
  batch,
  batchIndex,
  totalBatches,
  onComplete,
}) => {
  const { settings } = useAppContext();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongLeft, setWrongLeft] = useState<string | null>(null);
  const [wrongRight, setWrongRight] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Shuffle right tiles once when this batch mounts
  const [rightTiles] = useState<{ id: string; text: string }[]>(() =>
    shuffle(batch.map(w => ({ id: w.id, text: w.meaning_bn })))
  );

  useEffect(() => {
    if (matched.size === batch.length && batch.length > 0) {
      setCelebrating(true);
      const t = setTimeout(onComplete, 900);
      return () => clearTimeout(t);
    }
  }, [matched.size, batch.length, onComplete]);

  const handleLeft = (id: string) => {
    if (isLocked || matched.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');
    setSelectedId(prev => (prev === id ? null : id));
  };

  const handleRight = (id: string) => {
    if (isLocked || matched.has(id) || !selectedId) return;

    if (selectedId === id) {
      // Correct match
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched(prev => new Set([...prev, id]));
      setSelectedId(null);
    } else {
      // Wrong match
      triggerHaptic(settings.hapticsEnabled, 'error');
      setIsLocked(true);
      setWrongLeft(selectedId);
      setWrongRight(id);
      setTimeout(() => {
        setWrongLeft(null);
        setWrongRight(null);
        setSelectedId(null);
        setIsLocked(false);
      }, 800);
    }
  };

  const leftClass = (id: string) => {
    const base =
      'p-4 rounded-[16px] border-2 text-left min-h-[60px] flex items-center transition-colors duration-150';
    if (matched.has(id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongLeft === id) return `${base} bg-error/20 border-error`;
    if (selectedId === id) return `${base} bg-primary/20 border-primary`;
    return `${base} bg-surface-container-high border-outline/10 active:scale-95`;
  };

  const rightClass = (id: string) => {
    const base =
      'p-4 rounded-[16px] border-2 text-left min-h-[60px] flex items-center transition-colors duration-150';
    if (matched.has(id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongRight === id) return `${base} bg-error/20 border-error`;
    return `${base} bg-surface-container-high border-outline/10 active:scale-95`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8"
    >
      <div className="text-center mb-5 pt-2">
        <p className="m3-body-small text-on-surface-variant opacity-70">
          Tap a word, then tap its Bangla meaning
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column: English word forms */}
        <div className="flex flex-col gap-3">
          {batch.map(word => (
            <motion.button
              key={`L-${word.id}`}
              onClick={() => handleLeft(word.id)}
              animate={{
                x: wrongLeft === word.id ? [-5, 5, -5, 5, 0] : 0,
                opacity: matched.has(word.id) ? 0 : 1,
                scale: matched.has(word.id) ? 0.9 : 1,
              }}
              transition={
                wrongLeft === word.id
                  ? { duration: 0.35 }
                  : { duration: 0.2, ease: [0.2, 0, 0, 1] }
              }
              className={leftClass(word.id)}
              aria-label={`Word tile: ${getPrimaryForm(word)}`}
            >
              <span className="m3-body-medium text-on-surface font-medium leading-tight">
                {getPrimaryForm(word)}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Right column: Bangla meanings (shuffled) */}
        <div className="flex flex-col gap-3">
          {rightTiles.map(tile => (
            <motion.button
              key={`R-${tile.id}`}
              onClick={() => handleRight(tile.id)}
              animate={{
                x: wrongRight === tile.id ? [-5, 5, -5, 5, 0] : 0,
                opacity: matched.has(tile.id) ? 0 : 1,
                scale: matched.has(tile.id) ? 0.9 : 1,
              }}
              transition={
                wrongRight === tile.id
                  ? { duration: 0.35 }
                  : { duration: 0.2, ease: [0.2, 0, 0, 1] }
              }
              className={rightClass(tile.id)}
              aria-label={`Meaning tile: ${tile.text}`}
            >
              <span className="m3-body-medium text-on-surface leading-tight">{tile.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {celebrating && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
          <p className="m3-title-medium text-primary font-bold">Round complete!</p>
        </motion.div>
      )}
    </motion.div>
  );
};
