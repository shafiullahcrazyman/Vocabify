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

// POS colors matching WordCard exactly
const POS_STYLES: Record<string, string> = {
  Noun: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Verb: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Adj:  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Adv:  'bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

/** Prepare Bengali text for speech — replace ' / ' with ' বা ' so it sounds natural */
const prepareBnSpeech = (text: string): string =>
  text.replace(/ \/ /g, ' বা ');

// Rounded corners logic: first / middle / last / only
function rowRounding(index: number, total: number): string {
  if (total === 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
}

export const FlashcardPhase: React.FC<Props> = ({
  word,
  onGotIt,
  onSeeAgain,
}) => {
  const { settings } = useAppContext();
  const { toggle, isPlaying, playingText } = useTTS();
  const bnSpeechText     = prepareBnSpeech(word.meaning_bn);
  const isBnPlaying      = isPlaying && playingText === bnSpeechText;
  const isExamplePlaying = isPlaying && playingText === word.example;

  const forms = getValidForms(word);
  const primaryForm = getPrimaryForm(word);

  const wordRef      = useRef<HTMLParagraphElement>(null);
  const exampleRef   = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wordEl    = wordRef.current;
    const exampleEl = exampleRef.current;
    const outer     = containerRef.current;
    const inner     = contentRef.current;
    if (!wordEl || !exampleEl || !outer || !inner) return;

    const apply = () => {
      // ── Step 1: smart-resize the main word to fit on one line ──
      wordEl.style.whiteSpace = 'nowrap';
      const WORD_SIZES = [44, 38, 30, 24, 20, 16, 13];
      let chosenSize = WORD_SIZES[WORD_SIZES.length - 1];
      for (const size of WORD_SIZES) {
        wordEl.style.fontSize = `${size}px`;
        if (wordEl.scrollWidth <= wordEl.clientWidth) {
          chosenSize = size;
          break;
        }
      }
      wordEl.style.fontSize   = `${chosenSize}px`;
      wordEl.style.whiteSpace = '';

      // ── Step 2: smart-resize the example if it's too tall ──
      exampleEl.style.fontSize   = '';
      exampleEl.style.lineHeight = '';
      const MAX_EXAMPLE_H = 120; // ~5 lines
      if (exampleEl.scrollHeight > MAX_EXAMPLE_H) {
        const EXAMPLE_STEPS: [number, string][] = [[13, '20px'], [11, '17px']];
        for (const [size, lh] of EXAMPLE_STEPS) {
          exampleEl.style.fontSize   = `${size}px`;
          exampleEl.style.lineHeight = lh;
          if (exampleEl.scrollHeight <= MAX_EXAMPLE_H) break;
        }
      }

      // ── Step 3: full-card scale as last resort so buttons never leave screen ──
      inner.style.transform = '';
      const avail = outer.clientHeight;
      const full  = inner.scrollHeight;
      if (full > avail) {
        inner.style.transform       = `scale(${avail / full})`;
        inner.style.transformOrigin = 'top center';
      }
    };

    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [word.id]);

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
  // forms is omitted (deterministically derived from word.id).
  }, [word.id, settings.autoPronounce]);

  // Always show all 4 POS rows — None/x shown in gray
  const posRows: { pos: string; label: string; form: string | null }[] = [
    { pos: 'Noun', label: 'Noun',      form: (word.noun      && word.noun      !== 'x') ? word.noun      : null },
    { pos: 'Verb', label: 'Verb',      form: (word.verb      && word.verb      !== 'x') ? word.verb      : null },
    { pos: 'Adj',  label: 'Adjective', form: (word.adjective && word.adjective !== 'x') ? word.adjective : null },
    { pos: 'Adv',  label: 'Adverb',    form: (word.adverb    && word.adverb    !== 'x') ? word.adverb    : null },
  ];

  return (
    // outer: h-full so it takes exactly the available height given by Learn.tsx
    // overflow-hidden clips anything that escapes before scale is applied
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="h-full overflow-hidden"
    >
      <div ref={contentRef} className="px-4 pt-4 pb-8 flex flex-col gap-5">

        {/* Main card */}
        <div className="bg-surface-container rounded-[28px] p-6">

          {/* Large primary word — tap to speak */}
          <p
            ref={wordRef}
            onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(primaryForm, 'en'); }}
            className={`font-bold leading-tight mb-5 cursor-pointer select-none transition-colors duration-200 ${
              isPlaying && playingText === primaryForm
                ? 'text-primary underline underline-offset-4 decoration-primary/60 opacity-80'
                : 'text-on-surface'
            }`}
            style={{ fontSize: '44px', fontVariationSettings: '"wdth" 100' }}
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
                      ? 'bg-surface-container-highest/60'
                      : POS_STYLES[pos]
                  } ${rowRounding(i, posRows.length)} ${
                    i < posRows.length - 1 ? 'mb-[2px]' : ''
                  }`}
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

          {/* Bengali meaning — tap to speak/stop */}
          <div className="bg-surface-container-high rounded-t-[20px] rounded-b-[4px] p-4 mb-[2px]">
            <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">
              Meaning
            </p>
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

          {/* Example — tap to speak/stop */}
          <div className="bg-surface-container-high rounded-t-[4px] rounded-b-[20px] p-4">
            <p className="m3-label-medium text-primary uppercase tracking-wider font-bold mb-1.5">
              Example
            </p>
            <p
              ref={exampleRef}
              onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); toggle(word.example, 'en'); }}
              className={`m3-body-large italic leading-relaxed cursor-pointer select-none transition-colors duration-200 ${
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
            <RotateCcw className="w-6 h-6" />
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
            <Check className="w-6 h-6" />
            Got it!
          </button>
        </div>

      </div>
    </motion.div>
  );
};
