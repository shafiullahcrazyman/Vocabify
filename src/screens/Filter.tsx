import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { SlidersHorizontal, Heart, Check } from 'lucide-react';
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

  // M3 Connected Button Group (Segmented Buttons)
  const ConnectedFilterGroup = ({ 
    title, 
    category, 
    options 
  }: { 
    title: string, 
    category: keyof typeof filters, 
    options: string[] 
  }) => (
    <div className="mb-8">
      <h3 className="m3-title-medium text-on-surface mb-3">{title}</h3>
      
      {/* Scrollable wrapper ensuring the group stays on one line and the pill shape never breaks */}
      <div className="w-full overflow-x-auto touch-pan-x pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {/* Exact structure from your snippet */}
        <div className="inline-flex rounded-full border border-outline overflow-hidden bg-surface">
          {options.map((opt) => {
            const isSelected = (filters[category] as string[]).includes(opt);

            return (
              <button
                key={opt}
                onClick={() => toggleFilter(category, opt)}
                className={`relative px-5 py-2.5 m3-label-large transition-colors border-r border-outline last:border-r-0
                ${isSelected ? "text-on-primary-container" : "text-on-surface hover:bg-surface-variant/40"}
                `}
              >
                {/* Animated Background mimicking your snippet */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      layoutId={`segment-${category}-${opt}`} // Unique ID for spring animation
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-primary-container z-0"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Text and Icon container sitting above the background */}
                <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap">
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, width: 0, opacity: 0 }}
                      animate={{ scale: 1, width: "auto", opacity: 1 }}
                      exit={{ scale: 0, width: 0, opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </motion.div>
                  )}
                  <span className={category === 'cefr' || category === 'letter' ? 'uppercase' : 'capitalize'}>
                    {opt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
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
          <section className="bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline/5">
            <div className="flex items-center mb-4 text-on-surface">
              <SlidersHorizontal className="w-6 h-6 mr-3 text-primary" />
              <h2 className="m3-title-large">Categories</h2>
            </div>

            {/* Favorites Toggle */}
            <div className="mb-6 pt-2 pb-6 border-b border-surface-container-highest">
              <label className="flex justify-between items-center cursor-pointer group">
                <div>
                  <p className="m3-body-large text-on-surface font-medium flex items-center gap-2">
                    <Heart className="w-8 h-8 fill-rose-500 text-rose-500" /> 
                    Favorites Only
                  </p>
                </div>
                
                {/* M3 Toggle Switch */}
                <div className="shrink-0 relative flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.favoritesOnly}
                    onChange={(e) => {
                      triggerHaptic(settings.hapticsEnabled);
                      updateFilters({ favoritesOnly: e.target.checked });
                    }}
                    className="sr-only"
                  />
                  <div className={`w-[52px] h-8 rounded-full border-2 transition-colors duration-200 flex items-center px-1 ${
                    filters.favoritesOnly ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline'
                  }`}>
                    <div className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                      filters.favoritesOnly ? 'w-6 h-6 bg-on-primary translate-x-[20px]' : 'w-4 h-4 bg-outline translate-x-0'
                    }`} />
                  </div>
                </div>
              </label>
            </div>
            
            {/* Dynamic Connected Button Groups */}
            <ConnectedFilterGroup title="Difficulty Level" category="level" options={levels} />
            <ConnectedFilterGroup title="CEFR English Level" category="cefr" options={cefrLevels} />
            <ConnectedFilterGroup title="Part of Speech" category="pos" options={pos} />
            
            {dynamicThemes.length > 0 && (
              <ConnectedFilterGroup title="Theme" category="theme" options={dynamicThemes} />
            )}
            
            <ConnectedFilterGroup title="Alphabet" category="letter" options={letters} />

            <button
              onClick={handleClearFilters}
              className="w-full mt-6 py-4 rounded-full bg-error text-on-error m3-label-large shadow-sm hover:bg-error/90 transition-all duration-200 active:scale-[0.98]"
            >
              Clear All Filters
            </button>
          </section>
        </div>
      </motion.div>
    </>
  );
};