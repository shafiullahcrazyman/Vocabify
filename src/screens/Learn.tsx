import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Shuffle, PenLine } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildSession, chunkArray } from '../utils/sessionAlgorithm';
import { PathNode, NodeState, PhaseNode } from '../components/learn/PathNode';
import { FlashcardPhase } from '../components/learn/FlashcardPhase';
import { MatchingPhase } from '../components/learn/MatchingPhase';
import { FillBlankPhase } from '../components/learn/FillBlankPhase';
import { SessionComplete } from '../components/learn/SessionComplete';
import { WordFamily } from '../types';
import { triggerHaptic } from '../utils/haptics';

// ── Phase definitions ──────────────────────────────────────────────────────────
// side alternates: left, right, left
const SIDES: ('left' | 'right')[] = ['left', 'right', 'left'];

const PHASE_DEFS: Omit<PhaseNode, 'sublabel'>[] = [
  {
    id: 'flashcards',
    label: 'Flashcards',
    Icon: BookOpen,
    color: 'bg-primary',
    iconColor: 'text-on-primary',
  },
  {
    id: 'matching',
    label: 'Match Pairs',
    Icon: Shuffle,
    color: 'bg-[#B5838D]',
    iconColor: 'text-white',
  },
  {
    id: 'fillblank',
    label: 'Fill in Blank',
    Icon: PenLine,
    color: 'bg-[#2D6A4F]',
    iconColor: 'text-white',
  },
];

