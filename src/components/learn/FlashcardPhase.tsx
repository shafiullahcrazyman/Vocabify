import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, Check, RotateCcw } from 'lucide-react';
import { WordFamily } from '../../types';
import { getValidForms, getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { useTTS } from '../../hooks/useTTS';

interface Props {
  word: WordFamily;
  wordIndex: number;
  totalInQueue: number;
  onGotIt: () => void;
  onSeeAgain: () => void;
}

export const FlashcardPhase: React.FC<Props> = ({
  word,
  wordIndex,
  totalInQueue,
  onGotIt,
  onSeeAgain,
}) => {
  const { settings } = useAppContext();
  const { speak, isPlaying, playingText } = useTTS();

  const forms = getValidForms(word);
  const primaryForm = getPrimaryForm(word);
  const isExamplePlaying = isPlaying && playingText === word.example;

  const titleSize =
    primaryForm.length <= 9
      ? 'text-[40px]'
      : primaryForm.length <= 14
      ? 'text-[32px]'
      : 'text-[26px]';

  useEffect(() => {
    if (settings.autoPronounce && forms.length > 0) {
      const timer = setTimeout(() => {
        window.speechSynthesis.cancel();
        forms.forEach(({ form }) => {
          const u = new SpeechSynthesisUtterance(form);
          u.lang = 'en-GB';
          window.speechSynthesis.speak(u);
        });
      }, 500);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    }
  }, [word.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8 flex flex-col gap-4"
    >
      {/* Subtitle */}
      <div className="text-center pt-2">
        <span className="m3-label-medium text-on-surface-variant uppercase tracking-widest">
          Flashcard · {wordIndex + 1} of {totalInQueue}
        </span>
      </div>

      {/* Main card */}
      <div className="bg-surface-container rounded-[28px] p-6">
        {/* Large word */}
        <p
          className={`${titleSize} font-bold text-on-surface leading-tight mb-4`}
          style={{ fontVariationSettings: '"wdth" 100' }}
        >
          {primaryForm}
        </p>

        {/* POS chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {forms.map(({ form, pos }) => (
            <span
              key={pos}
              className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container m3-label-medium"
            >
              {pos}: {form}
            </span>
          ))}
        </div>

        {/* Bengali meaning */}
        <div className="bg-surface-container-high rounded-[20px] p-4 mb-3">
          <p className="m3-label-small text-primary uppercase tracking-wide font-bold mb-1">
            Bengali Meaning
          </p>
          <p className="m3-title-large text-on-surface">{word.meaning_bn}</p>
        </div>

        {/* Example sentence */}
        <div className="bg-surface-container-high rounded-[20px] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="m3-label-small text-primary uppercase tracking-wide font-bold">
              Example
            </p>
            <button
              onClick={() => speak(word.example)}
              aria-label="Read example sentence aloud"
              className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                isExamplePlaying
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="m3-body-medium text-on-surface-variant italic leading-relaxed">
            {word.example}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            onSeeAgain();
          }}
          aria-label="Show this word again later"
          className="flex items-center justify-center gap-2 py-4 rounded-full bg-surface-container-high text-on-surface m3-label-large active:scale-95 transition-transform duration-100"
        >
          <RotateCcw className="w-4 h-4" />
          See Again
        </button>
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onGotIt();
          }}
          aria-label="I know this word, move to next"
          className="flex items-center justify-center gap-2 py-4 rounded-full bg-primary text-on-primary m3-label-large active:scale-95 transition-transform duration-100"
        >
          <Check className="w-4 h-4" />
          Got it!
        </button>
      </div>
    </motion.div>
  );
};
