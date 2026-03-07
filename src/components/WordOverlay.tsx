import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { WordFamily } from '../types';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Volume2, Info, Check, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { TipsOverlay } from './TipsOverlay';
import { useTTS } from '../hooks/useTTS';

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

export const WordOverlay: React.FC<WordOverlayProps> = ({
  word,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const { progress, markLearned, settings, favorites, toggleFavorite } = useAppContext();
  const { speak, isPlaying } = useTTS();
  const isLearned = progress.learned.includes(word.id);
  const isFavorite = favorites.includes(word.id);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Prevent Tour from starting because a word is actively selected
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

  useEffect(() => {
    if (settings.autoPronounce) {
      const wordsToPronounce: string[] = [];
      if (isValid(word.noun)) wordsToPronounce.push(word.noun!);
      if (isValid(word.verb)) wordsToPronounce.push(word.verb!);
      if (isValid(word.adjective)) wordsToPronounce.push(word.adjective!);
      if (isValid(word.adverb)) wordsToPronounce.push(word.adverb!);

      if (wordsToPronounce.length > 0) {
        window.speechSynthesis.cancel();
        wordsToPronounce.forEach((text) => {
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
            || voices.find(v => v.lang === 'en-GB');
          if (ukFemale) utterance.voice = ukFemale;
          else utterance.lang = 'en-GB';
          window.speechSynthesis.speak(utterance);
        });
      }
    }
    return () => window.speechSynthesis.cancel();
  }, [word, settings.autoPronounce]);

  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';
  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);

  const getOverlayTitleSize = (text: string) => {
    const len = text.length;
    if (len <= 9) return 'text-[40px]';
    if (len <= 13) return 'text-[32px] sm:text-[40px]';
    return 'text-[26px] sm:text-[36px]';
  };

  const handleClose = () => { triggerHaptic(settings.hapticsEnabled); onClose(); };
  const handleMarkLearned = () => { triggerHaptic(settings.hapticsEnabled); markLearned(word.id); };
  
  const handlePrev = () => { 
    if (hasPrev) {
      triggerHaptic(settings.hapticsEnabled); 
      onPrev(); 
    }
  };
  
  const handleNext = () => { 
    if (hasNext) {
      triggerHaptic(settings.hapticsEnabled); 
      onNext(); 
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold && hasNext) {
      handleNext();
    } else if (info.offset.x > swipeThreshold && hasPrev) {
      handlePrev();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={settings.animationsEnabled ? { duration: 0.2 } : { duration: 0.1, ease: "easeOut" }}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={settings.animationsEnabled ? { type: 'spring', damping: 25, stiffness: 300 } : { duration: 0.15, ease: "easeOut" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragDirectionLock={true}
        onDragEnd={handleDragEnd}
        className="relative bg-surface w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 h-[88px] border-b border-outline/10 shrink-0">
          <button onClick={handleClose} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90">
            <X className="w-6 h-6" />
          </button>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => { triggerHaptic(settings.hapticsEnabled); toggleFavorite(word.id); }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-rose-50/50 transition-colors active:scale-90"
            >
              <Heart className={`w-6 h-6 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
            </button>
            <button
              onClick={() => { triggerHaptic(settings.hapticsEnabled); setIsTipsOpen(true); }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant text-primary transition-all duration-200 active:scale-90"
              aria-label="Grammar Tips"
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pointer-events-auto touch-pan-y">
          <div className="text-center mb-10 mt-2">
            <div className="flex items-center justify-center gap-3 mb-2 px-2">
              <h2 className={`${getOverlayTitleSize(mainWord)} font-bold tracking-tight text-on-surface leading-none capitalize break-words`}>
                {mainWord}
              </h2>
              <button
                onClick={() => speak(mainWord)}
                className={`p-3 rounded-full transition-all duration-200 active:scale-90 flex-shrink-0 ${isPlaying ? 'bg-primary text-on-primary scale-110' : 'hover:bg-primary/20 text-primary bg-primary-container/50'}`}
                aria-label="Pronounce word"
              >
                <Volume2 className={`w-7 h-7 ${isPlaying ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <p className="m3-headline-small text-primary mt-2">{word.meaning_bn}</p>
          </div>

          <div className="space-y-6 pb-4">
            <div className="bg-surface-variant/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-4">Word Forms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.noun) ? 'bg-blue-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.noun) ? 'text-blue-700 dark:text-blue-300' : 'text-on-surface-variant/50'}`}>Noun</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold capitalize ${isValid(word.noun) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.noun) ? word.noun : 'None'}</span>
                    {isValid(word.noun) && (
                      <button onClick={() => speak(word.noun!)} className="p-2 rounded-full hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 transition-all duration-200 active:scale-90 flex-shrink-0">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.verb) ? 'bg-emerald-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.verb) ? 'text-emerald-700 dark:text-emerald-300' : 'text-on-surface-variant/50'}`}>Verb</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold capitalize ${isValid(word.verb) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.verb) ? word.verb : 'None'}</span>
                    {isValid(word.verb) && (
                      <button onClick={() => speak(word.verb!)} className="p-2 rounded-full hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all duration-200 active:scale-90 flex-shrink-0">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adjective) ? 'bg-amber-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.adjective) ? 'text-amber-700 dark:text-amber-300' : 'text-on-surface-variant/50'}`}>Adjective</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold capitalize ${isValid(word.adjective) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.adjective) ? word.adjective : 'None'}</span>
                    {isValid(word.adjective) && (
                      <button onClick={() => speak(word.adjective!)} className="p-2 rounded-full hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-all duration-200 active:scale-90 flex-shrink-0">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adverb) ? 'bg-purple-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.adverb) ? 'text-purple-700 dark:text-purple-300' : 'text-on-surface-variant/50'}`}>Adverb</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold capitalize ${isValid(word.adverb) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.adverb) ? word.adverb : 'None'}</span>
                    {isValid(word.adverb) && (
                      <button onClick={() => speak(word.adverb!)} className="p-2 rounded-full hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition-all duration-200 active:scale-90 flex-shrink-0">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-container/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-2">Example</h4>
              <p className="m3-body-large text-on-surface italic leading-relaxed">"{word.example}"</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center w-fit ${
                word.level === 'easy' ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                word.level === 'medium' ? 'bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' :
                'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  word.level === 'easy' ? 'bg-emerald-500' :
                  word.level === 'medium' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}></span>
                {word.level}
                
                {word.cefr && (
                  <span className={`ml-1.5 pl-1.5 border-l uppercase ${
                    word.level === 'easy' ? 'border-emerald-500/30' :
                    word.level === 'medium' ? 'border-orange-500/30' :
                    'border-red-500/30'
                  }`}>
                    {word.cefr}
                  </span>
                )}
              </span>
              
              <span className="text-[12px] text-on-surface-variant/70 font-medium capitalize mt-1">
                • {word.theme}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 h-[88px] border-t border-outline/10 flex justify-between items-center gap-3 sm:gap-4 bg-surface shrink-0 z-10">
          <button 
            onClick={handlePrev} 
            disabled={!hasPrev} 
            className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed text-on-surface transition-all duration-200 active:scale-90 shrink-0"
            aria-label="Previous Word"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <button 
            onClick={handleMarkLearned} 
            className={`flex-1 h-14 flex items-center justify-center rounded-full transition-all duration-300 active:scale-[0.98] font-bold tracking-wide text-[16px] ${
              isLearned 
                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                : 'bg-surface-variant/50 text-on-surface hover:bg-surface-variant'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 mr-2 ${isLearned ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant'}`} />
            {isLearned ? 'Learned' : 'Mark Learned'}
          </button>

          {hasNext ? (
            <button 
              onClick={handleNext} 
              className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant text-on-surface transition-all duration-200 active:scale-90 shrink-0"
              aria-label="Next Word"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          ) : (
            <button 
              onClick={handleClose} 
              className="w-14 h-14 flex items-center justify-center rounded-full bg-primary/15 hover:bg-primary/25 text-primary transition-all duration-200 active:scale-90 shrink-0"
              aria-label="Done"
            >
              <Check className="w-7 h-7" />
            </button>
          )}
        </div>
      </motion.div>
      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </div>
  );
};