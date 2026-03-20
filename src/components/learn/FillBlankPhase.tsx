import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { WordFamily } from '../../types';
import { buildMultiFillBlank, MultiFillBlankData, getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  word: WordFamily;
  allSessionWords: WordFamily[];
  wordIndex: number;
  total: number;
  onNext: () => void;
}

// POS label colors — same palette as rest of app
const POS_COLOR: Record<string, string> = {
  Noun: 'text-blue-500 dark:text-blue-300',
  Verb: 'text-emerald-500 dark:text-emerald-300',
  Adj:  'text-amber-500 dark:text-amber-300',
  Adv:  'text-purple-500 dark:text-purple-300',
};

// ── Sentence renderer ──────────────────────────────────────────────────────────
// Splits the sentence on '______' and renders each blank slot with state styling.
const SentenceDisplay: React.FC<{
  sentence: string;
  blanks: MultiFillBlankData['blanks'];
  answers: (string | null)[];  // per-blank answered value (null = not yet)
  currentIdx: number;
}> = ({ sentence, blanks, answers, currentIdx }) => {
  const parts = sentence.split('______');

  return (
    <p className="m3-body-large text-on-surface leading-relaxed">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < blanks.length && (
            <span
              className={`inline-flex items-center mx-1 px-2 py-0.5 rounded-lg border-b-2 font-bold transition-all duration-300 ${
                answers[i] !== null
                  ? 'border-primary bg-primary/20 text-primary'
                  : i === currentIdx
                  ? 'border-primary text-primary bg-primary/5 animate-pulse'
                  : 'border-outline/30 text-on-surface-variant/40 bg-surface-container'
              }`}
            >
              {answers[i] !== null ? blanks[i].answer : '______'}
            </span>
          )}
        </React.Fragment>
      ))}
    </p>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export const FillBlankPhase: React.FC<Props> = ({
  word,
  allSessionWords,
  wordIndex,
  total,
  onNext,
}) => {
  const { settings } = useAppContext();

  const [fillData] = useState<MultiFillBlankData | null>(() =>
    buildMultiFillBlank(word, allSessionWords)
  );

  // Which blank the user is currently answering
  const [currentBlank, setCurrentBlank] = useState(0);
  // Per-blank answers: null = unanswered
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    fillData ? fillData.blanks.map(() => null) : []
  );
  // Currently selected wrong option (for brief red flash)
  const [wrongOption, setWrongOption] = useState<string | null>(null);

  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // ── Fallback ────────────────────────────────────────────────────────────────
  if (!fillData || fillData.blanks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        className="px-4 pb-8 flex flex-col items-center gap-5 pt-4"
      >
        <div className="bg-surface-container rounded-[28px] p-6 w-full">
          <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-3">
            Review
          </p>
          <p className="m3-headline-small text-on-surface mb-2">{getPrimaryForm(word)}</p>
          <p className="m3-body-large text-on-surface-variant">{word.meaning_bn}</p>
        </div>
        <button
          onClick={onNext}
          className="w-full py-4 bg-primary text-on-primary rounded-full m3-label-large active:scale-95 transition-transform duration-100"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  const blank = fillData.blanks[currentBlank];
  const isLastBlank = currentBlank === fillData.blanks.length - 1;
  const currentAnswer = answers[currentBlank];
  const isAnswered = currentAnswer !== null;

  const handleSelect = (option: string) => {
    if (isAnswered) return;

    const correct = option === blank.answer;
    triggerHaptic(settings.hapticsEnabled, correct ? 'success' : 'error');

    if (correct) {
      // Mark this blank answered
      setAnswers(prev => prev.map((a, i) => i === currentBlank ? option : a));
      const delay = isLastBlank ? 1400 : 900;
      advanceTimer.current = setTimeout(() => {
        if (isLastBlank) {
          onNext();
        } else {
          setCurrentBlank(b => b + 1);
        }
      }, delay);
    } else {
      // Flash wrong briefly then clear
      setWrongOption(option);
      setTimeout(() => setWrongOption(null), 800);
    }
  };

  const optionClass = (option: string): string => {
    const base = 'py-4 px-3 rounded-[18px] text-center font-semibold min-h-[68px] flex items-center justify-center transition-all duration-150 active:scale-95 text-[16px] leading-tight';

    // After correct answer is given
    if (isAnswered) {
      if (option === blank.answer) return `${base} bg-primary/20 text-primary`;
      return `${base} bg-surface-container text-on-surface/30`;
    }

    // Wrong flash
    if (wrongOption === option) return `${base} bg-error/20 text-error`;

    return `${base} bg-surface-container-high text-on-surface`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pt-4 pb-8"
    >
      {/* Blank progress dots */}
      {fillData.blanks.length > 1 && (
        <div className="flex justify-center gap-2 pt-3 mb-4">
          {fillData.blanks.map((b, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                answers[i] !== null ? 'w-5 bg-primary' :
                i === currentBlank    ? 'w-7 bg-primary/60' :
                                        'w-3 bg-on-surface/15'
              }`}
            />
          ))}
        </div>
      )}

      {/* Sentence card */}
      <div className="bg-surface-container rounded-[28px] p-5 mb-4">
        {/* Header: label + current POS */}
        <div className="flex items-center justify-between mb-3">
          <p className="m3-label-medium text-primary uppercase tracking-wider font-bold">
            Complete the sentence
          </p>
          <span className={`m3-label-medium font-bold ${POS_COLOR[blank.pos] ?? 'text-on-surface-variant'}`}>
            {blank.pos} {fillData.blanks.length > 1 ? `· ${currentBlank + 1}/${fillData.blanks.length}` : ''}
          </span>
        </div>

        {/* Sentence with all blanks */}
        <SentenceDisplay
          sentence={fillData.sentence}
          blanks={fillData.blanks}
          answers={answers}
          currentIdx={currentBlank}
        />

        {/* Feedback for current blank */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex items-center gap-2 text-primary"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="m3-body-medium font-medium">
                {isLastBlank ? 'All blanks filled!' : 'Correct! Next blank →'}
              </span>
            </motion.div>
          )}
          {wrongOption && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex items-center gap-2 text-error"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span className="m3-body-medium font-medium">
                Try again — the answer is the {blank.pos.toLowerCase()} form
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2×2 options for current blank */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlank}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-2 gap-4"
        >
          {blank.options.map(option => (
            <motion.button
              key={option}
              onClick={() => handleSelect(option)}
              whileTap={!isAnswered ? { scale: 0.95 } : {}}
              disabled={isAnswered}
              className={optionClass(option)}
              aria-label={`Answer: ${option}`}
            >
              {option}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
