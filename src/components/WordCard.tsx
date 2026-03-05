import React from 'react';
import { WordFamily } from '../types';
import { Volume2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useAppContext } from '../context/AppContext';

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
  const { settings } = useAppContext();
  const mainWord = getValidWord(word.noun, word.verb, word.adjective, word.adverb);
  const isValid = (val?: string) => val && val.toLowerCase() !== 'x' && val.toLowerCase() !== 'none';

  const getRoundedClass = () => {
    switch (position) {
      case 'first': return 'rounded-t-[28px] rounded-b-[4px] sm:rounded-[24px]';
      case 'middle': return 'rounded-[4px] sm:rounded-[24px]';
      case 'last': return 'rounded-t-[4px] rounded-b-[28px] sm:rounded-[24px]';
      case 'only': default: return 'rounded-[28px] sm:rounded-[24px]';
    }
  };

  const playAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    triggerHaptic(settings.hapticsEnabled);
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
      || voices.find(v => v.lang === 'en-GB');
      
    if (ukFemale) utterance.voice = ukFemale;
    else utterance.lang = 'en-GB';
    
    window.speechSynthesis.speak(utterance);
  };

  const handleCardClick = () => {
    triggerHaptic(settings.hapticsEnabled);
    onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-surface-variant/40 hover:bg-surface-variant/70 ${getRoundedClass()} p-5 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] flex flex-col gap-3 relative overflow-hidden border border-transparent hover:border-outline/10`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[24px] leading-7 font-bold text-on-surface tracking-tight capitalize">{mainWord}</h3>
            <button
              onClick={(e) => playAudio(e, mainWord)}
              className="p-1.5 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
              aria-label="Pronounce word"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[16px] font-medium text-primary mt-1">{word.meaning_bn}</p>
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

      <p className="text-[14px] text-on-surface-variant leading-relaxed line-clamp-2 mt-1 italic">
        "{word.example}"
      </p>

      {/* Footer / Meta Info */}
      <div className="mt-auto pt-2 flex items-center gap-2">
        <span className="px-2.5 py-1 bg-surface-variant text-on-surface rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center w-fit">
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            word.level === 'easy' ? 'bg-emerald-500' :
            word.level === 'medium' ? 'bg-orange-500' :
            'bg-red-500'
          }`}></span>
          {word.level}
          
          {/* DYNAMIC CEFR BADGE */}
          {word.cefr && (
            <span className="ml-1.5 pl-1.5 border-l border-outline/30 text-primary uppercase">
              {word.cefr}
            </span>
          )}
        </span>
        <span className="text-[12px] text-on-surface-variant/70 font-medium capitalize">
          • {word.theme}
        </span>
      </div>
    </div>
  );
};