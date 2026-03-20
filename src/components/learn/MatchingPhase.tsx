import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

// ── POS config ─────────────────────────────────────────────────────────────────
const POS_CONFIG = [
  { key: 'noun',      label: 'Noun',      dot: 'bg-blue-400'    },
  { key: 'verb',      label: 'Verb',      dot: 'bg-emerald-400' },
  { key: 'adjective', label: 'Adjective', dot: 'bg-amber-400'   },
  { key: 'adverb',    label: 'Adverb',    dot: 'bg-purple-400'  },
] as const;

type Stage = 'meaning' | 'pos';

interface PosPair {
  id: string;
  form: string;
  posLabel: string;
  posDot: string;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function tileTextSize(text: string): string {
  if (text.length <= 8)  return 'text-[16px]';
  if (text.length <= 12) return 'text-[14px]';
  if (text.length <= 18) return 'text-[12px]';
  return 'text-[11px]';
}

function wordToPairs(word: WordFamily): PosPair[] {
  return POS_CONFIG
    .filter(cfg => { const v = word[cfg.key as keyof WordFamily] as string; return v && v !== 'x'; })
    .map(cfg => ({
      id: `${word.id}__${cfg.key}`,
      form: word[cfg.key as keyof WordFamily] as string,
      posLabel: cfg.label,
      posDot: cfg.dot,
    }));
}

function buildPosSubBatches(batch: WordFamily[]): PosPair[][] {
  return batch.map(wordToPairs).filter(p => p.length > 0);
}

// ── Stage banner ───────────────────────────────────────────────────────────────
const StageBanner: React.FC<{ stage: Stage }> = ({ stage }) => (
  <motion.div
    key={stage}
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="flex items-center justify-center gap-2 mb-5"
  >
    <div className={`w-2 h-2 rounded-full transition-colors ${stage === 'meaning' ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <div className={`w-2 h-2 rounded-full transition-colors ${stage === 'pos'     ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <span className="ml-1 m3-label-small text-on-surface-variant tracking-wide">
      {stage === 'meaning' ? 'Stage 1 · Match the meaning' : 'Stage 2 · Match POS to its word form'}
    </span>
  </motion.div>
);

// ── Tile component ─────────────────────────────────────────────────────────────
const Tile: React.FC<{
  id: string;
  children: React.ReactNode;
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
  onTap: () => void;
}> = ({ id, children, isMatched, isSelected, isWrong, onTap }) => {
  const cls = isMatched
    ? 'opacity-0 pointer-events-none scale-90'
    : isWrong
    ? 'bg-error/20 text-error scale-[0.97]'
    : isSelected
    ? 'bg-primary text-on-primary scale-[1.02]'
    : 'bg-surface-container-high text-on-surface active:scale-95';

  return (
    <motion.button
      onClick={onTap}
      animate={{
        x: isWrong ? [-5, 5, -4, 4, 0] : 0,
        opacity: isMatched ? 0 : 1,
        scale: isMatched ? 0.9 : 1,
      }}
      transition={{ duration: 0.28 }}
      disabled={isMatched}
      aria-label={id}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`w-full min-h-[72px] rounded-[20px] flex items-center justify-center px-3 py-3 transition-all duration-150 ${cls}`}
    >
      {children}
    </motion.button>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export const MatchingPhase: React.FC<Props> = ({ batch, batchIndex, totalBatches, onComplete }) => {
  const { settings } = useAppContext();
  const [stage, setStage] = useState<Stage>('meaning');

  // ── Stage 1 ────────────────────────────────────────────────────────────────
  // sel: { id, side } — whichever tile was tapped last
  const [sel1, setSel1]           = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [matched1, setMatched1]   = useState<Set<string>>(new Set());
  const [wrong1, setWrong1]       = useState<string | null>(null); // wrong pair's shared id
  const [locked1, setLocked1]     = useState(false);
  const [celebrate1, setCelebrate1] = useState(false);

  const [rightMeaning] = useState(() =>
    shuffle(batch.map(w => ({ id: w.id, text: w.meaning_bn })))
  );

  // ── Stage 2 ────────────────────────────────────────────────────────────────
  const posSubBatches = useMemo(() => buildPosSubBatches(batch), [batch]);
  const [posSubIdx, setPosSubIdx]     = useState(0);
  const [sel2, setSel2]               = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [matched2, setMatched2]       = useState<Set<string>>(new Set());
  const [wrong2L, setWrong2L]         = useState<string | null>(null);
  const [wrong2R, setWrong2R]         = useState<string | null>(null);
  const [locked2, setLocked2]         = useState(false);
  const [celebrate2, setCelebrate2]   = useState(false);
  const [rightPos, setRightPos]       = useState<PosPair[]>(() => shuffle(posSubBatches[0] ?? []));
  const currentPosSub = posSubBatches[posSubIdx] ?? [];

  useEffect(() => {
    setSel2(null); setMatched2(new Set());
    setWrong2L(null); setWrong2R(null);
    setLocked2(false); setCelebrate2(false);
    setRightPos(shuffle(posSubBatches[posSubIdx] ?? []));
  }, [posSubIdx]);

  // Stage 1 completion
  useEffect(() => {
    if (stage === 'meaning' && matched1.size === batch.length && batch.length > 0) {
      setCelebrate1(true);
      const t = setTimeout(() => { setCelebrate1(false); setStage('pos'); }, 900);
      return () => clearTimeout(t);
    }
  }, [matched1.size, batch.length, stage]);

  // Stage 2 sub-batch completion
  useEffect(() => {
    if (stage !== 'pos') return;
    if (currentPosSub.length > 0 && matched2.size === currentPosSub.length) {
      setCelebrate2(true);
      const t = setTimeout(() => {
        posSubIdx + 1 >= posSubBatches.length ? onComplete() : setPosSubIdx(s => s + 1);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [matched2.size, currentPosSub.length, posSubIdx, posSubBatches.length, stage, onComplete]);

  // ── Stage 1 tap ─────────────────────────────────────────────────────────────
  // Both sides use word.id — matching = same id tapped on opposite sides
  const handleTap1 = (id: string, side: 'left' | 'right') => {
    if (locked1 || matched1.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');

    if (!sel1) {
      setSel1({ id, side });
      return;
    }
    // Tap same tile → deselect
    if (sel1.id === id && sel1.side === side) {
      setSel1(null);
      return;
    }
    // Tap same side → switch selection
    if (sel1.side === side) {
      setSel1({ id, side });
      return;
    }
    // Opposite side tapped
    if (sel1.id === id) {
      // Correct — IDs match
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched1(prev => new Set([...prev, id]));
      setSel1(null);
    } else {
      // Wrong
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked1(true);
      setWrong1(id); // mark the newly tapped wrong tile
      setTimeout(() => { setWrong1(null); setSel1(null); setLocked1(false); }, 800);
    }
  };

  // ── Stage 2 tap ─────────────────────────────────────────────────────────────
  // Left = POS labels, Right = word forms — both use pair.id
  const handleTap2 = (id: string, side: 'left' | 'right') => {
    if (locked2 || matched2.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');

    if (!sel2) {
      setSel2({ id, side });
      return;
    }
    if (sel2.id === id && sel2.side === side) {
      setSel2(null);
      return;
    }
    if (sel2.side === side) {
      setSel2({ id, side });
      return;
    }
    // Opposite side
    if (sel2.id === id) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched2(prev => new Set([...prev, id]));
      setSel2(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked2(true);
      // Track which specific tile on each side was wrong
      setWrong2L(sel2.side === 'left' ? sel2.id : id);
      setWrong2R(sel2.side === 'right' ? sel2.id : id);
      setTimeout(() => { setWrong2L(null); setWrong2R(null); setSel2(null); setLocked2(false); }, 800);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8 pt-2"
    >
      <StageBanner stage={stage} />

      <AnimatePresence mode="wait">

        {/* ── STAGE 1: Bengali meaning ──────────────────────────── */}
        {stage === 'meaning' && (
          <motion.div
            key="meaning"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Left: English words */}
            <div className="flex flex-col gap-3">
              {batch.map(word => {
                const text = getPrimaryForm(word);
                return (
                  <Tile
                    key={`L1-${word.id}`}
                    id={word.id}
                    isMatched={matched1.has(word.id)}
                    isSelected={sel1?.id === word.id && sel1?.side === 'left'}
                    isWrong={false}
                    onTap={() => handleTap1(word.id, 'left')}
                  >
                    <span className={`${tileTextSize(text)} font-bold text-center leading-tight w-full`}>
                      {text}
                    </span>
                  </Tile>
                );
              })}
            </div>

            {/* Right: Bengali meanings (shuffled) */}
            <div className="flex flex-col gap-3">
              {rightMeaning.map(tile => (
                <Tile
                  key={`R1-${tile.id}`}
                  id={tile.id}
                  isMatched={matched1.has(tile.id)}
                  isSelected={sel1?.id === tile.id && sel1?.side === 'right'}
                  isWrong={wrong1 === tile.id}
                  onTap={() => handleTap1(tile.id, 'right')}
                >
                  <span className={`${tileTextSize(tile.text)} font-semibold text-center leading-tight w-full`}>
                    {tile.text}
                  </span>
                </Tile>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STAGE 2: POS → word form ──────────────────────────── */}
        {stage === 'pos' && (
          <motion.div
            key={`pos-${posSubIdx}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {posSubBatches.length > 1 && (
              <div className="flex justify-center gap-1.5 mb-4">
                {posSubBatches.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < posSubIdx  ? 'w-5 bg-primary' :
                      i === posSubIdx ? 'w-7 bg-primary/70' :
                      'w-3 bg-on-surface/15'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Left: POS labels — always unique per word */}
              <div className="flex flex-col gap-3">
                {currentPosSub.map(pair => (
                  <Tile
                    key={`L2-${pair.id}`}
                    id={pair.id}
                    isMatched={matched2.has(pair.id)}
                    isSelected={sel2?.id === pair.id && sel2?.side === 'left'}
                    isWrong={wrong2L === pair.id}
                    onTap={() => handleTap2(pair.id, 'left')}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pair.posDot}`} />
                      <span className="text-[15px] font-bold">{pair.posLabel}</span>
                    </div>
                  </Tile>
                ))}
              </div>

              {/* Right: word forms (shuffled) */}
              <div className="flex flex-col gap-3">
                {rightPos.map(pair => (
                  <Tile
                    key={`R2-${pair.id}`}
                    id={pair.id}
                    isMatched={matched2.has(pair.id)}
                    isSelected={sel2?.id === pair.id && sel2?.side === 'right'}
                    isWrong={wrong2R === pair.id}
                    onTap={() => handleTap2(pair.id, 'right')}
                  >
                    <span className={`${tileTextSize(pair.form)} font-bold text-center leading-tight w-full`}>
                      {pair.form}
                    </span>
                  </Tile>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Celebration */}
      <AnimatePresence>
        {(celebrate1 || celebrate2) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="mt-6 flex flex-col items-center gap-1.5"
          >
            <CheckCircle2 className="w-9 h-9 text-primary" />
            <p className="m3-title-small text-primary font-bold">
              {celebrate1 ? 'Nice! Now match the parts of speech' : 'Round complete!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
