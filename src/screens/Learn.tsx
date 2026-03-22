import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, BookOpen, Shuffle, PenLine, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useAppContext, getLocalDateString } from '../context/AppContext';
import { buildSession, chunkArray } from '../utils/sessionAlgorithm';
import { useWordFilter } from '../hooks/useWordFilter';
import { PathNode, NodeState, PhaseNode } from '../components/learn/PathNode';
import { FlashcardPhase } from '../components/learn/FlashcardPhase';
import { MatchingPhase } from '../components/learn/MatchingPhase';
import { FillBlankPhase } from '../components/learn/FillBlankPhase';
import { SessionComplete } from '../components/learn/SessionComplete';
import { WordFamily } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { useBackButton } from '../hooks/useBackButton';

// ── Phase definitions ──────────────────────────────────────────────────────────
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
    label: 'Fill in the Blanks',
    Icon: PenLine,
    color: 'bg-[#2D6A4F]',
    iconColor: 'text-white',
  },
];

// Matching phase requires at least this many words per batch
const MIN_POOL_SIZE = 4;

// ── Diagonal connector SVG ─────────────────────────────────────────────────────
const Connector: React.FC<{ fromSide: 'left' | 'right'; done: boolean }> = ({ fromSide, done }) => {
  const x1 = fromSide === 'left' ? '14%' : '86%';
  const x2 = fromSide === 'left' ? '86%' : '14%';
  return (
    <svg className="w-full" height={72} viewBox="0 0 100 72" preserveAspectRatio="none">
      <line x1={x1} y1={4} x2={x2} y2={68}
        stroke="var(--md-sys-color-outline-variant)"
        strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round"
      />
      {done && (
        <line x1={x1} y1={4} x2={x2} y2={68}
          stroke="var(--md-sys-color-primary)"
          strokeWidth="3" strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// ── Filter summary builder ─────────────────────────────────────────────────────
// Turns active filter state into a compact readable chip label.
// e.g. "Hard · Business · Noun" or "Favorites · B2 +2"
const buildFilterSummary = (filters: ReturnType<typeof useAppContext>['filters']): string => {
  const parts: string[] = [];
  if (filters.favoritesOnly)  parts.push('Favorites');
  if (filters.level.length)   parts.push(...filters.level.map(l => l.charAt(0).toUpperCase() + l.slice(1)));
  if (filters.cefr.length)    parts.push(...filters.cefr);
  if (filters.pos.length)     parts.push(...filters.pos.map(p => p.charAt(0).toUpperCase() + p.slice(1)));
  if (filters.theme.length)   parts.push(...filters.theme);
  if (filters.letter.length)  parts.push(...filters.letter);
  // Cap at 4 labels, show "+N more" if there are extra
  return parts.slice(0, 4).join(' · ') + (parts.length > 4 ? ` +${parts.length - 4}` : '');
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
  const {
    words, progress, settings, filters, favorites,
    markLearned, addXP, streak, updateFilters,
  } = useAppContext();

  // ── Build session pool respecting active filters ───────────────────────────
  //
  // We run useWordFilter here with two intentional overrides:
  //
  //   1. searchQuery = ''
  //      The live search bar text is user-ephemeral — a typed search should
  //      never silently shrink the session pool. Only persistent filter
  //      selections (level, theme, POS, etc.) should apply.
  //
  //   2. settingsForPool.hideLearnedWords = false
  //      Learned words are still needed as SRS review candidates. If we
  //      honoured hideLearnedWords here, a user with that setting on would
  //      never see any review words in their session — they would only ever
  //      see brand-new words, breaking spaced repetition entirely.
  //
  const settingsForPool = useMemo(
    () => ({ ...settings, hideLearnedWords: false }),
    // Deliberately exclude hideLearnedWords from deps — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.theme, settings.dailyGoal, settings.hapticsEnabled,
     settings.animationsEnabled, settings.autoPronounce],
  );

  const { filteredWords, hasActiveFilters } = useWordFilter(
    words,
    '',
    filters,
    settingsForPool,
    progress,
    favorites,
    null,
  );

  // Pool = filtered words when filters are on; full dictionary otherwise.
  const sessionPool: WordFamily[] = hasActiveFilters ? filteredWords : words;

  // Guard: Matching phase needs ≥ MIN_POOL_SIZE words. If the filtered pool is
  // too small, render a dedicated warning screen instead of a broken session.
  const tooFewWords = hasActiveFilters && filteredWords.length < MIN_POOL_SIZE;

  // ── Session words — frozen at mount ───────────────────────────────────────
  // buildSession is called once via useState initialiser so the word list never
  // changes while a session is in progress (even if context changes).
  const [sessionWords] = useState<WordFamily[]>(() => {
    if (tooFewWords) return [];
    return buildSession(sessionPool, progress.learned, settings.dailyGoal, progress.learnedDates);
  });

  const MATCH_BATCH_SIZE = 5;
  const matchBatches = useMemo(
    () => chunkArray(sessionWords, MATCH_BATCH_SIZE),
    [sessionWords],
  );

  const [view, setView]                = useState<LearnView>({ mode: 'path' });
  const [completedPhases, setCompleted] = useState<Set<string>>(new Set());
  const [flashQueue, setFlashQueue]    = useState<number[]>(() =>
    Array.from({ length: sessionWords.length }, (_, i) => i),
  );
  const [flashPos, setFlashPos]        = useState(0);
  const [fbIndex, setFbIndex]          = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [matchIndex, setMatchIndex]    = useState(0);

  // Guard: tracks whether session XP has already been awarded so neither
  // handleFbNext (phase complete) nor handleExit (mid-session quit) can
  // accidentally call addXP twice for the same session.
  const xpAwardedRef = useRef(false);

  const currentPhaseIdx = completedPhases.size;

  const activeNodeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.mode === 'path') {
      const t = setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [view.mode, completedPhases.size]);

  // ── Progress bar ───────────────────────────────────────────────────────────
  const completedPhasePct = (completedPhases.size / 3) * 100;

  const currentPhaseInternalPct: number = (() => {
    if (view.mode === 'flashcard') {
      const uniqueSeen = new Set(flashQueue.slice(0, flashPos)).size;
      return (uniqueSeen / sessionWords.length) * 100;
    }
    if (view.mode === 'matching')  return (view.batchIndex / matchBatches.length) * 100;
    if (view.mode === 'fillblank') return (view.wordIndex / sessionWords.length) * 100;
    return 0;
  })();

  const currentPhaseBarWidth = (currentPhaseInternalPct / 100) * (100 / 3);

  // ── Phase nodes ────────────────────────────────────────────────────────────
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
        setFlashQueue(Array.from({ length: sessionWords.length }, (_, i) => i));
        setFlashPos(0);
        setView({ mode: 'flashcard', wordIndex: 0 });
      } else if (phaseId === 'matching') {
        setMatchIndex(0);
        setView({ mode: 'matching', batchIndex: 0 });
      } else if (phaseId === 'fillblank') {
        setFbIndex(0);
        setView({ mode: 'fillblank', wordIndex: 0 });
      }
    },
    [settings.hapticsEnabled, sessionWords.length],
  );

  const handleFlashGotIt = useCallback(() => {
    const nextPos = flashPos + 1;
    if (nextPos >= flashQueue.length) {
      setCompleted(prev => new Set([...prev, 'flashcards']));
      setView({ mode: 'path' });
    } else {
      setFlashPos(nextPos);
      setView({ mode: 'flashcard', wordIndex: flashQueue[nextPos] });
    }
  }, [flashPos, flashQueue]);

  const handleFlashSeeAgain = useCallback(() => {
    const currentWordIdx = flashQueue[flashPos];
    const newQueue = [...flashQueue, currentWordIdx];
    setFlashQueue(newQueue);
    const nextPos = flashPos + 1;
    setFlashPos(nextPos);
    setView({ mode: 'flashcard', wordIndex: newQueue[nextPos] });
  }, [flashPos, flashQueue]);

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
    const today = getLocalDateString();
    const alreadyCountedToday =
      (progress.learnedDates ?? {})[sessionWords[fbIndex].id] === today;

    if (!alreadyCountedToday) {
      markLearned(sessionWords[fbIndex].id);
      // Only increment for genuinely new learns to keep the complete screen accurate
      setLearnedCount(c => c + 1);
    }

    const next = fbIndex + 1;
    if (next >= sessionWords.length) {
      setCompleted(prev => new Set([...prev, 'fillblank']));
      // FIX: learnedCount was already incremented above when applicable.
      // Do NOT add +1 here — the old code did `alreadyCountedToday ? c : c + 1`
      // which caused a double-increment (and 10 extra XP) on the last new word.
      setLearnedCount(c => {
        if (!xpAwardedRef.current) {
          xpAwardedRef.current = true;
          addXP(c * 10);
        }
        return c;
      });
      setView({ mode: 'complete' });
    } else {
      setFbIndex(next);
      setView({ mode: 'fillblank', wordIndex: next });
    }
  }, [fbIndex, sessionWords, markLearned, progress.learnedDates, addXP]);

  // Award partial XP when user exits mid-session after completing some fill-blank words.
  // xpAwardedRef prevents a double-award if the phase already completed and awarded XP.
  const handleExit = useCallback(() => {
    if (learnedCount > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      addXP(learnedCount * 10);
    }
    navigate('/home');
  }, [navigate, learnedCount, addXP]);

  // Back button: from any active phase -> return to path view (not exit)
  const isInPhase = view.mode === 'flashcard' || view.mode === 'matching' || view.mode === 'fillblank';
  const handleBackToPath = useCallback(() => {
    triggerHaptic(settings.hapticsEnabled, 'tap');
    setView({ mode: 'path' });
  }, [settings.hapticsEnabled]);

  // Hardware / browser back during a phase should go back to path, not navigate away
  useBackButton(isInPhase, handleBackToPath);

  const handlePlayAgain = useCallback(() => {
    navigate('/learn');
  }, [navigate]);

  // ── Too-few-words screen ───────────────────────────────────────────────────
  // The Matching phase requires at least MIN_POOL_SIZE words per batch.
  // When active filters shrink the pool below that, we cannot run a session —
  // show a clear explanation with two resolution options.
  if (tooFewWords) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-20 bg-background px-4 pt-3 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/home')}
              aria-label="Go back"
              className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-6 h-6" />
            </button>
            <p className="m3-title-small text-on-surface font-semibold">Start Session</p>
            <span className="w-8" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
        >
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-error" />
          </div>

          <div className="text-center">
            <h2 className="m3-headline-small text-on-surface mb-2">Not enough words</h2>
            <p className="m3-body-large text-on-surface-variant max-w-xs">
              Your active filters only match{' '}
              <span className="font-bold text-primary">{filteredWords.length}</span>{' '}
              word{filteredWords.length !== 1 ? 's' : ''}. A session needs at least{' '}
              <span className="font-bold text-on-surface">{MIN_POOL_SIZE}</span> words
              for the Matching phase to work.
            </p>
          </div>

          {/* Show which filters are currently active */}
          <div className="bg-surface-container rounded-[20px] px-5 py-4 w-full max-w-sm">
            <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-2">
              Active Filters
            </p>
            <p className="m3-body-medium text-on-surface break-words">
              {buildFilterSummary(filters) || 'None'}
            </p>
          </div>

          <div className="w-full max-w-sm flex flex-col gap-3">
            <button
              onClick={() => {
                triggerHaptic(settings.hapticsEnabled, 'tap');
                updateFilters({
                  level: [], cefr: [], pos: [], letter: [], theme: [], favoritesOnly: false,
                });
                navigate('/learn');
              }}
              aria-label="Clear all filters and start a session"
              className="w-full py-5 bg-primary text-on-primary rounded-full flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
              style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              <SlidersHorizontal className="w-6 h-6" />
              Clear Filters & Start
            </button>

            <button
              onClick={() => {
                triggerHaptic(settings.hapticsEnabled, 'tap');
                navigate('/filter');
              }}
              aria-label="Go to filters to adjust your selection"
              className="w-full py-5 bg-surface-container-high text-on-surface rounded-full flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
              style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              <PenLine className="w-6 h-6" />
              Adjust Filters
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Session complete ───────────────────────────────────────────────────────
  if (view.mode === 'complete') {
    return (
      <SessionComplete
        wordsCompleted={learnedCount}
        totalXP={streak.totalXP ?? 0}
        onPlayAgain={handlePlayAgain}
      />
    );
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
      ? `Flashcards · ${flashPos + 1} of ${flashQueue.length}`
      : view.mode === 'matching'
      ? `Match Pairs · Round ${matchIndex + 1} of ${matchBatches.length}`
      : `Fill in the Blanks · ${fbIndex + 1} of ${sessionWords.length}`;

  return (
    <div className="h-[100dvh] bg-background flex flex-col">

      {/* ── Sticky header ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background px-4 pt-3 pb-3 shrink-0">

        {/* Row 1: back/exit + sublabel + phase counter */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={isInPhase ? handleBackToPath : handleExit}
            aria-label={isInPhase ? 'Back to learning path' : 'Exit session'}
            className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-90"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isInPhase ? (
                <motion.span
                  key="back"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                  className="flex"
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.span>
              ) : (
                <motion.span
                  key="exit"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                  className="flex"
                >
                  <X className="w-6 h-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <p className="m3-title-small text-on-surface font-semibold">
            {subLabel}
          </p>
          <span className="m3-label-small text-primary font-bold">
            {completedPhases.size}/3
          </span>
        </div>

        {/* Row 2: dual-colour progress bar */}
        <div className="w-full bg-on-surface/20 rounded-full h-2 overflow-hidden relative">
          <motion.div
            className="absolute left-0 top-0 h-full bg-primary rounded-full"
            animate={{ width: `${completedPhasePct}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          />
          <motion.div
            className="absolute top-0 h-full bg-primary-container rounded-full"
            animate={{
              left: `${completedPhasePct}%`,
              width: `${currentPhaseBarWidth}%`,
            }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
          />
        </div>

        {/* Row 3: filter context badge
            Shown only on the path screen so it doesn't clutter phase views.
            Tells the user at a glance that their session is drawn from a
            filtered subset, e.g. "Hard · Business · 23 words". */}
        <AnimatePresence>
          {hasActiveFilters && view.mode === 'path' && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between bg-primary/10 rounded-full px-4 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="m3-label-small text-primary font-semibold truncate">
                    {buildFilterSummary(filters)}
                  </span>
                </div>
                <span className="m3-label-small text-primary/70 shrink-0 ml-2">
                  {sessionPool.length} words
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scrollable content ────────────────────────────────────── */}
      <div className={`flex-1 ${view.mode === 'flashcard' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <AnimatePresence mode="wait">

          {/* PATH */}
          {view.mode === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="px-6 flex flex-col min-h-[calc(100vh-100px)] justify-evenly py-8"
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
                    <div ref={isCurrent ? activeNodeRef : undefined}>
                      <PathNode
                        node={node}
                        state={nodeState}
                        side={side}
                        onTap={() => handleNodeTap(node.id)}
                      />
                    </div>
                    {i < phaseNodes.length - 1 && (
                      <Connector fromSide={side} done={completedPhases.has(node.id)} />
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
              onGotIt={handleFlashGotIt}
              onSeeAgain={handleFlashSeeAgain}
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
