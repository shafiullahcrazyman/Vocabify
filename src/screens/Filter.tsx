import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { SlidersHorizontal, Heart, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { slowSpatial, exitCurve, fastSpatial } from '../utils/motion';
import { TopAppBar } from '../components/TopAppBar';

// Prevents the browser from scrolling the clicked button into view.
// onMouseDown fires before onClick — calling preventDefault() here stops the
// element from receiving focus (which is what triggers the scroll), while
// the onClick handler still fires normally for the toggle logic.
const noFocusScroll = (e: React.MouseEvent) => e.preventDefault();

export const Filter: React.FC = () => {
  const { filters, updateFilters, words, settings } = useAppContext();

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    triggerHaptic(settings.hapticsEnabled, 'selection');
    if (category === 'favoritesOnly') return;
    
    const current = filters[category] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ [category]: updated });
  };

  const handleClearFilters = () => {
    triggerHaptic(settings.hapticsEnabled, 'impact');
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
              onMouseDown={noFocusScroll}
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
        animate={{ opacity: 1, y: 0, transition: settings.animationsEnabled ? slowSpatial : { duration: 0.15 } }}
        exit={{ opacity: 0, y: -8, transition: settings.animationsEnabled ? exitCurve : { duration: 0.1 } }}
        className="pb-24 max-w-3xl mx-auto pt-4"
      >
        <div className="px-4 space-y-8">
          
          {/* Flex container with the tiny 4px gap for the M3 grouped look */}
          <div className="flex flex-col gap-[4px]">
            
            {/* Top Section - Filters Content */}
            <section className="bg-surface-container-low rounded-t-[28px] rounded-b-[4px] p-6">
              <div className="flex items-center mb-4 text-on-surface">
                <SlidersHorizontal className="w-6 h-6 mr-3 text-primary" />
                <h2 className="m3-title-large">Categories</h2>
              </div>

              {/* Favorites Section */}
              <div className="mb-6 pt-2 pb-6 border-b border-surface-container-highest">
                <h3 className="m3-title-medium text-on-surface mb-3">Favorites</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface">
                    <Heart className={`w-5 h-5 ${filters.favoritesOnly ? 'fill-rose-500 text-rose-500' : 'text-on-surface-variant'}`} />
                    <span className="m3-label-large">Favorites Only</span>
                  </div>

                  <button
                    onMouseDown={noFocusScroll}
                    onClick={() => {
                      triggerHaptic(settings.hapticsEnabled, 'toggle');
                      updateFilters({ favoritesOnly: !filters.favoritesOnly });
                    }}
                    className={`px-4 py-2 rounded-lg m3-label-large transition-colors duration-200 active:scale-[0.96] ${
                      filters.favoritesOnly
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {filters.favoritesOnly ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
              
              <FilterSection title="Difficulty Level" category="level" options={levels} />
              <FilterSection title="CEFR English Level" category="cefr" options={cefrLevels} />
              <FilterSection title="Part of Speech" category="pos" options={pos} />
              
              {dynamicThemes.length > 0 && (
                <FilterSection title="Theme" category="theme" options={dynamicThemes} />
              )}
              
              <div className="mb-2">
                <h3 className="m3-title-medium text-on-surface mb-3">Alphabet</h3>
                <div className="flex flex-wrap gap-1">
                  {letters.map((letter) => {
                    const isSelected = filters.letter.includes(letter);
                    return (
                      <button
                        key={letter}
                        onMouseDown={noFocusScroll}
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
            </section>
            
            {/* Bottom Section - Connected Button */}
            <motion.button
              onMouseDown={noFocusScroll}
              onClick={handleClearFilters}
              whileTap={{ scale: 0.97 }}
              transition={fastSpatial}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="w-full py-4 bg-error text-on-error m3-title-medium hover:bg-error/90 transition-colors duration-200 flex items-center justify-center gap-2 rounded-t-[4px] rounded-b-[28px]"
            >
              <X className="w-5 h-5" />
              Clear All Filters
            </motion.button>

          </div>
        </div>
      </motion.div>
    </>
  );
};