// ── Diagonal connector SVG ─────────────────────────────────────────────────────
// from: left node center (x≈43px) or right node center (x≈calc(100%-43px))
const Connector: React.FC<{
  fromSide: 'left' | 'right';
  done: boolean;
}> = ({ fromSide, done }) => {
  // SVG uses percentage-based coords — 8% ≈ left node center, 92% ≈ right node center
  const x1 = fromSide === 'left' ? '14%' : '86%';
  const x2 = fromSide === 'left' ? '86%' : '14%';

  return (
    <svg className="w-full" height={72} viewBox="0 0 100 72" preserveAspectRatio="none">
      {/* Dashed grey track */}
      <line
        x1={x1} y1={4}
        x2={x2} y2={68}
        stroke="var(--md-sys-color-outline-variant)"
        strokeWidth="2.5"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      {/* Solid primary overlay when done */}
      {done && (
        <line
          x1={x1} y1={4}
          x2={x2} y2={68}
          stroke="var(--md-sys-color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// ── View types ─────────────────────────────────────────────────────────────────
type LearnView =
  | { mode: 'path' }
  | { mode: 'flashcard'; wordIndex: number }
  | { mode: 'matching'; batchIndex: number }
  | { mode: 'fillblank'; wordIndex: number }
  | { mode: 'complete' };

// ── Component ──────────────────────────────────────────────────────────────────
export const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { words, progress, settings, markLearned } = useAppContext();

  const [sessionWords] = useState<WordFamily[]>(() =>
    buildSession(words, progress.learned, settings.dailyGoal)
  );
  const matchBatches = useMemo(() => chunkArray(sessionWords, 4), [sessionWords]);

  const [view, setView]                = useState<LearnView>({ mode: 'path' });
  const [completedPhases, setCompleted] = useState<Set<string>>(new Set());
  const [flashIndex, setFlashIndex]    = useState(0);
  const [fbIndex, setFbIndex]          = useState(0);
  const [matchIndex, setMatchIndex]    = useState(0);

  const currentPhaseIdx = completedPhases.size; // 0, 1, 2 → done = 3

  const activeNodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.mode === 'path') {
      const t = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [view.mode, completedPhases.size]);

  const overallPct = (completedPhases.size / 3) * 100;

  // ── Build phase nodes with dynamic sublabels ───────────────────────────────
  const phaseNodes: PhaseNode[] = PHASE_DEFS.map((def, i) => ({
    ...def,
    sublabel:
      i === 0 ? `${sessionWords.length} words` :
      i === 1 ? `${matchBatches.length} round${matchBatches.length !== 1 ? 's' : ''}` :
               `${sessionWords.length} sentences`,
  }));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNodeTap = useCallback(
    (phaseId: string) => {
      triggerHaptic(settings.hapticsEnabled, 'tap');
      if (phaseId === 'flashcards') {
        setFlashIndex(0);
        setView({ mode: 'flashcard', wordIndex: 0 });
      } else if (phaseId === 'matching') {
        setMatchIndex(0);
        setView({ mode: 'matching', batchIndex: 0 });
      } else if (phaseId === 'fillblank') {
        setFbIndex(0);
        setView({ mode: 'fillblank', wordIndex: 0 });
      }
    },
    [settings.hapticsEnabled]
  );

  const handleFlashNext = useCallback(() => {
    const next = flashIndex + 1;
    if (next >= sessionWords.length) {
      setCompleted(prev => new Set([...prev, 'flashcards']));
      setView({ mode: 'path' });
    } else {
      setFlashIndex(next);
      setView({ mode: 'flashcard', wordIndex: next });
    }
  }, [flashIndex, sessionWords.length]);

  const handleMatchNext = useCallback(() => {
    const next = matchIndex + 1;
    if (next >= matchBatches.length) {
      setCompleted(prev => new Set([...prev, 'matching']));
      setView({ mode: 'path' });
      setMatchIndex(0);
    } else {
      setMatchIndex(next);
      setView({ mode: 'matching', batchIndex: next });
    }
  }, [matchIndex, matchBatches.length]);

  const handleFbNext = useCallback(() => {
    markLearned(sessionWords[fbIndex].id);
    const next = fbIndex + 1;
    if (next >= sessionWords.length) {
      setCompleted(prev => new Set([...prev, 'fillblank']));
      // All 3 phases done → session complete
      setView({ mode: 'complete' });
    } else {
      setFbIndex(next);
      setView({ mode: 'fillblank', wordIndex: next });
    }
  }, [fbIndex, sessionWords, markLearned]);

  const handlePlayAgain = useCallback(() => {
    navigate('/home');
    setTimeout(() => navigate('/learn'), 60);
  }, [navigate]);

  // ── Session complete ───────────────────────────────────────────────────────
  if (view.mode === 'complete') {
    return <SessionComplete wordsCompleted={sessionWords.length} onPlayAgain={handlePlayAgain} />;
  }

  // ── Header sub-label ───────────────────────────────────────────────────────
  const subLabel =
    view.mode === 'path'
      ? completedPhases.size === 0
        ? 'Tap Flashcards to begin'
        : completedPhases.size === 3
        ? 'All done!'
        : `${3 - completedPhases.size} phase${3 - completedPhases.size !== 1 ? 's' : ''} remaining`
      : view.mode === 'flashcard'
      ? `Flashcards · ${flashIndex + 1} of ${sessionWords.length}`
      : view.mode === 'matching'
      ? `Match Pairs · Round ${matchIndex + 1} of ${matchBatches.length}`
      : `Fill in Blank · ${fbIndex + 1} of ${sessionWords.length}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sticky header ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/home')}
            aria-label="Exit session"
            className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-[6px] bg-surface-container-high rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
            />
          </div>

          <span className="m3-label-small text-primary font-bold shrink-0">
            {completedPhases.size}/3
          </span>
        </div>
        <p className="m3-label-small text-on-surface-variant text-center tracking-wide">
          {subLabel}
        </p>
      </div>

      {/* ── Scrollable content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* PATH */}
          {view.mode === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="px-6 pt-10 pb-28 flex flex-col"
            >
              {phaseNodes.map((node, i) => {
                const side = SIDES[i];
                const isCurrent = i === currentPhaseIdx;
                const nodeState: NodeState =
                  completedPhases.has(node.id) ? 'complete' :
                  isCurrent                    ? 'current'  :
                                                 'locked';

                return (
                  <React.Fragment key={node.id}>
                    {/* Node row */}
                    <div
                      ref={isCurrent ? activeNodeRef : undefined}
                      className="py-2"
                    >
                      <PathNode
                        node={node}
                        state={nodeState}
                        side={side}
                        onTap={() => handleNodeTap(node.id)}
                      />
                    </div>

                    {/* Diagonal connector (not after last) */}
                    {i < phaseNodes.length - 1 && (
                      <Connector
                        fromSide={side}
                        done={completedPhases.has(node.id)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </motion.div>
          )}

          {/* FLASHCARDS */}
          {view.mode === 'flashcard' && sessionWords[view.wordIndex] && (
            <FlashcardPhase
              key={`flash-${view.wordIndex}`}
              word={sessionWords[view.wordIndex]}
              wordIndex={view.wordIndex}
              totalInQueue={sessionWords.length}
              onGotIt={handleFlashNext}
              onSeeAgain={handleFlashNext}
            />
          )}

          {/* MATCHING */}
          {view.mode === 'matching' && matchBatches[view.batchIndex] && (
            <MatchingPhase
              key={`match-${view.batchIndex}`}
              batch={matchBatches[view.batchIndex]}
              batchIndex={view.batchIndex}
              totalBatches={matchBatches.length}
              onComplete={handleMatchNext}
            />
          )}

          {/* FILL-IN-BLANK */}
          {view.mode === 'fillblank' && sessionWords[view.wordIndex] && (
            <FillBlankPhase
              key={`fb-${view.wordIndex}`}
              word={sessionWords[view.wordIndex]}
              allSessionWords={sessionWords}
              wordIndex={view.wordIndex}
              total={sessionWords.length}
              onNext={handleFbNext}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
