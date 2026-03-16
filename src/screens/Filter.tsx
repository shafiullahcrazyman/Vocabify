import React, { useMemo } from 'react';
import { motion } from 'motion/react';
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

  // M3 Connected Button Group Component
  const ConnectedFilterGroup = ({ 
    title, 
    category, 
    options,
    minWClass = "min-w-[33%]",
    isSingleRow = false,
    showCheck = true
  }: { 
    title: string, 
    category: keyof typeof filters, 
    options: string[],
    minWClass?: string,
    isSingleRow?: boolean,
    showCheck?: boolean
  }) => (
    <div className="mb-8">
      <h3 className="m3-title-medium text-on-surface mb-3">{title}</h3>
      {/* Outer container with Top and Left borders. Overflow-hidden handles the outer rounded corners beautifully */}
      <div className={`flex flex-wrap ${isSingleRow ? 'rounded-full' : 'rounded-[20px]'} border-t border-l border-outline/20 overflow-hidden shadow-sm`}>
        {options.map((opt) => {
          const isSelected = (filters[category] as string[]).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleFilter(category, opt)}
              className={`flex-auto ${minWClass} relative flex items-center justify-center gap-1.5 py-3 px-3 text-[14px] font-medium border-r border-b border-outline/20 transition-colors duration-200 active:bg-on-surface/5 ${
                isSelected
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-variant/50'
              }`}
            >
              {showCheck && isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="shrink-0"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.div>
              )}
              <span className={`truncate ${category === 'cefr' || category === 'letter' ? 'uppercase' : 'capitalize'}`}>
                {opt}
              </span>
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
          <section className="bg-surface-container-low rounded-3xl p-6">
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
            
            {/* Dynamic M3 Connected Button Groups */}
            <ConnectedFilterGroup 
              title="Difficulty Level" 
              category="level" 
              options={levels} 
              minWClass="min-w-[33%]" 
              isSingleRow={true} 
            />
            
            <ConnectedFilterGroup 
              title="CEFR English Level" 
              category="cefr" 
              options={cefrLevels} 
              minWClass="min-w-[33%] sm:min-w-[16%]" 
            />
            
            <ConnectedFilterGroup 
              title="Part of Speech" 
              category="pos" 
              options={pos} 
              minWClass="min-w-[50%] sm:min-w-[25%]" 
            />
            
            {dynamicThemes.length > 0 && (
              <ConnectedFilterGroup 
                title="Theme" 
                category="theme" 
                options={dynamicThemes} 
                minWClass="min-w-[50%] sm:min-w-[33%]" 
              />
            )}
            
            <ConnectedFilterGroup 
              title="Alphabet" 
              category="letter" 
              options={letters} 
              minWClass="min-w-[14%]" 
              showCheck={false} 
            />

            <button
              onClick={handleClearFilters}
              className="w-full mt-4 py-4 rounded-full bg-error text-on-error m3-label-large shadow-sm hover:bg-error/90 transition-all duration-200 active:scale-[0.98]"
            >
              Clear All Filters
            </button>
          </section>
        </div>
      </motion.div>
    </>
  );
};