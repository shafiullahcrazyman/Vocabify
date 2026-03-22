import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, RotateCcw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { WordFamily } from '../../types';
import { getValidForms, getPrimaryForm } from '../../utils/sessionAlgorithm';
import { useAppContext } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  word: WordFamily;
  onGotIt: () => void;
  onSeeAgain: () => void;
}

const POS_STYLES: Record<string, string> = {
  Noun: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Verb: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Adj:  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Adv:  'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

const prepareBnSpeech = (text: string): string =>
  text.replace(/ \/ /g, ' বা ');

function rowRounding(index: number, total: number): string {
  if (total === 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
}

function getTitleBaseSize(len: number): number {
  if (len <= 7)  return 44;
  if (len <= 10) return 38;
  if (len <= 14) return 30;
  if (len <= 18) return 24;
  return 20;
}

export const FlashcardPhase: React.FC<Props> = ({ word, onGotIt, onSeeAgain }) => {
  const { settings } = useAppContext();
  const { toggle, isPlaying, playingText } = useTTS();
  const bnSpeechText     = prepareBnSpeech(word.meaning_bn);
  const isBnPlaying      = isPlaying && playingText === bnSpeechText;
  const isExamplePlaying = isPlaying && playingText === word.example;

  const forms      = getValidForms(word);
  const primaryForm = getPrimaryForm(word);

  const outerRef   = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLParagraphElement>(null);
  const exampleRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const outer   = outerRef.current;
    const buttons = buttonsRef.current;
    const card    = cardRef.current;
    const title   = titleRef.current;
    const example = exampleRef.current;
    if (!outer || !buttons || !card || !title || !example) return;

    const fit = () => {
      // --- Reset both elements to their natural base sizes ---
      const baseTitle = getTitleBaseSize(primaryForm.length);
      title.style.fontSize   = `${baseTitle}px`;
      title.style.whiteSpace = 'nowrap';
      example.style.fontSize = '16px';

      // --- Step 1: fit title on ONE line (width-based) ---
      let tSize = baseTitle;
      while (title.scrollWidth > title.offsetWidth && tSize > 10) {
        tSize -= 1;
        title.style.fontSize = `${tSize}px`;
      }
      if (title.scrollWidth > title.offsetWidth) {
        title.style.whiteSpace = 'normal'; // last resort: allow wrap
      }

      // --- Step 2: available height = outer - buttons - spacing ---
      // pt-4 (16) above card + gap (20) between card and buttons + pb-8 (32) below buttons
      const availH = outer.clientHeight - buttons.offsetHeight - (16 + 20 + 32);

      // --- Step 3: coordinated shrink loop ---
      // shrink title first (to 12px min), then example (to 10px min)
      const T_MIN = 12;
      const E_MIN = 10;
      let eSize = 16;

      while (card.scrollHeight > availH) {
        let shrank = false;
        if (tSize > T_MIN) {
          tSize -= 1;
          title.style.fontSize = `${tSize}px`;
          shrank = true;
        }
        if (card.scrollHeight > availH && eSize > E_MIN) {
          eSize -= 0.5;
          example.style.fontSize = `${eSize}px`;
          shrank = true;
        }
        if (!shrank) break;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [word.id, primaryForm]);

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
  }, [word.id, settings.autoPronounce]);

  const posRows: { pos: string; label: string; form: string | null }[] = [
    { pos: 'Noun', label: 'Noun',      form: (word.noun      && word.noun      !== 'x') ? word.noun      : null },
    { pos: 'Verb', label: 'Verb',      form: (word.verb      && word.verb      !== 'x') ? word.verb      : null },
    { pos: 'Adj',  label: 'Adjective', form: (word.adjective && word.adjective !== 'x') ? word.adjective : null },
    { pos: 'Adv',  label: 'Adverb',    form: (word.adverb    && word.adverb    !== 'x') ? word.adverb    : null },
  ];

  return (
    <motion.div
      ref={outerRef}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Card area — fills all space above the buttons */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pt-4">
        <div ref={cardRef} className="bg-surface-container rounded-[28px] p-6">

          {/* Title word */}
          <p
            ref={titleRef}
            onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(primaryForm, 'en'); }}
            className={`font-bold leading-tight mb-5 cursor-pointer select-none transition-colors duration-200 overflow-hidden ${
              isPlaying && playingText === primaryForm
                ? 'text-primary underline underline-offset-4 decoration-primary/60 opacity-80'
                : 'text-on-surface'
            }`}
            style={{ fontVariationSettings: '"wdth" 100' }}
          >
            {primaryForm}
          </p>

          {/* POS rows */}
          <div className="flex flex-col mb-5">
            {posRows.map(({ pos, label, form }, i) => {
              const isNone = form === null;
              return (
                <div
                  key={pos}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    isNone ? 'bg-surface-container-highest/60' : POS_STYLES[pos]
                  } ${rowRounding(i, posRows.length)} ${i < posRows.length - 1 ? 'mb-[2px]' : ''}`}
                >
                  <span className={`m3-label-medium uppercase tracking-wider ${isNone ? 'text-on-surface-variant/50' : ''}`}>
                    {label}
                  </span>
                  <span className={`text-[20px] font-bold capitalize ${isNone ? 'text-on-surface-variant/50' : 'text-on-surface'}`}>
                    {isNone ? 'None' : form}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bengali meaning */}
          <div className="bg-surface-container-high rounded-t-[20px] rounded-b-[4px] p-4 mb-[2px]">
            <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">Meaning</p>
            <p
              onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(bnSpeechText, 'bn'); }}
              className={`m3-title-large cursor-pointer select-none transition-all duration-200 ${
                isBnPlaying
                  ? 'text-primary underline underline-offset-4 decoration-primary/60 opacity-80'
                  : 'text-on-surface'
              }`}
            >
              {word.meaning_bn}
            </p>
          </div>

          {/* Example */}
          <div className="bg-surface-container-high rounded-t-[4px] rounded-b-[20px] p-4">
            <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">Example</p>
            <p
              ref={exampleRef}
              onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(word.example, 'en'); }}
              className={`italic leading-relaxed cursor-pointer select-none transition-colors duration-200 ${
                isExamplePlaying
                  ? 'text-on-surface underline underline-offset-4 decoration-on-surface/40 opacity-75'
                  : 'text-on-surface-variant'
              }`}
            >
              {word.example}
            </p>
          </div>

        </div>
      </div>

      {/* Buttons — always pinned at bottom, never shrink */}
      <div ref={buttonsRef} className="flex-shrink-0 grid grid-cols-2 gap-4 px-4 pt-5 pb-8">
        <button
          onClick={() => { triggerHaptic(settings.hapticsEnabled, 'tap'); onSeeAgain(); }}
          aria-label="Show this word again later"
          className="flex items-center justify-center gap-2 py-5 rounded-full bg-surface-container-high text-on-surface m3-title-small active:scale-95 transition-transform duration-100"
        >
          <RotateCcw className="w-6 h-6" />
          See Again
        </button>
        <button
          onClick={() => { triggerHaptic(settings.hapticsEnabled, 'success'); onGotIt(); }}
          aria-label="I know this word"
          className="flex items-center justify-center gap-2 py-5 rounded-full bg-primary text-on-primary m3-title-small active:scale-95 transition-transform duration-100"
        >
          <Check className="w-6 h-6" />
          Got it!
        </button>
      </div>

    </motion.div>
  );
};
