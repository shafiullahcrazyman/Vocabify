import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { WordFamily } from '../types';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Volume2, Info, Check, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { slowSpatial, slowEffects, exitCurveSlow, fastSpatial } from '../utils/motion';
import { TipsOverlay } from './TipsOverlay';
import { useTTS } from '../hooks/useTTS';
import { useBackButton } from '../hooks/useBackButton';

interface WordOverlayProps {
  word: WordFamily;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const getValidWord = (...words: (string | undefined)[]) => {
  for (const w of words) {
    if (w && w.toLowerCase() !== 'x' && w.toLowerCase() !== 'none') return w;
  }
  return 'Unknown';
};

/** Prepare Bengali text for speech — replace ' / ' with ' বা ' so it sounds natural */
const prepareBnSpeech = (text: string): string =>
  text.replace(/ \/ /g, ' বা ');

export const WordOverlay: React.FC<WordOverlayProps> = ({
  word, onClose, onNext, onPrev, hasNext, hasPrev,
}) => {
  const { progress, markLearned, settings, favorites, toggleFavorite } = useAppContext();
  const { speak, toggle, isPlaying, playingText } = useTTS();
  const isLearned = progress.learned.includes(word.id);
  const isFavorite = favorites.includes(word.id);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Derived audio states
  const bnSpeechText     = prepareBnSpeech(word.meaning_bn);
  const isBnPlaying      = isPlaying && playingText === bnSpeechText;
  const isExamplePlaying = isPlaying && playingText === word.example;
  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);

