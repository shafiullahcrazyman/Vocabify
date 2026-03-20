import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, RotateCcw } from 'lucide-react';
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
  Noun: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Verb: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Adj:  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Adv:  'bg-purple-500/10 text-purple-700 dark:text-purple-300',
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

  const forms = getValidForms(word);
  const primaryForm = getPrimaryForm(word);

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

  // Build POS rows in fixed order: Noun → Verb → Adj → Adv
  const posRows = [
    word.noun      && word.noun      !== 'x' ? { pos: 'Noun', form: word.noun }      : null,
    word.verb      && word.verb      !== 'x' ? { pos: 'Verb', form: word.verb }      : null,
    word.adjective && word.adjective !== 'x' ? { pos: 'Adj',  form: word.adjective } : null,
    word.adverb    && word.adverb    !== 'x' ? { pos: 'Adv',  form: word.adverb }    : null,
  ].filter(Boolean) as { pos: string; form: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="px-4 pb-8 flex flex-col gap-4"
    >
      {/* Counter */}
      <div className="text-center pt-2">
        <span className="m3-label-medium text-on-surface-variant uppercase tracking-widest">
          Flashcard · {wordIndex + 1} of {totalInQueue}
        </span>
      </div>

      {/* Main card */}
      <div className="bg-surface-container rounded-[28px] p-6">

        {/* Large primary word */}
        <p
          className={`${titleSize} font-bold text-on-surface leading-tight mb-5`}
          style={{ fontVariationSettings: '"wdth" 100' }}
        >
          {primaryForm}
        </p>

        {/* POS rows — grouped list with rounding logic */}
        <div className="flex flex-col mb-5">
          {posRows.map(({ pos, form }, i) => (
            <div
              key={pos}
              className={`flex items-center justify-between px-4 py-3 ${POS_STYLES[pos]} ${rowRounding(i, posRows.length)} ${
                i < posRows.length - 1 ? 'mb-[2px]' : ''
              }`}
            >
              <span className="text-[12px] font-bold uppercase tracking-wide opacity-60">
                {pos === 'Adj' ? 'Adjective' : pos === 'Adv' ? 'Adverb' : pos}
              </span>
              <span className="text-[15px] font-bold capitalize">{form}</span>
            </div>
          ))}
        </div>

        {/* Bengali meaning — top of bottom group */}
        <div className="bg-surface-container-high rounded-t-[20px] rounded-b-[4px] p-4 mb-[2px]">
          <p className="m3-label-small text-primary uppercase tracking-wide font-bold mb-1">
            Bengali Meaning
          </p>
          <p className="m3-title-large text-on-surface">{word.meaning_bn}</p>
        </div>

        {/* Example — bottom of group, no speech button */}
        <div className="bg-surface-container-high rounded-t-[4px] rounded-b-[20px] p-4">
          <p className="m3-label-small text-primary uppercase tracking-wide font-bold mb-2">
            Example
          </p>
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
          aria-label="I know this word"
          className="flex items-center justify-center gap-2 py-4 rounded-full bg-primary text-on-primary m3-label-large active:scale-95 transition-transform duration-100"
        >
          <Check className="w-4 h-4" />
          Got it!
        </button>
      </div>
    </motion.div>
  );
};
