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
  { key: 'noun',      label: 'Noun',      short: 'n.',   dot: 'bg-blue-400',    tile: 'bg-blue-500/10 border-blue-400/20 text-blue-700 dark:text-blue-300' },
  { key: 'verb',      label: 'Verb',      short: 'v.',   dot: 'bg-emerald-400', tile: 'bg-emerald-500/10 border-emerald-400/20 text-emerald-700 dark:text-emerald-300' },
  { key: 'adjective', label: 'Adjective', short: 'adj.', dot: 'bg-amber-400',   tile: 'bg-amber-500/10 border-amber-400/20 text-amber-700 dark:text-amber-300' },
  { key: 'adverb',    label: 'Adverb',    short: 'adv.', dot: 'bg-purple-400',  tile: 'bg-purple-500/10 border-purple-400/20 text-purple-700 dark:text-purple-300' },
] as const;

// ── Types ──────────────────────────────────────────────────────────────────────
type Stage = 'meaning' | 'pos';

interface PosPair {
  id: string;
  form: string;
  isNone: boolean;
  posLabel: string;
  posShort: string;
  posDot: string;
  posTile: string;
  meaning: string;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function expandToPairs(batch: WordFamily[]): PosPair[] {
  const pairs: PosPair[] = [];
  for (const word of batch) {
    for (const cfg of POS_CONFIG) {
      const raw = word[cfg.key as keyof WordFamily] as string | undefined;
      const isNone = !raw || raw === 'x';
      pairs.push({
        id: `${word.id}-${cfg.key}`,
        form: isNone ? '—' : raw,
        isNone,
        posLabel: cfg.label,
        posShort: cfg.short,
        posDot: cfg.dot,
        posTile: cfg.tile,
        meaning: word.meaning_bn,
      });
    }
  }
  return pairs;
}

// ── Stage transition banner ────────────────────────────────────────────────────
const StageBanner: React.FC<{ stage: Stage }> = ({ stage }) => (
  <motion.div
    key={stage}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="flex items-center justify-center gap-2 mb-4"
  >
    <div className={`w-2 h-2 rounded-full ${stage === 'meaning' ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <div className={`w-2 h-2 rounded-full ${stage === 'pos'     ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <span className="ml-2 m3-label-small text-on-surface-variant tracking-wide">
      {stage === 'meaning' ? 'Stage 1 · Match the meaning' : 'Stage 2 · Match the part of speech'}
    </span>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const MatchingPhase: React.FC<Props> = ({
  batch,
  batchIndex,
  totalBatches,
  onComplete,
}) => {
  const { settings } = useAppContext();

  // ── Stage 1: meaning ────────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>('meaning');

  // Stage 1 state
  const [selId, setSelId]           = useState<string | null>(null);
  const [matched1, setMatched1]     = useState<Set<string>>(new Set());
  const [wrongL1, setWrongL1]       = useState<string | null>(null);
  const [wrongR1, setWrongR1]       = useState<string | null>(null);
  const [locked1, setLocked1]       = useState(false);
  const [celebrate1, setCelebrate1] = useState(false);

  const [rightMeaning] = useState(() =>
    shuffle(batch.map(w => ({ id: w.id, text: w.meaning_bn })))
  );

  // Stage 2 state
  const allPosPairs = useMemo(() => expandToPairs(batch), [batch]);
  const posSubBatches = useMemo(() => {
    const out: PosPair[][] = [];
    for (let i = 0; i < allPosPairs.length; i += 4) out.push(allPosPairs.slice(i, i + 4));
    return out;
  }, [allPosPairs]);

  const [posSubIdx, setPosSubIdx]   = useState(0);
  const [selPosId, setSelPosId]     = useState<string | null>(null);
  const [matched2, setMatched2]     = useState<Set<string>>(new Set());
  const [wrongL2, setWrongL2]       = useState<string | null>(null);
  const [wrongR2, setWrongR2]       = useState<string | null>(null);
  const [locked2, setLocked2]       = useState(false);
  const [celebrate2, setCelebrate2] = useState(false);
  const [rightPos, setRightPos]     = useState<PosPair[]>(() =>
    shuffle(posSubBatches[0] ?? [])
  );

  const currentPosSub = posSubBatches[posSubIdx] ?? [];

  // Reset pos sub-batch state when sub advances
  useEffect(() => {
    setSelPosId(null);
    setMatched2(new Set());
    setWrongL2(null);
    setWrongR2(null);
    setLocked2(false);
    setCelebrate2(false);
    setRightPos(shuffle(posSubBatches[posSubIdx] ?? []));
  }, [posSubIdx]);

  // ── Stage 1 completion ──────────────────────────────────────────────────────
  useEffect(() => {
    if (stage === 'meaning' && matched1.size === batch.length && batch.length > 0) {
      setCelebrate1(true);
      const t = setTimeout(() => {
        setCelebrate1(false);
        setStage('pos');
      }, 900);
      return () => clearTimeout(t);
    }
  }, [matched1.size, batch.length, stage]);

  // ── Stage 2 sub-batch completion ────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'pos') return;
    if (currentPosSub.length > 0 && matched2.size === currentPosSub.length) {
      setCelebrate2(true);
      const t = setTimeout(() => {
        if (posSubIdx + 1 >= posSubBatches.length) {
          onComplete();
        } else {
          setPosSubIdx(s => s + 1);
        }
      }, 700);
      return () => clearTimeout(t);
    }
  }, [matched2.size, currentPosSub.length, posSubIdx, posSubBatches.length, stage, onComplete]);

  // ── Stage 1 handlers ────────────────────────────────────────────────────────
  const handleLeft1 = (id: string) => {
    if (locked1 || matched1.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');
    setSelId(prev => (prev === id ? null : id));
  };

  const handleRight1 = (id: string) => {
    if (locked1 || matched1.has(id) || !selId) return;
    if (selId === id) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched1(prev => new Set([...prev, id]));
      setSelId(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked1(true);
      setWrongL1(selId);
      setWrongR1(id);
      setTimeout(() => { setWrongL1(null); setWrongR1(null); setSelId(null); setLocked1(false); }, 800);
    }
  };

  // ── Stage 2 handlers ────────────────────────────────────────────────────────
  const handleLeft2 = (id: string) => {
    if (locked2 || matched2.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');
    setSelPosId(prev => (prev === id ? null : id));
  };

  const handleRight2 = (id: string) => {
    if (locked2 || matched2.has(id) || !selPosId) return;
    if (selPosId === id) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched2(prev => new Set([...prev, id]));
      setSelPosId(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked2(true);
      setWrongL2(selPosId);
      setWrongR2(id);
      setTimeout(() => { setWrongL2(null); setWrongR2(null); setSelPosId(null); setLocked2(false); }, 800);
    }
  };

  // ── Tile class helpers ───────────────────────────────────────────────────────
  const base = 'p-3 rounded-[14px] border-2 text-left min-h-[56px] flex flex-col justify-center transition-colors duration-150 w-full';

  const lc1 = (id: string) => {
    if (matched1.has(id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongL1 === id)   return `${base} bg-error/15 border-error`;
    if (selId === id)     return `${base} bg-primary/15 border-primary`;
    return `${base} bg-surface-container-high border-outline/10 active:scale-95`;
  };
  const rc1 = (id: string) => {
    if (matched1.has(id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongR1 === id)   return `${base} bg-error/15 border-error`;
    return `${base} bg-surface-container-high border-outline/10 active:scale-95`;
  };

  const lc2 = (pair: PosPair) => {
    if (matched2.has(pair.id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongL2 === pair.id)   return `${base} bg-error/15 border-error`;
    if (selPosId === pair.id)  return `${base} bg-primary/15 border-primary`;
    return `${base} bg-surface-container-high border-outline/10 active:scale-95`;
  };
  const rc2 = (pair: PosPair) => {
    if (matched2.has(pair.id)) return `${base} opacity-0 pointer-events-none`;
    if (wrongR2 === pair.id)   return `${base} bg-error/15 border-error`;
    return `${base} ${pair.posTile} active:scale-95`;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8 pt-2"
    >
      <StageBanner stage={stage} />

      <AnimatePresence mode="wait">

        {/* ── STAGE 1: Bengali meaning ─────────────────────────── */}
        {stage === 'meaning' && (
          <motion.div
            key="meaning"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-2"
          >
            {/* Left: primary word forms */}
            <div className="flex flex-col gap-2">
              {batch.map(word => (
                <motion.button
                  key={`L1-${word.id}`}
                  onClick={() => handleLeft1(word.id)}
                  animate={{
                    x: wrongL1 === word.id ? [-4, 4, -4, 4, 0] : 0,
                    opacity: matched1.has(word.id) ? 0 : 1,
                    scale: matched1.has(word.id) ? 0.92 : 1,
                  }}
                  transition={wrongL1 === word.id ? { duration: 0.3 } : { duration: 0.18 }}
                  className={lc1(word.id)}
                  aria-label={`Word: ${getPrimaryForm(word)}`}
                >
                  <span className="text-[15px] font-bold text-on-surface leading-tight">
                    {getPrimaryForm(word)}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Right: Bengali meanings (shuffled) */}
            <div className="flex flex-col gap-2">
              {rightMeaning.map(tile => (
                <motion.button
                  key={`R1-${tile.id}`}
                  onClick={() => handleRight1(tile.id)}
                  animate={{
                    x: wrongR1 === tile.id ? [-4, 4, -4, 4, 0] : 0,
                    opacity: matched1.has(tile.id) ? 0 : 1,
                    scale: matched1.has(tile.id) ? 0.92 : 1,
                  }}
                  transition={wrongR1 === tile.id ? { duration: 0.3 } : { duration: 0.18 }}
                  className={rc1(tile.id)}
                  aria-label={`Meaning: ${tile.text}`}
                >
                  <span className="m3-body-medium text-on-surface leading-tight">{tile.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STAGE 2: Parts of speech ─────────────────────────── */}
        {stage === 'pos' && (
          <motion.div
            key={`pos-${posSubIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Sub-batch dots */}
            {posSubBatches.length > 1 && (
              <div className="flex justify-center gap-1.5 mb-3">
                {posSubBatches.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < posSubIdx  ? 'w-4 bg-primary' :
                      i === posSubIdx ? 'w-6 bg-primary' :
                      'w-4 bg-on-surface/15'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* Left: word form + meaning hint */}
              <div className="flex flex-col gap-2">
                {currentPosSub.map(pair => (
                  <motion.button
                    key={`L2-${pair.id}`}
                    onClick={() => handleLeft2(pair.id)}
                    animate={{
                      x: wrongL2 === pair.id ? [-4, 4, -4, 4, 0] : 0,
                      opacity: matched2.has(pair.id) ? 0 : 1,
                      scale: matched2.has(pair.id) ? 0.92 : 1,
                    }}
                    transition={wrongL2 === pair.id ? { duration: 0.3 } : { duration: 0.18 }}
                    className={lc2(pair)}
                    aria-label={`Form: ${pair.form}`}
                  >
                    <span className={`text-[15px] font-bold leading-tight ${
                      pair.isNone ? 'text-on-surface-variant/40 italic' : 'text-on-surface'
                    }`}>
                      {pair.form}
                    </span>
                    <span className="text-[11px] text-on-surface-variant/50 mt-0.5 leading-tight line-clamp-1">
                      {pair.meaning}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Right: POS label (shuffled) */}
              <div className="flex flex-col gap-2">
                {rightPos.map(pair => (
                  <motion.button
                    key={`R2-${pair.id}`}
                    onClick={() => handleRight2(pair.id)}
                    animate={{
                      x: wrongR2 === pair.id ? [-4, 4, -4, 4, 0] : 0,
                      opacity: matched2.has(pair.id) ? 0 : 1,
                      scale: matched2.has(pair.id) ? 0.92 : 1,
                    }}
                    transition={wrongR2 === pair.id ? { duration: 0.3 } : { duration: 0.18 }}
                    className={rc2(pair)}
                    aria-label={`POS: ${pair.posLabel}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${pair.posDot}`} />
                      <span className="text-[15px] font-bold leading-tight">{pair.posLabel}</span>
                    </div>
                    <span className="text-[11px] opacity-50 mt-0.5 ml-3.5">{pair.posShort}</span>
                  </motion.button>
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
