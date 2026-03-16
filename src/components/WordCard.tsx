import React from 'react';
import { WordFamily } from '../types';
import { Volume2, Heart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
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
  const { settings, favorites, toggleFavorite } = useAppContext();
  const { speak, isPlaying } = useTTS();
  const isFavorite = favorites.includes(word.id);

  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);
  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

  // Using 24dp standard rounding for M3 cards
  const getRoundedClass = () => {
    switch (position) {
      case 'first': return 'rounded-t-[24px] rounded-b-[8px] sm:rounded-[24px]';
      case 'middle': return 'rounded-[8px] sm:rounded-[24px]';
      case 'last': return 'rounded-t-[8px] rounded-b-[24px] sm:rounded-[24px]';
      case 'only': default: return 'rounded-[24px] sm:rounded-[24px]';
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(settings.hapticsEnabled);
    toggleFavorite(word.id);
  };

  return (
    <div
      onClick={() => { triggerHaptic(settings.hapticsEnabled); onClick(); }}
      // Tonal Elevation: Surface Container Low. 0px Shadow. No borders.
      className={`bg-surface-container-low hover:bg-surface-container ${getRoundedClass()} p-5 cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col gap-3 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Bold expressive typography for the main word */}
            <h3 className="m3-headline-medium text-on-surface capitalize truncate">
              {mainWord}
            </h3>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); speak(mainWord); }}
                className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-primary-container text-on-primary-container scale-110' : 'hover:bg-on-surface/10 text-on-surface-variant'}`}
                aria-label="Pronounce word"
              >
                <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              </button>
              
              <button
                onClick={handleFavoriteClick}
                className="p-2 rounded-full hover:bg-rose-500/10 transition-colors"
                aria-label="Favorite word"
              >
                <Heart className={`w-5 h-5 transition-transform active:scale-75 ${isFavorite ? 'fill-rose-400 text-rose-400' : 'text-on-surface-variant'}`} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          {/* Muted Translation Typography */}
          <p className="m3-title-medium text-on-surface-variant mt-1 truncate">{word.meaning_bn}</p>
        </div>
      </div>

      {/* POS Chips - Subtly colored containers */}
      <div className="flex flex-wrap gap-2 mt-2">
        <span className={`px-3 py-1.5 rounded-lg m3-label-medium ${isValid(word.noun) ? 'bg-blue-900/30 text-blue-200' : 'bg-surface-container-highest text-on-surface-variant/50'}`}>
          n. <span className="capitalize">{isValid(word.noun) ? word.noun : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg m3-label-medium ${isValid(word.verb) ? 'bg-emerald-900/30 text-emerald-200' : 'bg-surface-container-highest text-on-surface-variant/50'}`}>
          v. <span className="capitalize">{isValid(word.verb) ? word.verb : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg m3-label-medium ${isValid(word.adjective) ? 'bg-amber-900/30 text-amber-200' : 'bg-surface-container-highest text-on-surface-variant/50'}`}>
          adj. <span className="capitalize">{isValid(word.adjective) ? word.adjective : 'None'}</span>
        </span>
        <span className={`px-3 py-1.5 rounded-lg m3-label-medium ${isValid(word.adverb) ? 'bg-purple-900/30 text-purple-200' : 'bg-surface-container-highest text-on-surface-variant/50'}`}>
          adv. <span className="capitalize">{isValid(word.adverb) ? word.adverb : 'None'}</span>
        </span>
      </div>

      {/* Muted Example Sentence */}
      <p className="m3-body-medium text-on-surface-variant leading-relaxed line-clamp-2 mt-1 italic">
        "{word.example}"
      </p>

      {/* Metadata Tags */}
      <div className="mt-auto pt-3 flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-md m3-label-small flex items-center w-fit ${
          word.level === 'easy' ? 'bg-emerald-900/30 text-emerald-300' :
          word.level === 'medium' ? 'bg-orange-900/30 text-orange-300' :
          'bg-red-900/30 text-red-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            word.level === 'easy' ? 'bg-emerald-400' :
            word.level === 'medium' ? 'bg-orange-400' :
            'bg-red-400'
          }`}></span>
          <span className="uppercase">{word.level}</span>
          
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
        
        <span className="m3-label-medium text-on-surface-variant opacity-80 capitalize">
          • {word.theme}
        </span>
      </div>
    </div>
  );
};