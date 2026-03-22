import React from 'react';
import { motion } from 'motion/react';
import { WordFamily } from '../types';
import { Volume2, Heart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { fastSpatial } from '../utils/motion';
import { useAppContext } from '../context/AppContext';
import { useTTS } from '../hooks/useTTS';

interface WordCardProps {
  word: WordFamily;
  onClick: () => void;
  position?: 'first' | 'middle' | 'last' | 'only';
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

export const WordCard: React.FC<WordCardProps> = ({ word, onClick, position = 'only' }) => {
  const { settings, favorites, toggleFavorite, progress } = useAppContext();
  const { speak, toggle, isPlaying, playingText } = useTTS();
  const isFavorite = favorites.includes(word.id);
  const isLearned = progress.learned.includes(word.id);

  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);
  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

  const bnSpeechText = prepareBnSpeech(word.meaning_bn);
  const isBnPlaying = isPlaying && playingText === bnSpeechText;
  const isExamplePlaying = isPlaying && playingText === word.example;

  const getRoundedClass = () => {
    switch (position) {
      case 'first':  return 'rounded-t-[28px] rounded-b-[4px] sm:rounded-[24px]';
      case 'middle': return 'rounded-[4px] sm:rounded-[24px]';
      case 'last':   return 'rounded-t-[4px] rounded-b-[28px] sm:rounded-[24px]';
      case 'only':   default: return 'rounded-[28px] sm:rounded-[24px]';
    }
  };

  const getDynamicTitleSize = (text: string) => {
    const len = text.length;
    if (len <= 10) return 'text-[24px]';
    if (len <= 14) return 'text-[20px]';
    return 'text-[18px]';
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(settings.hapticsEnabled, 'toggle');
    toggleFavorite(word.id);
  };

  const handleCardClick = () => {
    triggerHaptic(settings.hapticsEnabled, 'press');
    onClick();
  };

  const handleBnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(settings.hapticsEnabled, 'selection');
    toggle(bnSpeechText, 'bn');
  };

  const handleExampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(settings.hapticsEnabled, 'selection');
    toggle(word.example, 'en');
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileTap={settings.animationsEnabled ? { scale: 0.97 } : undefined}
      transition={fastSpatial}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`
        bg-surface-variant/40 hover:bg-surface-variant/70
        ${getRoundedClass()}
        p-5 cursor-pointer
        transition-colors duration-200
        flex flex-col gap-3 relative overflow-hidden
        border border-transparent hover:border-outline/10
        ${isLearned ? 'opacity-75' : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`${getDynamicTitleSize(mainWord)} leading-tight font-bold text-on-surface tracking-tight capitalize truncate`}>
              {mainWord}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">

              {/* Pronounce */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(settings.hapticsEnabled, 'selection');
                  speak(mainWord);
                }}
                whileTap={settings.animationsEnabled ? { scale: 0.85 } : undefined}
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`p-1.5 rounded-full transition-colors ${
                  isPlaying && playingText === mainWord
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-on-surface/10 text-on-surface-variant'
                }`}
                aria-label="Pronounce word"
              >
                <Volume2 className="w-5 h-5" />
              </motion.button>

              {/* Favorite */}
              <motion.button
                onClick={handleFavoriteClick}
                whileTap={settings.animationsEnabled ? { scale: 0.80 } : undefined}
                animate={
                  isFavorite
                    ? { scale: [1, 1.3, 1], transition: { ...fastSpatial, times: [0, 0.4, 1] } }
                    : { scale: 1 }
                }
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="p-1.5 rounded-full hover:bg-rose-50/50 transition-colors"
                aria-label="Favorite word"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
              </motion.button>
            </div>
          </div>

          {/* Bengali meaning — tap to toggle audio */}
          <motion.p
            onClick={handleBnClick}
            whileTap={settings.animationsEnabled ? { scale: 0.97 } : undefined}
            transition={fastSpatial}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`text-[16px] font-medium text-primary mt-1 truncate cursor-pointer select-none transition-all duration-200 ${
              isBnPlaying
                ? 'underline underline-offset-2 decoration-primary/60 opacity-80'
                : 'hover:underline hover:underline-offset-2 hover:decoration-primary/40'
            }`}
            title={isBnPlaying ? 'Click to stop' : 'Click to hear Bengali pronunciation'}
          >
            {word.meaning_bn}
          </motion.p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.noun) ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-surface-variant/30 text-on-surface-variant/50 dark:bg-surface-variant/10'}`}>
          n. <span className="capitalize">{isValid(word.noun) ? word.noun : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.verb) ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-surface-variant/30 text-on-surface-variant/50 dark:bg-surface-variant/10'}`}>
          v. <span className="capitalize">{isValid(word.verb) ? word.verb : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.adjective) ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-surface-variant/30 text-on-surface-variant/50 dark:bg-surface-variant/10'}`}>
          adj. <span className="capitalize">{isValid(word.adjective) ? word.adjective : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.adverb) ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'bg-surface-variant/30 text-on-surface-variant/50 dark:bg-surface-variant/10'}`}>
          adv. <span className="capitalize">{isValid(word.adverb) ? word.adverb : 'None'}</span>
        </span>
      </div>

      {/* Example sentence — tap to toggle audio */}
      <motion.p
        onClick={handleExampleClick}
        whileTap={settings.animationsEnabled ? { scale: 0.98 } : undefined}
        transition={fastSpatial}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={`text-[14px] text-on-surface-variant leading-relaxed line-clamp-2 mt-1 italic cursor-pointer select-none transition-all duration-200 ${
          isExamplePlaying
            ? 'underline underline-offset-2 decoration-on-surface-variant/50 opacity-75'
            : 'hover:underline hover:underline-offset-2 hover:decoration-on-surface-variant/30'
        }`}
        title={isExamplePlaying ? 'Click to stop' : 'Click to hear example'}
      >
        "{word.example}"
      </motion.p>

      <div className="mt-auto pt-2 flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center w-fit ${
          word.level === 'easy'   ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
          word.level === 'medium' ? 'bg-orange-500/15 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300' :
                                    'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            word.level === 'easy' ? 'bg-emerald-500' :
            word.level === 'medium' ? 'bg-orange-500' : 'bg-red-500'
          }`} />
          {word.level}
          {word.cefr && (
            <span className={`ml-1.5 pl-1.5 border-l uppercase ${
              word.level === 'easy'   ? 'border-emerald-500/30' :
              word.level === 'medium' ? 'border-orange-500/30' : 'border-red-500/30'
            }`}>
              {word.cefr}
            </span>
          )}
        </span>
        <span className="text-[12px] text-on-surface-variant/70 font-medium capitalize">
          • {word.theme}
        </span>
      </div>

      {/* Subtle learned indicator */}
      {isLearned && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500/70" />
      )}
    </motion.div>
  );
};
