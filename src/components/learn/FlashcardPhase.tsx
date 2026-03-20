import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, RotateCcw, Volume2 } from 'lucide-react';
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
  const { speak, isPlaying, playingText } = useTTS();
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
      className="px-4 pb-8 flex flex-col gap-4"
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
                className={`flex items-center justify-between px-4 py-3 ${
                  isNone
                    ? 'bg-surface-container-highest/40 text-on-surface-variant/30'
                    : POS_STYLES[pos]
                } ${rowRounding(i, posRows.length)} ${
                  i < posRows.length - 1 ? 'mb-[2px]' : ''
                }`}
              >
                <span className="text-[12px] font-bold uppercase tracking-wide opacity-60">
                  {label}
                </span>
                <span className={`text-[15px] font-bold capitalize text-on-surface ${isNone ? 'italic opacity-40' : ''}`}>
                  {isNone ? 'None' : form}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bengali meaning — top of bottom group */}
        <div className="bg-surface-container-high rounded-t-[20px] rounded-b-[4px] p-4 mb-[2px]">
          <div className="flex items-center justify-between mb-1">
            <p className="m3-label-small text-primary uppercase tracking-wide font-bold">
              Bengali Meaning
            </p>
            <button
              onClick={() => speak(word.meaning_bn)}
              aria-label="Hear Bengali meaning"
              className={`p-1.5 rounded-full transition-colors active:scale-90 ${
                isBnPlaying
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="m3-title-large text-on-surface">{word.meaning_bn}</p>
        </div>

        {/* Example — bottom of group */}
        <div className="bg-surface-container-high rounded-t-[4px] rounded-b-[20px] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="m3-label-small text-primary uppercase tracking-wide font-bold">
              Example
            </p>
            <button
              onClick={() => speak(word.example)}
              aria-label="Hear example sentence"
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