  // Universal back button — always mounted while open
  useBackButton(true, onClose);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  // Auto-pronounce English word forms only (not Bengali meaning or example)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (settings.autoPronounce) {
      const wordsToPronounce: string[] = [];
      if (isValid(word.noun)) wordsToPronounce.push(word.noun!);
      if (isValid(word.verb)) wordsToPronounce.push(word.verb!);
      if (isValid(word.adjective)) wordsToPronounce.push(word.adjective!);
      if (isValid(word.adverb)) wordsToPronounce.push(word.adverb!);
      if (wordsToPronounce.length > 0) {
        timer = setTimeout(() => {
          window.speechSynthesis.cancel();
          wordsToPronounce.forEach((text) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-GB';
            window.speechSynthesis.speak(utterance);
          });
        }, 400);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [word, settings.autoPronounce]);

  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

  const getOverlayTitleSize = (text: string) => {
    const len = text.length;
    if (len <= 9) return 'text-[40px]';
    if (len <= 13) return 'text-[32px] sm:text-[40px]';
    return 'text-[26px] sm:text-[36px]';
  };

  const handleClose = () => { triggerHaptic(settings.hapticsEnabled, 'tap'); onClose(); };

  const handleMarkLearned = () => {
    triggerHaptic(settings.hapticsEnabled, isLearned ? 'tap' : 'success');
    markLearned(word.id);
  };

  const handlePrev = () => {
    if (hasPrev) { triggerHaptic(settings.hapticsEnabled, 'swipe'); onPrev(); }
  };
  const handleNext = () => {
    if (hasNext) { triggerHaptic(settings.hapticsEnabled, 'swipe'); onNext(); }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold && hasNext) handleNext();
    else if (info.offset.x > swipeThreshold && hasPrev) handlePrev();
    else {
      if (Math.abs(info.offset.x) > 20) triggerHaptic(settings.hapticsEnabled, 'impact');
    }
  };

  const anim = settings.animationsEnabled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: anim ? slowEffects : { duration: 0.1 } }}
        exit={{ opacity: 0, transition: anim ? exitCurveSlow : { duration: 0.1 } }}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{
          opacity: 1, scale: 1, y: 0,
          transition: anim ? slowSpatial : { duration: 0.15 },
        }}
        exit={{
          opacity: 0, scale: 0.96, y: 16,
          transition: anim ? exitCurveSlow : { duration: 0.1 },
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="relative bg-surface-container-high w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] rounded-[32px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[88px] border-b border-outline/10 shrink-0">
          <motion.button
            onClick={handleClose}
            whileTap={anim ? { scale: 0.88 } : undefined}
            transition={fastSpatial}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant"
          >
            <X className="w-6 h-6" />
          </motion.button>
          <div className="flex gap-1 sm:gap-2">
            <motion.button
              onClick={() => { triggerHaptic(settings.hapticsEnabled, 'toggle'); toggleFavorite(word.id); }}
              whileTap={anim ? { scale: 0.80 } : undefined}
              animate={
                isFavorite
                  ? { scale: [1, 1.25, 1], transition: { ...fastSpatial, times: [0, 0.4, 1] } }
                  : { scale: 1 }
              }
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-rose-50/50"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
            </motion.button>
            <motion.button
              onClick={() => { triggerHaptic(settings.hapticsEnabled, 'press'); setIsTipsOpen(true); }}
              whileTap={anim ? { scale: 0.88 } : undefined}
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant"
              aria-label="Grammar Tips"
            >
              <Info className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 pointer-events-auto touch-pan-y">
          <div className="text-center mb-10 mt-2">
            {/* Main word */}
            <div className="flex items-center justify-center gap-3 mb-2 px-2">
              <h2 className={`${getOverlayTitleSize(mainWord)} font-bold tracking-tight text-on-surface leading-none capitalize break-words`}>
                {mainWord}
              </h2>
              <motion.button
                onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); speak(mainWord); }}
                whileTap={anim ? { scale: 0.88 } : undefined}
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                  isPlaying && playingText === mainWord
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-primary/20 text-primary bg-primary-container/50'
                }`}
                aria-label="Pronounce word"
              >
                <Volume2 className="w-7 h-7" />
              </motion.button>
            </div>

            {/* Bengali meaning — tap to toggle audio */}
            <motion.p
              onClick={() => {
                triggerHaptic(settings.hapticsEnabled, 'selection');
                toggle(bnSpeechText, 'bn');
              }}
              whileTap={anim ? { scale: 0.97 } : undefined}
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`m3-headline-small text-primary mt-2 cursor-pointer select-none transition-all duration-200 ${
                isBnPlaying
                  ? 'underline underline-offset-4 decoration-primary/60 opacity-80'
                  : 'hover:underline hover:underline-offset-4 hover:decoration-primary/40'
              }`}
              title={isBnPlaying ? 'Click to stop Bengali audio' : 'Click to hear Bengali pronunciation'}
            >
              {word.meaning_bn}
            </motion.p>
          </div>

          <div className="space-y-6 pb-4">
            {/* Word Forms */}
            <div className="bg-surface-container rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-4">Word Forms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Noun',      val: word.noun,      color: 'blue' },
                  { label: 'Verb',      val: word.verb,      color: 'emerald' },
                  { label: 'Adjective', val: word.adjective, color: 'amber' },
                  { label: 'Adverb',    val: word.adverb,    color: 'purple' },
                ].map(({ label, val, color }) => {
                  const valid = isValid(val);
                  const colorMap: Record<string, { bg: string; text: string; btn: string; active: string }> = {
                    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-700 dark:text-blue-300',       btn: 'hover:bg-blue-500/20 text-blue-700 dark:text-blue-300',       active: 'bg-blue-500 text-white' },
                    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', btn: 'hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', active: 'bg-emerald-500 text-white' },
                    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-300',     btn: 'hover:bg-amber-500/20 text-amber-700 dark:text-amber-300',     active: 'bg-amber-500 text-white' },
                    purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-700 dark:text-purple-300',   btn: 'hover:bg-purple-500/20 text-purple-700 dark:text-purple-300',  active: 'bg-purple-500 text-white' },
                  };
                  const c = colorMap[color];
                  const isFormPlaying = isPlaying && playingText === val;
                  return (
                    <div key={label} className={`flex flex-col p-4 rounded-2xl ${valid ? c.bg : 'bg-surface-container-highest/60'}`}>
                      <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${valid ? c.text : 'text-on-surface-variant/50'}`}>{label}</span>
                      <div className="flex items-center justify-between">
                        <span className={`text-[20px] font-semibold capitalize ${valid ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                          {valid ? val : 'None'}
                        </span>
                        {valid && (
                          <motion.button
                            onClick={() => { triggerHaptic(settings.hapticsEnabled, 'selection'); speak(val!); }}
                            whileTap={anim ? { scale: 0.85 } : undefined}
                            transition={fastSpatial}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`p-2 rounded-full transition-colors flex-shrink-0 ${isFormPlaying ? `${c.btn} opacity-70` : c.btn}`}
                          >
                            <Volume2 className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Example sentence — tap to toggle audio */}
            <div className="bg-primary-container/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-2">Example</h4>
              <motion.p
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled, 'selection');
                  toggle(word.example, 'en');
                }}
                whileTap={anim ? { scale: 0.98 } : undefined}
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`m3-body-large text-on-surface italic leading-relaxed cursor-pointer select-none transition-all duration-200 ${
                  isExamplePlaying
                    ? 'underline underline-offset-4 decoration-on-surface/40 opacity-75'
                    : 'hover:underline hover:underline-offset-4 hover:decoration-on-surface/25'
                }`}
                title={isExamplePlaying ? 'Click to stop example audio' : 'Click to hear example'}
              >
                "{word.example}"
              </motion.p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center w-fit ${
                word.level === 'easy'   ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                word.level === 'medium' ? 'bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' :
                                          'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  word.level === 'easy' ? 'bg-emerald-500' : word.level === 'medium' ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                {word.level}
                {word.cefr && <span className="ml-1.5 pl-1.5 border-l border-current/30 uppercase">{word.cefr}</span>}
              </span>
              <span className="text-[12px] text-on-surface-variant/70 font-medium capitalize mt-1">• {word.theme}</span>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-4 h-[88px] border-t border-outline/10 flex justify-between items-center gap-3 bg-surface-container-high shrink-0 z-10">
          <motion.button
            onClick={handlePrev}
            disabled={!hasPrev}
            whileTap={anim && hasPrev ? { scale: 0.88 } : undefined}
            transition={fastSpatial}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-container-highest disabled:opacity-30 text-on-surface"
          >
            <ChevronLeft className="w-7 h-7" />
          </motion.button>

          {/* Mark Learned */}
          <motion.button
            onClick={handleMarkLearned}
            whileTap={anim ? { scale: 0.96 } : undefined}
            animate={
              isLearned
                ? { scale: [1, 1.04, 1], transition: { ...fastSpatial, times: [0, 0.4, 1] } }
                : { scale: 1 }
            }
            transition={fastSpatial}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`flex-1 h-14 flex items-center justify-center rounded-full font-bold tracking-wide ${
              isLearned ? 'bg-emerald-500/15 text-emerald-700' : 'bg-surface-container-highest text-on-surface'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 mr-2 ${isLearned ? 'text-emerald-600' : 'text-on-surface-variant'}`} />
            {isLearned ? 'Learned' : 'Mark Learned'}
          </motion.button>

          {hasNext ? (
            <motion.button
              onClick={handleNext}
              whileTap={anim ? { scale: 0.88 } : undefined}
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface"
            >
              <ChevronRight className="w-7 h-7" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleClose}
              whileTap={anim ? { scale: 0.88 } : undefined}
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <Check className="w-7 h-7" />
            </motion.button>
          )}
        </div>
      </motion.div>

      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </div>
  );
};
