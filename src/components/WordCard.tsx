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

export const WordCard: React.FC<WordCardProps> = ({ word, onClick, position = 'only' }) => {
  const { settings, favorites, toggleFavorite, progress } = useAppContext();
  const { speak, isPlaying } = useTTS();
  const isFavorite = favorites.includes(word.id);
  const isLearned = progress.learned.includes(word.id);

  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);
  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

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
    // Toggle haptic: satisfying click-like double pulse
    triggerHaptic(settings.hapticsEnabled, 'toggle');
    toggleFavorite(word.id);
  };

  const handleCardClick = () => {
    // Pre-action press haptic — fires before overlay opens
    triggerHaptic(settings.hapticsEnabled, 'press');
    onClick();
  };

  return (
    // M3 FastSpatial spring for the tap press animation.
    // whileTap replaces CSS active:scale — it's interruptible and physics-driven.
    // style prevents blue tap highlight flash on mobile.
    <motion.div
      onClick={handleCardClick}
      whileTap={settings.animationsEnabled ? { scale: 0.97 } : undefined}
      transition={fastSpatial}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`
        bg-surface-container-low hover:bg-surface-container
        ${getRoundedClass()}
        p-5 cursor-pointer
        transition-colors duration-200
        flex flex-col gap-3 relative overflow-hidden
        border border-outline/10
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
              {/* Volume button — selection haptic (texture feel, not full tap) */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(settings.hapticsEnabled, 'selection');
                  speak(mainWord);
                }}
                whileTap={settings.animationsEnabled ? { scale: 0.85 } : undefined}
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`p-1.5 rounded-full transition-colors ${isPlaying ? 'bg-primary/20 text-primary' : 'hover:bg-on-surface/10 text-on-surface-variant'}`}
                aria-label="Pronounce word"
              >
                <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
              </motion.button>

              {/* Favorite — spring scale on toggle for extra expressiveness */}
              <motion.button
                onClick={handleFavoriteClick}
                whileTap={settings.animationsEnabled ? { scale: 0.80 } : undefined}
                animate={isFavorite
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
          <p className="text-[16px] font-medium text-primary mt-1 truncate">{word.meaning_bn}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.noun) ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-surface-container-highest/60 text-on-surface-variant/50'}`}>
          n. <span className="capitalize">{isValid(word.noun) ? word.noun : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.verb) ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-surface-container-highest/60 text-on-surface-variant/50'}`}>
          v. <span className="capitalize">{isValid(word.verb) ? word.verb : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.adjective) ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-surface-container-highest/60 text-on-surface-variant/50'}`}>
          adj. <span className="capitalize">{isValid(word.adjective) ? word.adjective : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${isValid(word.adverb) ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'bg-surface-container-highest/60 text-on-surface-variant/50'}`}>
          adv. <span className="capitalize">{isValid(word.adverb) ? word.adverb : 'None'}</span>
        </span>
      </div>

      <p className="text-[14px] text-on-surface-variant leading-relaxed line-clamp-2 mt-1 italic">
        "{word.example}"
      </p>

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

      {/* Subtle learned indicator — no separate badge, just a soft overlay strip */}
      {isLearned && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500/70" />
      )}
    </motion.div>
  );
};
