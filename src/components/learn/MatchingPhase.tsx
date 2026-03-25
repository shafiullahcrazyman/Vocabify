import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { WordFamily } from '../../types';
import { getValidForms } from '../../utils/sessionAlgorithm';
import { shuffle } from '../../utils/shuffle';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  batch: WordFamily[];
  batchIndex: number;
  totalBatches: number;
  onComplete: () => void;
}

const POS_CONFIG = [
  { key: 'noun',      label: 'Noun'      },
  { key: 'verb',      label: 'Verb'      },
  { key: 'adjective', label: 'Adjective' },
  { key: 'adverb',    label: 'Adverb'    },
] as const;

type Stage = 'meaning' | 'pos';

// One English form paired with its single Bengali meaning line
interface MeaningPair {
  id: string;        // e.g. "42__noun" — unique, shared on both sides for matching
  form: string;      // English word form
  meaningBn: string; // Single Bengali line (no slashes)
}

interface PosPair {
  id: string;
  form: string;
  posLabel: string;
}

function lineTextSize(line: string): string {
  if (line.length <= 8)  return 'text-[16px]';
  if (line.length <= 14) return 'text-[14px]';
  if (line.length <= 22) return 'text-[12px]';
  return 'text-[11px]';
}

function splitMeaningBn(meaning_bn: string): string[] {
  return meaning_bn.split(' / ').map(s => s.trim()).filter(Boolean);
}

// Build Stage 1 sub-batches: one sub-batch per word, each pair = one form + one meaning line
function buildMeaningSubBatches(batch: WordFamily[]): MeaningPair[][] {
  const result: MeaningPair[][] = [];
  for (const word of batch) {
    const forms = getValidForms(word);
    const bnLines = splitMeaningBn(word.meaning_bn);
    const len = Math.min(forms.length, bnLines.length);
    if (len < 2) continue;
    result.push(
      Array.from({ length: len }, (_, i) => ({
        id: `${word.id}__${forms[i].pos.toLowerCase()}`,
        form: forms[i].form,
        meaningBn: bnLines[i],
      }))
    );
  }
  return result;
}

function wordToPairs(word: WordFamily): PosPair[] {
  return POS_CONFIG
    .filter(cfg => { const v = word[cfg.key as keyof WordFamily] as string; return v && v !== 'x'; })
    .map(cfg => ({
      id: `${word.id}__${cfg.key}`,
      form: word[cfg.key as keyof WordFamily] as string,
      posLabel: cfg.label,
    }));
}

function buildPosSubBatches(batch: WordFamily[]): PosPair[][] {
  const globalMap = new Map<string, PosPair>();
  for (const word of batch) {
    for (const pair of wordToPairs(word)) {
      const key = pair.form.toLowerCase();
      if (globalMap.has(key)) {
        const existing = globalMap.get(key)!;
        if (!existing.posLabel.includes(pair.posLabel)) {
          globalMap.set(key, { ...existing, posLabel: `${existing.posLabel} · ${pair.posLabel}` });
        }
      } else {
        globalMap.set(key, pair);
      }
    }
  }
  const used = new Set<string>();
  const result: PosPair[][] = [];
  for (const word of batch) {
    const keys = wordToPairs(word)
      .map(p => p.form.toLowerCase())
      .filter((k, i, arr) => arr.indexOf(k) === i);
    const fresh = keys.filter(k => !used.has(k));
    if (fresh.length < 2) continue;
    result.push(fresh.map(k => globalMap.get(k)!));
    fresh.forEach(k => used.add(k));
  }
  return result;
}

// Progress dots shared by both stages
const SubBatchDots: React.FC<{ total: number; current: number }> = ({ total, current }) => {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current   ? 'w-5 bg-primary' :
            i === current ? 'w-7 bg-primary/70' :
            'w-3 bg-on-surface/15'
          }`}
        />
      ))}
    </div>
  );
};

const StageBanner: React.FC<{ stage: Stage }> = ({ stage }) => (
  <motion.div
    key={stage}
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="flex items-center justify-center gap-2 mb-5"
  >
    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${stage === 'meaning' ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${stage === 'pos'     ? 'bg-primary' : 'bg-on-surface/20'}`} />
    <span className="ml-1 m3-body-small text-on-surface-variant font-medium">
      {stage === 'meaning' ? 'Stage 1 · Match the meanings' : 'Stage 2 · Match the parts of speech'}
    </span>
  </motion.div>
);

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
      className={`w-full min-h-[76px] rounded-[20px] flex items-center justify-center px-4 py-4 transition-all duration-150 ${cls}`}
    >
      {children}
    </motion.button>
  );
};

