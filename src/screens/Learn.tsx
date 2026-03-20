import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Shuffle, PenLine, Trophy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildSession, chunkArray } from '../utils/sessionAlgorithm';
import { PathNode, NodeState, PhaseNode } from '../components/learn/PathNode';
import { FlashcardPhase } from '../components/learn/FlashcardPhase';
import { MatchingPhase } from '../components/learn/MatchingPhase';
import { FillBlankPhase } from '../components/learn/FillBlankPhase';
import { SessionComplete } from '../components/learn/SessionComplete';
import { WordFamily } from '../types';
import { triggerHaptic } from '../utils/haptics';

// ── Phase definitions for the path ────────────────────────────────────────────
// These are the nodes shown on the tree. Each node = one exercise type.
const PHASE_DEFS: Omit<PhaseNode, 'sublabel'>[] = [
  {
    id: 'flashcards',
    label: 'Flashcards',
    Icon: BookOpen,
    color: 'bg-[#6750A4]',
    textColor: 'text-white',
  },
  {
    id: 'matching',
    label: 'Match Pairs',
    Icon: Shuffle,
    color: 'bg-[#B5838D]',
    textColor: 'text-white',
  },
  {
    id: 'fillblank',
    label: 'Fill in Blank',
    Icon: PenLine,
    color: 'bg-[#2D6A4F]',
    textColor: 'text-white',
  },
  {
    id: 'complete',
    label: 'Session Done',
    Icon: Trophy,
    color: 'bg-[#E9C46A]',
    textColor: 'text-[#3D2C00]',
  },
];

// Zigzag X positions for 4 nodes
const X_PCTS = [50, 72, 50, 28];
const NODE_ROW_H = 150;  // px per node slot
const CONNECTOR_H = 60;  // px per connector

