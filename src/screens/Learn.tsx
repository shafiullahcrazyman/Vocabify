import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { buildSession, chunkArray } from '../utils/sessionAlgorithm';
import { SessionProgressBar } from '../components/learn/SessionProgressBar';
import { FlashcardPhase } from '../components/learn/FlashcardPhase';
import { MatchingPhase } from '../components/learn/MatchingPhase';
import { FillBlankPhase } from '../components/learn/FillBlankPhase';
import { SessionComplete } from '../components/learn/SessionComplete';
import { WordFamily } from '../types';

// ── Phase types ────────────────────────────────────────────────────────────────
type Phase =
  | { name: 'flashcard' }
  | { name: 'pre_matching' }       // brief bridge between p1 and p2
  | { name: 'matching'; batchIndex: number }
  | { name: 'pre_fillblank' }      // brief bridge between p2 and p3
  | { name: 'fillblank'; wordIndex: number }
  | { name: 'complete' };

// ── Progress helpers ───────────────────────────────────────────────────────────
const PHASE_WEIGHTS = { flashcard: 0.3, matching: 0.3, fillblank: 0.4 };

function calcProgress(phase: Phase, sessionSize: number, flashcardIdx: number, fbIdx: number): number {
  const p1Done = PHASE_WEIGHTS.flashcard;
  const p2Done = p1Done + PHASE_WEIGHTS.matching;

  if (phase.name === 'complete') return 100;
  if (phase.name === 'fillblank' || phase.name === 'pre_fillblank') {
    const fbProg = phase.name === 'fillblank' ? fbIdx / sessionSize : 0;
    return (p2Done + fbProg * PHASE_WEIGHTS.fillblank) * 100;
  }
  if (phase.name === 'matching' || phase.name === 'pre_matching') {
    return p1Done * 100;
  }
  // flashcard phase
  return Math.min((flashcardIdx / sessionSize) * p1Done * 100, p1Done * 100);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const Learn: React.FC = () => {
  const navigate = useNavigate();
  const { words, progress, settings, markLearned } = useAppContext();

  // Build session once on mount
  const [sessionWords] = useState<WordFamily[]>(() =>
    buildSession(words, progress.learned, settings.dailyGoal)
  );

  // Flashcard queue — words the user requests to "See Again" are re-appended
  const [flashQueue, setFlashQueue] = useState<WordFamily[]>(sessionWords);
  const [flashIdx, setFlashIdx] = useState(0);

  // Matching batches (size 4)
  const matchBatches = useMemo(() => chunkArray(sessionWords, 4), [sessionWords]);

  // Fill-in-the-blank index (over sessionWords)
  const [fbIdx, setFbIdx] = useState(0);

  // Current phase
  const [phase, setPhase] = useState<Phase>({ name: 'flashcard' });

  const progressPct = calcProgress(phase, sessionWords.length, flashIdx, fbIdx);

  // ── Phase: Flashcard ────────────────────────────────────────────────────────
  const handleFlashGotIt = useCallback(() => {
    if (flashIdx + 1 >= flashQueue.length) {
      // All cards cleared — move to matching
      setPhase({ name: 'pre_matching' });
      setTimeout(() => setPhase({ name: 'matching', batchIndex: 0 }), 50);
    } else {
      setFlashIdx(i => i + 1);
    }
  }, [flashIdx, flashQueue.length]);

  const handleFlashSeeAgain = useCallback(() => {
    // Re-append to queue so user sees it again at the end
    setFlashQueue(q => [...q, q[flashIdx]]);
    if (flashIdx + 1 >= flashQueue.length) {
      setFlashIdx(i => i + 1);
    } else {
      setFlashIdx(i => i + 1);
    }
  }, [flashIdx, flashQueue.length]);

  // ── Phase: Matching ─────────────────────────────────────────────────────────
  const handleMatchBatchComplete = useCallback(() => {
    if (phase.name !== 'matching') return;
    const next = phase.batchIndex + 1;
    if (next >= matchBatches.length) {
      setPhase({ name: 'pre_fillblank' });
      setTimeout(() => setPhase({ name: 'fillblank', wordIndex: 0 }), 50);
    } else {
      setPhase({ name: 'matching', batchIndex: next });
    }
  }, [phase, matchBatches.length]);

  // ── Phase: Fill-in-blank ────────────────────────────────────────────────────
  const handleFbNext = useCallback(() => {
    const nextIdx = fbIdx + 1;
    // Mark word as learned when completing its fill-blank card
    markLearned(sessionWords[fbIdx].id);
    if (nextIdx >= sessionWords.length) {
      setPhase({ name: 'complete' });
    } else {
      setFbIdx(nextIdx);
      setPhase({ name: 'fillblank', wordIndex: nextIdx });
    }
  }, [fbIdx, sessionWords, markLearned]);

  // ── Restart session ─────────────────────────────────────────────────────────
  // Re-build by navigating away and back (forces state to re-init)
  const handlePlayAgain = useCallback(() => {
    navigate('/home');
    setTimeout(() => navigate('/learn'), 50);
  }, [navigate]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase.name === 'complete') {
    return (
      <SessionComplete
        wordsCompleted={sessionWords.length}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionProgressBar
        progressPct={progressPct}
        phase={phase.name}
        onExit={() => navigate('/home')}
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── Phase 1: Flashcards ─────────────────────────────── */}
          {phase.name === 'flashcard' && flashQueue[flashIdx] && (
            <FlashcardPhase
              key={`flash-${flashQueue[flashIdx].id}-${flashIdx}`}
              word={flashQueue[flashIdx]}
              wordIndex={flashIdx}
              totalInQueue={flashQueue.length}
              onGotIt={handleFlashGotIt}
              onSeeAgain={handleFlashSeeAgain}
            />
          )}

          {/* ── Phase 2: Matching ───────────────────────────────── */}
          {phase.name === 'matching' && matchBatches[phase.batchIndex] && (
            <MatchingPhase
              key={`match-${phase.batchIndex}`}
              batch={matchBatches[phase.batchIndex]}
              batchIndex={phase.batchIndex}
              totalBatches={matchBatches.length}
              onComplete={handleMatchBatchComplete}
            />
          )}

          {/* ── Phase 3: Fill-in-blank ──────────────────────────── */}
          {phase.name === 'fillblank' && sessionWords[phase.wordIndex] && (
            <FillBlankPhase
              key={`fb-${sessionWords[phase.wordIndex].id}`}
              word={sessionWords[phase.wordIndex]}
              allSessionWords={sessionWords}
              wordIndex={phase.wordIndex}
              total={sessionWords.length}
              onNext={handleFbNext}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
