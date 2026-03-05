import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { SlidersHorizontal } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TopAppBar } from '../components/TopAppBar';

export const Filter: React.FC = () => {
  const { filters, updateFilters, words, settings } = useAppContext();

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    triggerHaptic(settings.hapticsEnabled);
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ [category]: updated });
  };

  const handleClearFilters = () => {
    triggerHaptic(settings.hapticsEnabled);
    updateFilters({ level: [], cefr: [], pos: [], letter: [], theme: [] }); // <-- Added cefr here
  };

  const levels = ['easy', 'medium', 'hard'];
  const pos = ['noun', 'verb', 'adjective', 'adverb'];
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Dynamically extract unique Themes
  const dynamicThemes = useMemo(() => {
    const themesSet = new Set<string>();
    words.forEach(word => {
      if (word.theme) themesSet.add(word.theme);
    });
    return Array.from(themesSet).sort();
  }, [words]);

  // Dynamically extract unique CEFR Levels (A1, A2, B1, etc.)
  const dynamicCEFR = useMemo(() => {
    const cefrSet = new Set<string>();
    words.forEach(word => {
      if (word.cefr) cefrSet.add(word.cefr);
    });
    return Array.from(cefrSet).sort(); // Sorts them alphabetically
  }, [words]);

  const FilterSection = ({ title, category, options }: { title: string, category: keyof typeof filters, options: string[] }) => (
    <div className="mb-6">
      <h3 className="m3-title-medium text-on-surface mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = filters[category].includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleFilter(category, opt)}
              className={`px-4 py-2 rounded-lg m3-label-large transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] border ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface border-outline/30 text-on-surface hover:bg-surface-variant'
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
          {/* Filters */}
          <section className="bg-surface rounded-3xl p-6 shadow-sm border border-outline/10">
          <div className="flex items-center mb-4 text-on-surface">
            <SlidersHorizontal className="w-6 h-6 mr-3 text-primary" />
            <h2 className="m3-title-large">Categories</h2>
          </div>
          
          <FilterSection title="Difficulty" category="level" options={levels} />
          
          {/* CEFR Dynamic Filter Section */}
          {dynamicCEFR.length > 0 && (
            <FilterSection title="CEFR Level" category="cefr" options={dynamicCEFR} />
          )}

          <FilterSection title="Part of Speech" category="pos" options={pos} />
          
          {/* Dynamic Themes Section */}
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
                    className={`w-10 h-10 rounded-full m3-label-large flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.94] border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface border-outline/30 text-on-surface hover:bg-surface-variant'
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
            className="w-full py-3 rounded-full bg-error text-on-error m3-label-large hover:bg-error/90 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.98] shadow-sm"
          >
            Clear All Filters
          </button>
        </section>
      </div>
    </motion.div>
    </>
  );
};