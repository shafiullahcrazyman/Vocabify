import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, RotateCcw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { WordFamily } from '../../types';
import { getValidForms, getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  word: WordFamily;
  wordIndex: number;
  totalInQueue: number;
  onGotIt: () => void;
  onSeeAgain: () => void;
}

// POS colors matching WordCard exactly
const POS_STYLES: Record<string, string> = {
  Noun: 'bg-blue-500/20 text-blue-600 dark:text-blue-300',
  Verb: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  Adj:  'bg-amber-500/20 text-amber-600 dark:text-amber-300',
  Adv:  'bg-purple-500/20 text-purple-600 dark:text-purple-300',
};

// Rounded corners logic: first / middle / last / only
function rowRounding(index: number, total: number): string {
  if (total === 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
}

export const FlashcardPhase: React.FC<Props> = ({
  word,
  wordIndex,
  totalInQueue,
  onGotIt,
  onSeeAgain,
}) => {
  const { settings } = useAppContext();
  const { toggle, isPlaying, playingText } = useTTS();
  const isBnPlaying      = isPlaying && playingText === word.meaning_bn;
  const isExamplePlaying = isPlaying && playingText === word.example;

  const forms = getValidForms(word);
  const primaryForm = getPrimaryForm(word);

  const titleSize =
    primaryForm.length <= 7  ? 'text-[44px]' :
    primaryForm.length <= 10 ? 'text-[38px]' :
    primaryForm.length <= 14 ? 'text-[30px]' :
    primaryForm.length <= 18 ? 'text-[24px]' :
                               'text-[20px]';

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

  // Always show all 4 POS rows — None/x shown in gray
  const posRows: { pos: string; label: string; form: string | null }[] = [
    { pos: 'Noun', label: 'Noun',      form: (word.noun      && word.noun      !== 'x') ? word.noun      : null },
    { pos: 'Verb', label: 'Verb',      form: (word.verb      && word.verb      !== 'x') ? word.verb      : null },
    { pos: 'Adj',  label: 'Adjective', form: (word.adjective && word.adjective !== 'x') ? word.adjective : null },
    { pos: 'Adv',  label: 'Adverb',    form: (word.adverb    && word.adverb    !== 'x') ? word.adverb    : null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pt-4 pb-8 flex flex-col gap-5"
    >
      {/* Main card */}
      <div className="bg-surface-container rounded-[28px] p-6">

        {/* Large primary word */}
        <p
          className={`${titleSize} font-bold text-on-background leading-tight mb-5`}
          style={{ fontVariationSettings: '"wdth" 100' }}
        >
          {primaryForm}
        </p>

        {/* POS rows — grouped list with rounding logic */}
        <div className="flex flex-col mb-5">
          {posRows.map(({ pos, label, form }, i) => {
            const isNone = form === null;
            return (
              <div
                key={pos}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  isNone
                    ? 'bg-surface-container-highest/40 text-on-surface-variant/30'
                    : POS_STYLES[pos]
                } ${rowRounding(i, posRows.length)} ${
                  i < posRows.length - 1 ? 'mb-[2px]' : ''
                }`}
              >
                <span className="text-[13px] font-semibold uppercase tracking-wider opacity-70">
                  {label}
                </span>
                <span className={`text-[17px] font-bold capitalize text-on-surface ${isNone ? 'italic opacity-40' : ''}`}>
                  {isNone ? 'None' : form}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bengali meaning — tap to speak/stop */}
        <div className="bg-surface-container-high rounded-t-[20px] rounded-b-[4px] p-4 mb-[2px]">
          <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">
            Bengali Meaning
          </p>
          <p
            onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(word.meaning_bn, 'bn'); }}
            className={`m3-title-large cursor-pointer select-none transition-all duration-200 ${
              isBnPlaying
                ? 'text-primary underline underline-offset-4 decoration-primary/60 opacity-80'
                : 'text-on-surface'
            }`}
          >
            {word.meaning_bn}
          </p>
        </div>

        {/* Example — tap to speak/stop */}
        <div className="bg-surface-container-high rounded-t-[4px] rounded-b-[20px] p-4">
          <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">
            Example
          </p>
          <p
            onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(word.example, 'en'); }}
            className={`m3-body-large italic leading-relaxed cursor-pointer select-none transition-all duration-200 ${
              isExamplePlaying
                ? 'text-on-surface underline underline-offset-4 decoration-on-surface/40 opacity-75'
                : 'text-on-surface-variant'
            }`}
          >
            {word.example}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'tap');
            onSeeAgain();
          }}
          aria-label="Show this word again later"
          className="flex items-center justify-center gap-2 py-5 rounded-full bg-surface-container-high text-on-surface m3-title-small active:scale-95 transition-transform duration-100"
        >
          <RotateCcw className="w-4 h-4" />
          See Again
        </button>
        <button
          onClick={() => {
            triggerHaptic(settings.hapticsEnabled, 'success');
            onGotIt();
          }}
          aria-label="I know this word"
          className="flex items-center justify-center gap-2 py-5 rounded-full bg-primary text-on-primary m3-title-small active:scale-95 transition-transform duration-100"
        >
          <Check className="w-4 h-4" />
          Got it!
        </button>
      </div>
    </motion.div>
  );
};
