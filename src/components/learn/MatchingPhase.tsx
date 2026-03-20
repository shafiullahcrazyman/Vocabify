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
type SelSide = 'left' | 'right' | null;

interface PosPair {
  id: string;
  form: string;
  posLabel: string;
  posDot: string;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Dynamic font size based on text length
function tileTextSize(text: string): string {
  const len = text.length;
  if (len <= 8)  return 'text-[16px]';
  if (len <= 12) return 'text-[14px]';
  if (len <= 18) return 'text-[12px]';
  return 'text-[11px]';
}

function wordToPairs(word: WordFamily): PosPair[] {
  return POS_CONFIG
    .filter(cfg => {
      const raw = word[cfg.key as keyof WordFamily] as string | undefined;
      return raw && raw !== 'x';
    })
    .map(cfg => ({
      id: `${word.id}-${cfg.key}`,
      form: word[cfg.key as keyof WordFamily] as string,
      posLabel: cfg.label,
      posDot: cfg.dot,
    }));
}

function buildPosSubBatches(batch: WordFamily[]): PosPair[][] {
  return batch.map(wordToPairs).filter(p => p.length > 0);
}

// ── Tile colours ───────────────────────────────────────────────────────────────
// Distinct tonal fills per row index so every pair has a unique hue
const ROW_COLORS = [
  'bg-blue-500/20    text-blue-200',
  'bg-emerald-500/20 text-emerald-200',
  'bg-violet-500/20  text-violet-200',
  'bg-rose-500/20    text-rose-200',
  'bg-amber-500/20   text-amber-200',
];

// State tile overrides
const TILE_SELECTED  = 'bg-primary/30 text-primary ring-2 ring-primary ring-inset';
const TILE_WRONG     = 'bg-error/25 text-error';
const TILE_MATCHED   = 'opacity-0 pointer-events-none scale-95';
const TILE_DEFAULT   = 'bg-surface-container-highest text-on-surface';

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

// ── Main component ─────────────────────────────────────────────────────────────
export const MatchingPhase: React.FC<Props> = ({ batch, batchIndex, totalBatches, onComplete }) => {
  const { settings } = useAppContext();

  const [stage, setStage] = useState<Stage>('meaning');

  // ── STAGE 1 state ──────────────────────────────────────────────────────────
  const [selId1, setSelId1]         = useState<string | null>(null);
  const [selSide1, setSelSide1]     = useState<SelSide>(null);
  const [matched1, setMatched1]     = useState<Set<string>>(new Set());
  const [wrongPair1, setWrongPair1] = useState<[string, string] | null>(null);
  const [locked1, setLocked1]       = useState(false);
  const [celebrate1, setCelebrate1] = useState(false);

  const [rightMeaning] = useState(() =>
    shuffle(batch.map(w => ({ id: w.id, text: w.meaning_bn })))
  );

  // ── STAGE 2 state ──────────────────────────────────────────────────────────
  const posSubBatches = useMemo(() => buildPosSubBatches(batch), [batch]);
  const [posSubIdx, setPosSubIdx]   = useState(0);
  const [selId2, setSelId2]         = useState<string | null>(null);
  const [selSide2, setSelSide2]     = useState<SelSide>(null);
  const [matched2, setMatched2]     = useState<Set<string>>(new Set());
  const [wrongPair2, setWrongPair2] = useState<[string, string] | null>(null);
  const [locked2, setLocked2]       = useState(false);
  const [celebrate2, setCelebrate2] = useState(false);
  const [rightPos, setRightPos]     = useState<PosPair[]>(() =>
    shuffle(posSubBatches[0] ?? [])
  );
  const currentPosSub = posSubBatches[posSubIdx] ?? [];

  useEffect(() => {
    setSelId2(null); setSelSide2(null);
    setMatched2(new Set());
    setWrongPair2(null); setLocked2(false); setCelebrate2(false);
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

  // ── Generic tile tap handler (works for both stages) ─────────────────────
  const handleTap = (
    tappedId: string,
    tappedSide: 'left' | 'right',
    matched: Set<string>,
    locked: boolean,
    selId: string | null,
    selSide: SelSide,
    setSelId: (id: string | null) => void,
    setSelSide: (s: SelSide) => void,
    setMatched: (fn: (prev: Set<string>) => Set<string>) => void,
    setWrongPair: (p: [string, string] | null) => void,
    setLocked: (b: boolean) => void,
  ) => {
    if (locked || matched.has(tappedId)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');

    // Nothing selected yet — select this tile
    if (selId === null) {
      setSelId(tappedId);
      setSelSide(tappedSide);
      return;
    }

    // Same tile tapped again — deselect
    if (selId === tappedId) {
      setSelId(null);
      setSelSide(null);
      return;
    }

    // Same side tapped — switch selection to new tile
    if (selSide === tappedSide) {
      setSelId(tappedId);
      return;
    }

    // Opposite side tapped — attempt match (IDs must match)
    if (selId === tappedId) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched(prev => new Set([...prev, tappedId]));
      setSelId(null);
      setSelSide(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked(true);
      const wrongL = selSide === 'left' ? selId : tappedId;
      const wrongR = selSide === 'right' ? selId : tappedId;
      setWrongPair([wrongL, wrongR]);
      setTimeout(() => {
        setWrongPair(null);
        setSelId(null);
        setSelSide(null);
        setLocked(false);
      }, 800);
    }
  };

  const tap1 = (id: string, side: 'left' | 'right') =>
    handleTap(id, side, matched1, locked1, selId1, selSide1,
      setSelId1, setSelSide1, setMatched1, setWrongPair1, setLocked1);

  const tap2 = (id: string, side: 'left' | 'right') =>
    handleTap(id, side, matched2, locked2, selId2, selSide2,
      setSelId2, setSelSide2, setMatched2, setWrongPair2, setLocked2);

  // ── Tile class builder ──────────────────────────────────────────────────────
  const tileClass = (
    id: string,
    side: 'left' | 'right',
    matched: Set<string>,
    selId: string | null,
    wrongPair: [string, string] | null,
    rowIdx: number,
    useRowColor: boolean,
  ) => {
    const base = 'relative w-full min-h-[72px] rounded-[20px] flex items-center justify-center px-3 py-3 transition-all duration-150 active:scale-95 overflow-hidden';
    if (matched.has(id))  return `${base} ${TILE_MATCHED}`;
    const inWrong = wrongPair && (wrongPair[0] === id || wrongPair[1] === id);
    if (inWrong)          return `${base} ${TILE_WRONG}`;
    if (selId === id)     return `${base} ${TILE_SELECTED}`;
    if (useRowColor)      return `${base} ${ROW_COLORS[rowIdx % ROW_COLORS.length]}`;
    return `${base} ${TILE_DEFAULT}`;
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

        {/* ── STAGE 1: Match the meaning ──────────────────────────── */}
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
              {batch.map((word, i) => {
                const text = getPrimaryForm(word);
                return (
                  <motion.button
                    key={`L1-${word.id}`}
                    onClick={() => tap1(word.id, 'left')}
                    animate={{
                      x: wrongPair1 && wrongPair1[0] === word.id ? [-5, 5, -5, 5, 0] : 0,
                      opacity: matched1.has(word.id) ? 0 : 1,
                      scale: matched1.has(word.id) ? 0.9 : 1,
                    }}
                    transition={{ duration: 0.28 }}
                    className={tileClass(word.id, 'left', matched1, selId1, wrongPair1, i, true)}
                    aria-label={`Word: ${text}`}
                  >
                    <span className={`${tileTextSize(text)} font-bold text-center leading-tight w-full`}>
                      {text}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Right: Bengali meanings (shuffled) — same row colors */}
            <div className="flex flex-col gap-3">
              {rightMeaning.map((tile, i) => {
                // Find original row index to match color
                const rowIdx = batch.findIndex(w => w.id === tile.id);
                return (
                  <motion.button
                    key={`R1-${tile.id}`}
                    onClick={() => tap1(tile.id, 'right')}
                    animate={{
                      x: wrongPair1 && wrongPair1[1] === tile.id ? [-5, 5, -5, 5, 0] : 0,
                      opacity: matched1.has(tile.id) ? 0 : 1,
                      scale: matched1.has(tile.id) ? 0.9 : 1,
                    }}
                    transition={{ duration: 0.28 }}
                    className={tileClass(tile.id, 'right', matched1, selId1, wrongPair1, rowIdx >= 0 ? rowIdx : i, true)}
                    aria-label={`Meaning: ${tile.text}`}
                  >
                    <span className={`${tileTextSize(tile.text)} font-semibold text-center leading-tight w-full`}>
                      {tile.text}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STAGE 2: Match the part of speech ──────────────────── */}
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
                      i <= posSubIdx ? 'w-5 bg-primary' : 'w-3 bg-on-surface/15'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Left: POS labels — always unique per word, so no duplicates */}
              <div className="flex flex-col gap-3">
                {currentPosSub.map((pair, i) => (
                  <motion.button
                    key={`L2-${pair.id}`}
                    onClick={() => tap2(pair.id, 'left')}
                    animate={{
                      x: wrongPair2 && wrongPair2[0] === pair.id ? [-5, 5, -5, 5, 0] : 0,
                      opacity: matched2.has(pair.id) ? 0 : 1,
                      scale: matched2.has(pair.id) ? 0.9 : 1,
                    }}
                    transition={{ duration: 0.28 }}
                    className={tileClass(pair.id, 'left', matched2, selId2, wrongPair2, i, false)}
                    aria-label={`POS: ${pair.posLabel}`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${pair.posDot}`} />
                      <span className="text-[15px] font-bold text-on-surface">{pair.posLabel}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Right: word forms (shuffled) — may repeat but POS label guides matching */}
              <div className="flex flex-col gap-3">
                {rightPos.map((pair, i) => (
                  <motion.button
                    key={`R2-${pair.id}`}
                    onClick={() => tap2(pair.id, 'right')}
                    animate={{
                      x: wrongPair2 && wrongPair2[1] === pair.id ? [-5, 5, -5, 5, 0] : 0,
                      opacity: matched2.has(pair.id) ? 0 : 1,
                      scale: matched2.has(pair.id) ? 0.9 : 1,
                    }}
                    transition={{ duration: 0.28 }}
                    className={tileClass(pair.id, 'right', matched2, selId2, wrongPair2, i, false)}
                    aria-label={`Form: ${pair.form}`}
                  >
                    <span className={`${tileTextSize(pair.form)} font-bold text-center leading-tight w-full`}>
                      {pair.form}
                    </span>
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
