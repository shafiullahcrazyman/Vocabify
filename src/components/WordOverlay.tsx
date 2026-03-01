import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordFamily } from '../types';
// ADDED 'Check' to the imports for the Done button icon
import { X, ChevronLeft, ChevronRight, CheckCircle2, Volume2, Info, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { TipsOverlay } from './TipsOverlay';

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
  const { progress, markLearned, settings } = useAppContext();
  const isLearned = progress.learned.includes(word.id);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

  // Handle auto-pronounce
  useEffect(() => {
    if (settings.autoPronounce) {
      const wordsToPronounce: string[] = [];
      if (isValid(word.noun)) wordsToPronounce.push(word.noun!);
      if (isValid(word.verb)) wordsToPronounce.push(word.verb!);
      if (isValid(word.adjective)) wordsToPronounce.push(word.adjective!);
      if (isValid(word.adverb)) wordsToPronounce.push(word.adverb!);

      if (wordsToPronounce.length > 0) {
        // Cancel any ongoing speech before starting new ones
        window.speechSynthesis.cancel();
        
        wordsToPronounce.forEach((text) => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          const voices = window.speechSynthesis.getVoices();
          const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
            || voices.find(v => v.lang === 'en-GB');
            
          if (ukFemale) {
            utterance.voice = ukFemale;
          } else {
            utterance.lang = 'en-GB';
          }
          
          window.speechSynthesis.speak(utterance);
        });
      }
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [word, settings.autoPronounce]);

  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);

  const playAudio = (text: string) => {
    triggerHaptic(settings.hapticsEnabled);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a British female voice
    const voices = window.speechSynthesis.getVoices();
    const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
      || voices.find(v => v.lang === 'en-GB');
      
    if (ukFemale) {
      utterance.voice = ukFemale;
    } else {
      utterance.lang = 'en-GB';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    triggerHaptic(settings.hapticsEnabled);
    onClose();
  };

  const handleMarkLearned = () => {
    triggerHaptic(settings.hapticsEnabled);
    markLearned(word.id);
  };

  const handlePrev = () => {
    triggerHaptic(settings.hapticsEnabled);
    onPrev();
  };

  const handleNext = () => {
    triggerHaptic(settings.hapticsEnabled);
    onNext();
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
        key={word.id}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={settings.animationsEnabled ? { type: 'spring', damping: 25, stiffness: 300 } : { duration: 0.15, ease: "easeOut" }}
        className="relative bg-surface w-full max-w-2xl max-h-full rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline/10">
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90">
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              triggerHaptic(settings.hapticsEnabled);
              setIsTipsOpen(true);
            }}
            className="p-2 rounded-full hover:bg-surface-variant text-primary transition-all duration-200 active:scale-90"
            aria-label="Grammar Tips"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-10 mt-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className="text-[40px] font-bold tracking-tight text-on-surface leading-none">{mainWord}</h2>
              <button
                onClick={() => playAudio(mainWord)}
                className="p-3 rounded-full hover:bg-primary/20 text-primary transition-all duration-200 active:scale-90 bg-primary-container/50"
                aria-label="Pronounce word"
              >
                <Volume2 className="w-7 h-7" />
              </button>
            </div>
            <p className="m3-headline-small text-primary mt-2">{word.meaning_bn}</p>
          </div>

          <div className="space-y-6">
            {/* Word Forms */}
            <div className="bg-surface-variant/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-4">Word Forms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Noun */}
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.noun) ? 'bg-blue-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.noun) ? 'text-blue-700 dark:text-blue-300' : 'text-on-surface-variant/50'}`}>Noun</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold ${isValid(word.noun) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.noun) ? word.noun : 'None'}</span>
                    {isValid(word.noun) && (
                      <button onClick={() => playAudio(word.noun!)} className="p-2 rounded-full hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 transition-all duration-200 active:scale-90">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Verb */}
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.verb) ? 'bg-emerald-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.verb) ? 'text-emerald-700 dark:text-emerald-300' : 'text-on-surface-variant/50'}`}>Verb</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold ${isValid(word.verb) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.verb) ? word.verb : 'None'}</span>
                    {isValid(word.verb) && (
                      <button onClick={() => playAudio(word.verb!)} className="p-2 rounded-full hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all duration-200 active:scale-90">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Adjective */}
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adjective) ? 'bg-amber-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.adjective) ? 'text-amber-700 dark:text-amber-300' : 'text-on-surface-variant/50'}`}>Adjective</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold ${isValid(word.adjective) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.adjective) ? word.adjective : 'None'}</span>
                    {isValid(word.adjective) && (
                      <button onClick={() => playAudio(word.adjective!)} className="p-2 rounded-full hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-all duration-200 active:scale-90">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Adverb */}
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adverb) ? 'bg-purple-500/10' : 'bg-surface-variant/20 dark:bg-surface-variant/10'}`}>
                  <span className={`text-[13px] font-bold uppercase tracking-widest mb-1 ${isValid(word.adverb) ? 'text-purple-700 dark:text-purple-300' : 'text-on-surface-variant/50'}`}>Adverb</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[20px] font-semibold ${isValid(word.adverb) ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>{isValid(word.adverb) ? word.adverb : 'None'}</span>
                    {isValid(word.adverb) && (
                      <button onClick={() => playAudio(word.adverb!)} className="p-2 rounded-full hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 transition-all duration-200 active:scale-90">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="bg-primary-container/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-2">Example</h4>
              <p className="m3-body-large text-on-surface italic leading-relaxed">"{word.example}"</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 bg-surface-variant text-on-surface rounded-full m3-label-medium font-bold uppercase tracking-wider flex items-center gap-2 w-fit">
                <span className={`w-2 h-2 rounded-full ${
                  word.level === 'easy' ? 'bg-emerald-500' :
                  word.level === 'medium' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}></span>
                {word.level}
              </span>
              <span className="px-4 py-1.5 bg-surface-variant text-on-surface-variant rounded-full m3-label-medium">
                Theme: {word.theme}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-outline/10 flex justify-between items-center bg-surface">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="flex items-center px-3 sm:px-4 py-2 rounded-full hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed text-on-surface transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="m3-label-large">Previous</span>
          </button>
          
          <button
            onClick={handleMarkLearned}
            className={`flex items-center justify-center p-3 sm:px-6 sm:py-2.5 rounded-full transition-all duration-200 active:scale-95 ${isLearned ? 'text-primary bg-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            title={isLearned ? "Unmark as learned" : "Mark as learned"}
          >
            <CheckCircle2 className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="m3-label-large font-bold hidden sm:inline">{isLearned ? 'Learned' : 'Mark Learned'}</span>
          </button>

          {/* DYNAMIC NEXT/DONE BUTTON HERE */}
          {hasNext ? (
            <button
              onClick={handleNext}
              className="flex items-center px-3 sm:px-4 py-2 rounded-full hover:bg-surface-variant text-on-surface transition-all duration-200 active:scale-95"
            >
              <span className="m3-label-large">Next</span>
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center px-3 sm:px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 active:scale-95"
            >
              <span className="m3-label-large font-bold">Done</span>
              <Check className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </motion.div>
      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </div>
  );
};