// ── Connector SVG ──────────────────────────────────────────────────────────────
const PathConnector: React.FC<{ fromPct: number; toPct: number; done: boolean }> = ({
  fromPct,
  toPct,
  done,
}) => (
  <svg
    className="w-full block"
    height={CONNECTOR_H}
    viewBox={`0 0 100 ${CONNECTOR_H}`}
    preserveAspectRatio="none"
  >
    <line
      x1={fromPct} y1={2}
      x2={toPct} y2={CONNECTOR_H - 2}
      stroke="var(--md-sys-color-outline-variant)"
      strokeWidth="3"
      strokeDasharray="6 5"
      strokeLinecap="round"
    />
    {done && (
      <motion.line
        x1={fromPct} y1={2}
        x2={toPct} y2={CONNECTOR_H - 2}
        stroke="var(--md-sys-color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    )}
  </svg>
);

// ── View types ─────────────────────────────────────────────────────────────────
type LearnView =
  | { mode: 'path' }
  | { mode: 'flashcard'; wordIndex: number }
  | { mode: 'matching'; batchIndex: number }
  | { mode: 'fillblank'; wordIndex: number }
  | { mode: 'complete' };

// ── Main component ─────────────────────────────────────────────────────────────
export const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { words, progress, settings, markLearned } = useAppContext();

  const [sessionWords] = useState<WordFamily[]>(() =>
    buildSession(words, progress.learned, settings.dailyGoal)
  );
  const matchBatches = useMemo(() => chunkArray(sessionWords, 4), [sessionWords]);

  const [view, setView]               = useState<LearnView>({ mode: 'path' });
  const [completedPhases, setCompleted] = useState<Set<string>>(new Set());

  // For flashcard sub-progress
  const [flashIndex, setFlashIndex]   = useState(0);
  const [fbIndex, setFbIndex]         = useState(0);
  const [matchIndex, setMatchIndex]   = useState(0);

  // Which phase index is current (0-3)
  const currentPhaseIdx = completedPhases.size < 4 ? completedPhases.size : 4;

  // Auto-scroll to active node
  const activeNodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.mode === 'path') {
      const t = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [view.mode, completedPhases.size]);

  // Sublabels (e.g. "10 words · tap to start")
  const phaseNodes: PhaseNode[] = PHASE_DEFS.map((def, i) => ({
    ...def,
    sublabel:
      i === 0 ? `${sessionWords.length} words` :
      i === 1 ? `${matchBatches.length} round${matchBatches.length !== 1 ? 's' : ''}` :
      i === 2 ? `${sessionWords.length} sentences` :
               'Finish the session',
  }));

  const overallPct = (completedPhases.size / 3) * 100; // 3 real phases (last node is bonus)

  // ── Flashcard handlers ────────────────────────────────────────────────────
  const handleFlashNext = useCallback(() => {
    const next = flashIndex + 1;
    if (next >= sessionWords.length) {
      // All flashcards done — mark phase complete, return to path
      setCompleted(prev => new Set([...prev, 'flashcards']));
      setView({ mode: 'path' });
    } else {
      setFlashIndex(next);
      setView({ mode: 'flashcard', wordIndex: next });
    }
  }, [flashIndex, sessionWords.length]);

  // ── Matching handlers ─────────────────────────────────────────────────────
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

  // ── Fill-blank handlers ───────────────────────────────────────────────────
  const handleFbNext = useCallback(() => {
    markLearned(sessionWords[fbIndex].id);
    const next = fbIndex + 1;
    if (next >= sessionWords.length) {
      setCompleted(prev => new Set([...prev, 'fillblank']));
      setView({ mode: 'path' });
      setFbIndex(0);
    } else {
      setFbIndex(next);
      setView({ mode: 'fillblank', wordIndex: next });
    }
  }, [fbIndex, sessionWords, markLearned]);

  // ── Node tap ──────────────────────────────────────────────────────────────
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
      } else if (phaseId === 'complete') {
        setView({ mode: 'complete' });
      }
    },
    [settings.hapticsEnabled]
  );

  const handlePlayAgain = useCallback(() => {
    navigate('/home');
    setTimeout(() => navigate('/learn'), 60);
  }, [navigate]);

  // ── Session complete ──────────────────────────────────────────────────────
  if (view.mode === 'complete') {
    return <SessionComplete wordsCompleted={sessionWords.length} onPlayAgain={handlePlayAgain} />;
  }

  // ── Sub-label for header ──────────────────────────────────────────────────
  const subLabel =
    view.mode === 'path'
      ? completedPhases.size === 0
        ? 'Tap Flashcards to begin'
        : completedPhases.size === 3
        ? 'All phases done! Tap the trophy!'
        : `${3 - completedPhases.size} phase${3 - completedPhases.size !== 1 ? 's' : ''} remaining`
      : view.mode === 'flashcard'
      ? `Flashcards · ${flashIndex + 1} of ${sessionWords.length}`
      : view.mode === 'matching'
      ? `Match Pairs · Round ${matchIndex + 1} of ${matchBatches.length}`
      : view.mode === 'fillblank'
      ? `Fill in Blank · ${fbIndex + 1} of ${sessionWords.length}`
      : '';

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Sticky header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── PATH ─────────────────────────────────────────────── */}
          {view.mode === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
              className="px-4 pt-8 pb-28"
            >
              {phaseNodes.map((node, i) => {
                const xPct = X_PCTS[i];
                const nextXPct = i < phaseNodes.length - 1 ? X_PCTS[i + 1] : 50;
                const isCurrent = i === currentPhaseIdx;
                const nodeState: NodeState =
                  completedPhases.has(node.id) ? 'complete' :
                  isCurrent                    ? 'current'  :
                                                 'locked';

                return (
                  <React.Fragment key={node.id}>
                    <div
                      ref={isCurrent ? activeNodeRef : undefined}
                      className="relative"
                      style={{ height: NODE_ROW_H }}
                    >
                      <PathNode
                        node={node}
                        state={nodeState}
                        xPct={xPct}
                        onTap={() => handleNodeTap(node.id)}
                      />
                    </div>

                    {i < phaseNodes.length - 1 && (
                      <PathConnector
                        fromPct={xPct}
                        toPct={nextXPct}
                        done={completedPhases.has(node.id)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </motion.div>
          )}

          {/* ── FLASHCARDS ───────────────────────────────────────── */}
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

          {/* ── MATCHING ─────────────────────────────────────────── */}
          {view.mode === 'matching' && matchBatches[view.batchIndex] && (
            <MatchingPhase
              key={`match-${view.batchIndex}`}
              batch={matchBatches[view.batchIndex]}
              batchIndex={view.batchIndex}
              totalBatches={matchBatches.length}
              onComplete={handleMatchNext}
            />
          )}

          {/* ── FILL-IN-BLANK ────────────────────────────────────── */}
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
