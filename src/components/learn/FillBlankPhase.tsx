import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { WordFamily } from '../../types';
import { buildFillBlank, FillBlankData, getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  word: WordFamily;
  allSessionWords: WordFamily[];
  wordIndex: number;
  total: number;
  onNext: () => void;
}

export const FillBlankPhase: React.FC<Props> = ({
  word,
  allSessionWords,
  wordIndex,
  total,
  onNext,
}) => {
  const { settings } = useAppContext();

  // Build once on mount for this word
  const [fillData] = useState<FillBlankData | null>(() =>
    buildFillBlank(word, allSessionWords)
  );

  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected !== null ? selected === fillData?.blank : null;

  // Keep a ref to the auto-advance timer so we can clean it up
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // ── Fallback when no blank can be created ──────────────────────────────────
  if (!fillData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        className="px-4 pb-8 flex flex-col items-center gap-5 pt-4"
      >
        <div className="text-center">
          <span className="m3-label-medium text-on-surface-variant uppercase tracking-widest">
            Word Review · {wordIndex + 1} of {total}
          </span>
        </div>

        <div className="bg-surface-container rounded-[28px] p-6 w-full">
          <p className="m3-label-small text-primary uppercase tracking-wide font-bold mb-3">
            Review
          </p>
          <p className="m3-headline-small text-on-surface mb-2">{getPrimaryForm(word)}</p>
          <p className="m3-body-large text-on-surface-variant">{word.meaning_bn}</p>
        </div>

        <button
          onClick={onNext}
          aria-label="Continue to next word"
          className="w-full py-4 bg-primary text-on-primary rounded-full m3-label-large active:scale-95 transition-transform duration-100"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  const handleSelect = (option: string) => {
    if (selected !== null) return;
    triggerHaptic(settings.hapticsEnabled, option === fillData.blank ? 'success' : 'error');
    setSelected(option);
    const delay = option === fillData.blank ? 1300 : 1900;
    advanceTimer.current = setTimeout(onNext, delay);
  };

  // Split sentence around the blank marker
  const parts = fillData.sentence.split('______');

  const optionClass = (option: string): string => {
    const base =
      'p-4 rounded-[16px] border-2 text-center m3-body-medium font-medium min-h-[56px] flex items-center justify-center transition-colors duration-150';
    if (selected === null)
      return `${base} bg-surface-container-high border-outline/10 text-on-surface active:scale-95`;
    if (option === fillData.blank)
      return `${base} bg-primary/20 border-primary text-primary`;
    if (option === selected)
      return `${base} bg-error/20 border-error text-error`;
    return `${base} bg-surface-container-high border-outline/10 text-on-surface opacity-40`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8"
    >
      <div className="text-center mb-5 pt-2">
        <span className="m3-label-medium text-on-surface-variant uppercase tracking-widest">
          Fill in · {wordIndex + 1} of {total}
        </span>
      </div>

      {/* Sentence card */}
      <div className="bg-surface-container rounded-[28px] p-6 mb-5">
        <p className="m3-label-small text-primary uppercase tracking-wide font-bold mb-3">
          Complete the sentence
        </p>

        <p className="m3-body-large text-on-surface leading-relaxed">
          {parts[0]}
          <span
            className={`inline-block mx-1 px-2 py-0.5 rounded-lg border-b-2 font-bold transition-colors duration-300 ${
              isCorrect === null
                ? 'border-primary text-primary bg-primary/5'
                : isCorrect
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-error bg-error/20 text-error'
            }`}
          >
            {selected !== null ? fillData.blank : '______'}
          </span>
          {parts[1]}
        </p>

        <AnimatePresence>
          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`mt-4 flex items-center gap-2 ${isCorrect ? 'text-primary' : 'text-error'}`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="m3-body-medium font-medium">Correct! Well done!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span className="m3-body-medium font-medium">
                    Answer: <strong>{fillData.blank}</strong>
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2×2 option grid */}
      <div className="grid grid-cols-2 gap-3">
        {fillData.options.map(option => (
          <motion.button
            key={option}
            onClick={() => handleSelect(option)}
            whileTap={selected === null ? { scale: 0.96 } : {}}
            disabled={selected !== null}
            className={optionClass(option)}
            aria-label={`Answer option: ${option}`}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
