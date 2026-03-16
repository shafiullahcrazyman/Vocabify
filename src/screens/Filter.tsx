import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { SlidersHorizontal, Heart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TopAppBar } from '../components/TopAppBar';

export const Filter: React.FC = () => {
  const { filters, updateFilters, words, settings } = useAppContext();

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    triggerHaptic(settings.hapticsEnabled);
    if (category === 'favoritesOnly') return;
    
    const current = filters[category] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ [category]: updated });
  };

  const handleClearFilters = () => {
    triggerHaptic(settings.hapticsEnabled);
    updateFilters({ level: [], cefr: [], pos: [], letter: [], theme: [], favoritesOnly: false });
  };

  const levels = ['easy', 'medium', 'hard'];
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const pos = ['noun', 'verb', 'adjective', 'adverb'];
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  const dynamicThemes = useMemo(() => {
    const themesSet = new Set<string>();
    words.forEach(word => {
      if (word.theme) themesSet.add(word.theme);
    });
    return Array.from(themesSet).sort();
  }, [words]);

  const FilterSection = ({ title, category, options }: { title: string, category: keyof typeof filters, options: string[] }) => (
    <div className="mb-6">
      <h3 className="m3-title-medium text-on-surface mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = (filters[category] as string[]).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleFilter(category, opt)}
              className={`px-4 py-2 rounded-lg m3-label-large transition-colors duration-200 active:scale-[0.96] ${
                isSelected
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className={category === 'cefr' ? 'uppercase' : 'capitalize'}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <TopAppBar title="Filters" />
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={settings.animationsEnabled ? { duration: 0.25, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
        className="pb-24 max-w-3xl mx-auto pt-4"
      >
        <div className="px-4 space-y-8">
          <section className="bg-surface-container-low rounded-3xl p-6 shadow-sm">
            <div className="flex items-center mb-4 text-on-surface">
              <SlidersHorizontal className="w-6 h-6 mr-3 text-primary" />
              <h2 className="m3-title-large">Categories</h2>
            </div>

            {/* M3 Connected Segmented Control for Favorites */}
            <div className="mb-8 pt-2 pb-6 border-b border-surface-container-highest">
              <div className="flex w-full h-12 bg-surface-container-highest rounded-full border border-outline-variant/30 overflow-hidden">
                
                {/* 1. Static Label (Unclickable) */}
                <div className="flex items-center gap-2 px-5 bg-surface-container-low/40 text-on-surface-variant border-r border-outline-variant/20 rounded-l-full">
                  <Heart className={`w-5 h-5 transition-colors duration-300 ${filters.favoritesOnly ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
                  <span className="m3-label-large whitespace-nowrap opacity-90">Favorites Only</span>
                </div>

                {/* 2. "Off" Button */}
                <button
                  onClick={() => {
                    triggerHaptic(settings.hapticsEnabled);
                    updateFilters({ favoritesOnly: false });
                  }}
                  className={`flex-1 px-4 m3-label-large transition-all duration-300 border-r border-outline-variant/20 ${
                    !filters.favoritesOnly 
                      ? 'bg-primary text-on-primary font-bold' 
                      : 'text-on-surface-variant hover:bg-surface-variant/50'
                  }`}
                >
                  Off
                </button>

                {/* 3. "On" Button */}
                <button
                  onClick={() => {
                    triggerHaptic(settings.hapticsEnabled);
                    updateFilters({ favoritesOnly: true });
                  }}
                  className={`flex-1 px-4 rounded-r-full m3-label-large transition-all duration-300 ${
                    filters.favoritesOnly 
                      ? 'bg-primary text-on-primary font-bold' 
                      : 'text-on-surface-variant hover:bg-surface-variant/50'
                  }`}
                >
                  On
                </button>
              </div>
            </div>
            
            <FilterSection title="Difficulty Level" category="level" options={levels} />
            <FilterSection title="CEFR English Level" category="cefr" options={cefrLevels} />
            <FilterSection title="Part of Speech" category="pos" options={pos} />
            
            {dynamicThemes.length > 0 && (
              <FilterSection title="Theme" category="theme" options={dynamicThemes} />
            )}
            
            <div className="mb-6">
              <h3 className="m3-title-medium text-on-surface mb-3">Alphabet</h3>
              <div className="flex flex-wrap gap-1">
                {letters.map((letter) => {
                  const isSelected = filters.letter.includes(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => toggleFilter('letter', letter)}
                      className={`w-10 h-10 rounded-full m3-label-large flex items-center justify-center transition-colors duration-200 active:scale-[0.94] ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="w-full py-3 rounded-full bg-error text-on-error m3-label-large hover:bg-error/90 transition-colors duration-200 active:scale-[0.98]"
            >
              Clear All Filters
            </button>
          </section>
        </div>
      </motion.div>
    </>
  );
};