export const MatchingPhase: React.FC<Props> = ({ batch, batchIndex, totalBatches, onComplete }) => {
  const { settings } = useAppContext();
  const [stage, setStage] = useState<Stage>('meaning');

  // ── Stage 1 state ──────────────────────────────────────────────────────────
  const meaningSubBatches = useMemo(() => buildMeaningSubBatches(batch), [batch]);
  const [meaningSubIdx, setMeaningSubIdx] = useState(0);
  const [sel1, setSel1]         = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [matched1, setMatched1] = useState<Set<string>>(new Set());
  const [wrongL1, setWrongL1]   = useState<string | null>(null);
  const [wrongR1, setWrongR1]   = useState<string | null>(null);
  const [locked1, setLocked1]   = useState(false);
  const [celebrate1, setCelebrate1] = useState(false);

  const [leftMeaning,  setLeftMeaning]  = useState<MeaningPair[]>(() => shuffle(meaningSubBatches[0] ?? []));
  const [rightMeaning, setRightMeaning] = useState<MeaningPair[]>(() => shuffle(meaningSubBatches[0] ?? []));

  const currentMeaningSub = meaningSubBatches[meaningSubIdx] ?? [];

  useEffect(() => {
    setSel1(null); setMatched1(new Set());
    setWrongL1(null); setWrongR1(null);
    setLocked1(false); setCelebrate1(false);
    setLeftMeaning(shuffle(meaningSubBatches[meaningSubIdx] ?? []));
    setRightMeaning(shuffle(meaningSubBatches[meaningSubIdx] ?? []));
  }, [meaningSubIdx, meaningSubBatches]);

  // ── Stage 2 state ──────────────────────────────────────────────────────────
  const posSubBatches = useMemo(() => buildPosSubBatches(batch), [batch]);
  const [posSubIdx, setPosSubIdx]   = useState(0);
  const [sel2, setSel2]             = useState<{ id: string; side: 'left' | 'right' } | null>(null);
  const [matched2, setMatched2]     = useState<Set<string>>(new Set());
  const [wrong2L, setWrong2L]       = useState<string | null>(null);
  const [wrong2R, setWrong2R]       = useState<string | null>(null);
  const [locked2, setLocked2]       = useState(false);
  const [celebrate2, setCelebrate2] = useState(false);

  const [leftPos,  setLeftPos]  = useState<PosPair[]>(() => shuffle(posSubBatches[0] ?? []));
  const [rightPos, setRightPos] = useState<PosPair[]>(() => shuffle(posSubBatches[0] ?? []));

  const currentPosSub = posSubBatches[posSubIdx] ?? [];

  useEffect(() => {
    setSel2(null); setMatched2(new Set());
    setWrong2L(null); setWrong2R(null);
    setLocked2(false); setCelebrate2(false);
    setLeftPos(shuffle(posSubBatches[posSubIdx] ?? []));
    setRightPos(shuffle(posSubBatches[posSubIdx] ?? []));
  }, [posSubIdx, posSubBatches]);

  // ── Stage 1 completion ─────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'meaning') return;

    // Edge case: no sub-batches at all, skip to Stage 2 or complete
    if (meaningSubBatches.length === 0) {
      if (posSubBatches.length === 0) { onComplete(); } else { setStage('pos'); }
      return;
    }

    if (matched1.size < currentMeaningSub.length) return;

    setCelebrate1(true);
    const t = setTimeout(() => {
      setCelebrate1(false);
      if (meaningSubIdx + 1 >= meaningSubBatches.length) {
        if (posSubBatches.length === 0) { onComplete(); } else { setStage('pos'); }
      } else {
        setMeaningSubIdx(s => s + 1);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [matched1.size, currentMeaningSub.length, meaningSubIdx, meaningSubBatches.length, stage, posSubBatches.length, onComplete]);

  // ── Stage 2 completion ─────────────────────────────────────────────────────
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

  // ── Stage 1 tap ────────────────────────────────────────────────────────────
  const handleTap1 = (id: string, side: 'left' | 'right') => {
    if (locked1 || matched1.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');
    if (!sel1) { setSel1({ id, side }); return; }
    if (sel1.id === id && sel1.side === side) { setSel1(null); return; }
    if (sel1.side === side) { setSel1({ id, side }); return; }
    if (sel1.id === id) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched1(prev => new Set([...prev, id]));
      setSel1(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked1(true);
      setWrongL1(sel1.side === 'left' ? sel1.id : id);
      setWrongR1(sel1.side === 'right' ? sel1.id : id);
      setTimeout(() => { setWrongL1(null); setWrongR1(null); setSel1(null); setLocked1(false); }, 800);
    }
  };

  // ── Stage 2 tap ────────────────────────────────────────────────────────────
  const handleTap2 = (id: string, side: 'left' | 'right') => {
    if (locked2 || matched2.has(id)) return;
    triggerHaptic(settings.hapticsEnabled, 'tap');
    if (!sel2) { setSel2({ id, side }); return; }
    if (sel2.id === id && sel2.side === side) { setSel2(null); return; }
    if (sel2.side === side) { setSel2({ id, side }); return; }
    if (sel2.id === id) {
      triggerHaptic(settings.hapticsEnabled, 'success');
      setMatched2(prev => new Set([...prev, id]));
      setSel2(null);
    } else {
      triggerHaptic(settings.hapticsEnabled, 'error');
      setLocked2(true);
      setWrong2L(sel2.side === 'left' ? sel2.id : id);
      setWrong2R(sel2.side === 'right' ? sel2.id : id);
      setTimeout(() => { setWrong2L(null); setWrong2R(null); setSel2(null); setLocked2(false); }, 800);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8 pt-4"
    >
      <StageBanner stage={stage} />

      <AnimatePresence mode="wait">

        {/* ── STAGE 1: one tile per form/meaning pair ────────────────────── */}
        {stage === 'meaning' && (
          <motion.div
            key={`meaning-${meaningSubIdx}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <SubBatchDots total={meaningSubBatches.length} current={meaningSubIdx} />

            <div className="grid grid-cols-2 gap-3">
              {/* Left: English forms (independently shuffled) */}
              <div className="flex flex-col gap-3">
                {leftMeaning.map(pair => (
                  <Tile
                    key={`L1-${pair.id}`}
                    id={pair.id}
                    isMatched={matched1.has(pair.id)}
                    isSelected={sel1?.id === pair.id && sel1?.side === 'left'}
                    isWrong={wrongL1 === pair.id}
                    onTap={() => handleTap1(pair.id, 'left')}
                  >
                    <span className={`${lineTextSize(pair.form)} font-bold text-center leading-snug w-full`}>
                      {pair.form}
                    </span>
                  </Tile>
                ))}
              </div>

              {/* Right: Bengali meanings (independently shuffled) */}
              <div className="flex flex-col gap-3">
                {rightMeaning.map(pair => (
                  <Tile
                    key={`R1-${pair.id}`}
                    id={pair.id}
                    isMatched={matched1.has(pair.id)}
                    isSelected={sel1?.id === pair.id && sel1?.side === 'right'}
                    isWrong={wrongR1 === pair.id}
                    onTap={() => handleTap1(pair.id, 'right')}
                  >
                    <span className={`${lineTextSize(pair.meaningBn)} font-semibold text-center leading-snug w-full`}>
                      {pair.meaningBn}
                    </span>
                  </Tile>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STAGE 2: word form → POS label ────────────────────────────── */}
        {stage === 'pos' && (
          <motion.div
            key={`pos-${posSubIdx}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <SubBatchDots total={posSubBatches.length} current={posSubIdx} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                {leftPos.map(pair => (
                  <Tile
                    key={`L2-${pair.id}`}
                    id={pair.id}
                    isMatched={matched2.has(pair.id)}
                    isSelected={sel2?.id === pair.id && sel2?.side === 'left'}
                    isWrong={wrong2L === pair.id}
                    onTap={() => handleTap2(pair.id, 'left')}
                  >
                    <span className={`${lineTextSize(pair.form)} font-bold text-center leading-tight w-full`}>
                      {pair.form}
                    </span>
                  </Tile>
                ))}
              </div>
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
                    <span className={`${lineTextSize(pair.posLabel)} font-bold text-center w-full`}>
                      {pair.posLabel}
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
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <p className="m3-title-medium text-primary font-bold">
              {celebrate1
                ? meaningSubIdx + 1 >= meaningSubBatches.length
                  ? 'Match parts of speech'
                  : 'Next group!'
                : posSubIdx + 1 >= posSubBatches.length
                  ? 'Round complete!'
                  : 'Next group!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
