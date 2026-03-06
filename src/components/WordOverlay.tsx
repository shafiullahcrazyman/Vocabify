import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  word, onClose, onNext, onPrev, hasNext, hasPrev,
}) => {
  const { progress, markLearned, settings, favorites, toggleFavorite } = useAppContext();
  const { speak, isPlaying } = useTTS();
  const isLearned = progress.learned.includes(word.id);
  const isFavorite = favorites.includes(word.id);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';
  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);

  // VIBE FIX: Prevent closing when heart is clicked
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Crucial: stops the overlay from closing
    triggerHaptic(settings.hapticsEnabled);
    toggleFavorite(word.id);
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && hasNext) {
      triggerHaptic(settings.hapticsEnabled);
      onNext();
    } else if (info.offset.x > swipeThreshold && hasPrev) {
      triggerHaptic(settings.hapticsEnabled);
      onPrev();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="relative bg-surface w-full max-w-2xl max-h-full rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-outline/10">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant transition-colors">
            <X className="w-6 h-6 text-on-surface-variant" />
          </button>
          <div className="flex gap-2">
            {/* VIBE: Solid Rose-500 heart */}
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full hover:bg-rose-50/50 transition-colors active:scale-90"
            >
              <Heart className={`w-6 h-6 transition-transform ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
            </button>
            <button
              onClick={() => { triggerHaptic(settings.hapticsEnabled); setIsTipsOpen(true); }}
              className="p-2 rounded-full hover:bg-surface-variant text-primary transition-all active:scale-90"
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-10 mt-4">
            <div className="flex items-center justify-center gap-3 mb-2 px-2">
              <h2 className="text-[36px] font-bold text-on-surface capitalize">{mainWord}</h2>
              <button
                onClick={() => speak(mainWord)}
                className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-primary text-on-primary scale-110 shadow-lg' : 'bg-primary-container/50 hover:bg-primary/20 text-primary active:scale-90'}`}
              >
                <Volume2 className={`w-7 h-7 ${isPlaying ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <p className="text-[20px] font-semibold text-primary">{word.meaning_bn}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-variant/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-4">Word Forms</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Word Form Cards */}
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.noun) ? 'bg-blue-500/10' : 'bg-surface-variant/20'}`}>
                  <span className="text-[13px] font-bold uppercase tracking-widest mb-1 text-blue-700">Noun</span>
                  <span className="text-[20px] font-semibold capitalize">{isValid(word.noun) ? word.noun : 'None'}</span>
                </div>
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.verb) ? 'bg-emerald-500/10' : 'bg-surface-variant/20'}`}>
                  <span className="text-[13px] font-bold uppercase tracking-widest mb-1 text-emerald-700">Verb</span>
                  <span className="text-[20px] font-semibold capitalize">{isValid(word.verb) ? word.verb : 'None'}</span>
                </div>
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adjective) ? 'bg-amber-500/10' : 'bg-surface-variant/20'}`}>
                  <span className="text-[13px] font-bold uppercase tracking-widest mb-1 text-amber-700">Adjective</span>
                  <span className="text-[20px] font-semibold capitalize">{isValid(word.adjective) ? word.adjective : 'None'}</span>
                </div>
                <div className={`flex flex-col p-4 rounded-2xl ${isValid(word.adverb) ? 'bg-purple-500/10' : 'bg-surface-variant/20'}`}>
                  <span className="text-[13px] font-bold uppercase tracking-widest mb-1 text-purple-700">Adverb</span>
                  <span className="text-[20px] font-semibold capitalize">{isValid(word.adverb) ? word.adverb : 'None'}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary-container/30 rounded-3xl p-5">
              <h4 className="m3-title-medium text-on-surface mb-2">Example</h4>
              <p className="m3-body-large text-on-surface italic leading-relaxed">"{word.example}"</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-outline/10 flex justify-between items-center bg-surface">
          <button onClick={() => { triggerHaptic(settings.hapticsEnabled); onPrev(); }} disabled={!hasPrev} className="px-4 py-2 rounded-full hover:bg-surface-variant disabled:opacity-50 text-on-surface active:scale-95">Previous</button>
          <button onClick={() => { triggerHaptic(settings.hapticsEnabled); markLearned(word.id); }} className={`p-3 rounded-full ${isLearned ? 'text-primary bg-primary-container' : 'text-on-surface-variant'}`}>
            <CheckCircle2 className="w-6 h-6" />
          </button>
          <button onClick={() => { triggerHaptic(settings.hapticsEnabled); hasNext ? onNext() : onClose(); }} className="px-4 py-2 rounded-full bg-primary/10 text-primary active:scale-95">{hasNext ? 'Next' : 'Done'}</button>
        </div>
      </motion.div>
      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
    </div>
  );
};