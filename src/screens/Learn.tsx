import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildSession, chunkArray } from '../utils/sessionAlgorithm';
import { PathNode, NodeState } from '../components/learn/PathNode';
import { FlashcardPhase } from '../components/learn/FlashcardPhase';
import { MatchingPhase } from '../components/learn/MatchingPhase';
import { FillBlankPhase } from '../components/learn/FillBlankPhase';
import { SessionComplete } from '../components/learn/SessionComplete';
import { WordFamily } from '../types';
import { triggerHaptic } from '../utils/haptics';

// ── Types ──────────────────────────────────────────────────────────────────────
type LearnView =
  | { mode: 'path' }
  | { mode: 'word'; wordIndex: number; phase: 'flashcard' | 'fillblank' }
  | { mode: 'matching'; batchIndex: number }
  | { mode: 'complete' };

// ── Path layout constants ──────────────────────────────────────────────────────
// X position as % of container: center → right → center → left (repeating wave)
const X_PCTS = [50, 72, 50, 28];
const NODE_ROW_H = 130; // px: bubble + circle + label
const CONNECTOR_H = 56;  // px: gap between nodes

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
    {/* Dashed grey track always visible */}
    <line
      x1={fromPct} y1={2}
      x2={toPct} y2={CONNECTOR_H - 2}
      stroke="var(--md-sys-color-outline-variant)"
      strokeWidth="3"
      strokeDasharray="5 5"
      strokeLinecap="round"
    />
    {/* Solid primary fill when done */}
    {done && (
      <line
        x1={fromPct} y1={2}
        x2={toPct} y2={CONNECTOR_H - 2}
        stroke="var(--md-sys-color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    )}
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { words, progress, settings, markLearned } = useAppContext();

  const [sessionWords] = useState<WordFamily[]>(() =>
    buildSession(words, progress.learned, settings.dailyGoal)
  );
  const matchBatches = useMemo(() => chunkArray(sessionWords, 4), [sessionWords]);

  const [view, setView] = useState<LearnView>({ mode: 'path' });
  const [completedCount, setCompletedCount] = useState(0);

  // Auto-scroll to current node when returning to path
  const currentNodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.mode === 'path') {
      const t = setTimeout(() => {
        currentNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [view.mode, completedCount]);

  const overallPct = Math.min((completedCount / sessionWords.length) * 100, 100);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNodeTap = useCallback(
    (wordIndex: number) => {
      triggerHaptic(settings.hapticsEnabled, 'tap');
      setView({ mode: 'word', wordIndex, phase: 'flashcard' });
    },
    [settings.hapticsEnabled]
  );

  // Both "Got it" and "See Again" advance to fill-blank on the path model.
  // The word is always practiced either way.
  const handleFlashNext = useCallback(() => {
    if (view.mode !== 'word') return;
    setView({ mode: 'word', wordIndex: view.wordIndex, phase: 'fillblank' });
  }, [view]);

  const handleFbNext = useCallback(() => {
    if (view.mode !== 'word') return;
    markLearned(sessionWords[view.wordIndex].id);
    const next = completedCount + 1;
    setCompletedCount(next);

    if (next >= sessionWords.length) {
      setView({ mode: 'matching', batchIndex: 0 });
    } else {
      setView({ mode: 'path' });
    }
  }, [view, completedCount, sessionWords, markLearned]);

  const handleMatchComplete = useCallback(() => {
    if (view.mode !== 'matching') return;
    const next = view.batchIndex + 1;
    if (next >= matchBatches.length) {
      setView({ mode: 'complete' });
    } else {
      setView({ mode: 'matching', batchIndex: next });
    }
  }, [view, matchBatches.length]);

  const handlePlayAgain = useCallback(() => {
    navigate('/home');
    setTimeout(() => navigate('/learn'), 60);
  }, [navigate]);

  // ── Session complete ───────────────────────────────────────────────────────
  if (view.mode === 'complete') {
    return <SessionComplete wordsCompleted={sessionWords.length} onPlayAgain={handlePlayAgain} />;
  }

  // ── Sub-label for header ───────────────────────────────────────────────────
  const subLabel =
    view.mode === 'path'
      ? completedCount === 0
        ? 'Tap a node to begin'
        : completedCount === sessionWords.length
        ? 'All done!'
        : `${sessionWords.length - completedCount} word${sessionWords.length - completedCount !== 1 ? 's' : ''} to go`
      : view.mode === 'matching'
      ? 'Phase 2 · Match pairs'
      : view.phase === 'flashcard'
      ? 'Phase 1 · Flashcard'
      : 'Phase 1 · Fill in the blank';

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/home')}
            aria-label="Exit"
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

          <span className="m3-label-small text-primary font-bold w-14 text-right shrink-0">
            {completedCount}/{sessionWords.length}
          </span>
        </div>
        <p className="m3-label-small text-on-surface-variant text-center tracking-wide">
          {subLabel}
        </p>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* PATH VIEW */}
          {view.mode === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
              className="px-4 pt-6 pb-28"
            >
              {sessionWords.map((word, i) => {
                const xPct = X_PCTS[i % 4];
                const nextXPct = X_PCTS[(i + 1) % 4];
                const isCurrent = i === completedCount;
                const nodeState: NodeState =
                  i < completedCount ? 'complete' :
                  isCurrent         ? 'current'  :
                                      'locked';

                return (
                  <React.Fragment key={word.id}>
                    <div
                      ref={isCurrent ? currentNodeRef : undefined}
                      className="relative"
                      style={{ height: NODE_ROW_H }}
                    >
                      <PathNode
                        word={word}
                        state={nodeState}
                        xPct={xPct}
                        onTap={() => handleNodeTap(i)}
                      />
                    </div>

                    {i < sessionWords.length - 1 && (
                      <PathConnector
                        fromPct={xPct}
                        toPct={nextXPct}
                        done={i < completedCount}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </motion.div>
          )}

          {/* FLASHCARD */}
          {view.mode === 'word' && view.phase === 'flashcard' &&
            sessionWords[view.wordIndex] && (
              <FlashcardPhase
                key={`flash-${sessionWords[view.wordIndex].id}`}
                word={sessionWords[view.wordIndex]}
                wordIndex={view.wordIndex}
                totalInQueue={sessionWords.length}
                onGotIt={handleFlashNext}
                onSeeAgain={handleFlashNext}
              />
            )}

          {/* FILL-IN-BLANK */}
          {view.mode === 'word' && view.phase === 'fillblank' &&
            sessionWords[view.wordIndex] && (
              <FillBlankPhase
                key={`fb-${sessionWords[view.wordIndex].id}`}
                word={sessionWords[view.wordIndex]}
                allSessionWords={sessionWords}
                wordIndex={view.wordIndex}
                total={sessionWords.length}
                onNext={handleFbNext}
              />
            )}

          {/* MATCHING */}
          {view.mode === 'matching' && matchBatches[view.batchIndex] && (
            <MatchingPhase
              key={`match-${view.batchIndex}`}
              batch={matchBatches[view.batchIndex]}
              batchIndex={view.batchIndex}
              totalBatches={matchBatches.length}
              onComplete={handleMatchComplete}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
