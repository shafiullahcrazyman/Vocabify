import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { TopAppBar } from '../components/TopAppBar';
import { WordCard } from '../components/WordCard';
import { WordOverlay } from '../components/WordOverlay';
import { Filter as FilterIcon } from 'lucide-react';

export const Home: React.FC = () => {
  const { words, searchQuery, filters, settings, progress } = useAppContext();
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  // Check if any filters or search query are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      filters.level.length > 0 ||
      filters.theme.length > 0 ||
      filters.letter.length > 0 ||
      filters.pos.length > 0
    );
  }, [searchQuery, filters]);

  // Filter and search logic
  const filteredWords = useMemo(() => {
    if (!hasActiveFilters) return [];

    return words.filter((word) => {
      
      // 1. UNIVERSAL SEARCH: If the user is searching, ONLY check the search query.
      // We immediately return the result and completely IGNORE all other filters below!
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          (word.noun?.toLowerCase().includes(query)) ||
          (word.verb?.toLowerCase().includes(query)) ||
          (word.adjective?.toLowerCase().includes(query)) ||
          (word.adverb?.toLowerCase().includes(query)) ||
          (word.meaning_bn.includes(query))
        );
      }

      // --- Everything below this line ONLY runs if the search bar is EMPTY ---

      // 2. SMART DYNAMIC HIDE: 
      // Hide if learned, UNLESS the user is actively reading this exact card right now
      if (settings.hideLearnedWords && progress.learned.includes(word.id)) {
        if (word.id !== activeWordId) {
          return false;
        }
      }

      // 3. Category filters
      if (filters.level.length > 0 && !filters.level.includes(word.level)) return false;
      if (filters.theme.length > 0 && !filters.theme.includes(word.theme)) return false;
      if (filters.letter.length > 0 && !filters.letter.includes(word.letter)) return false;
      
      // 4. POS filter
      if (filters.pos.length > 0) {
        const hasPos = filters.pos.some(pos => {
          if (pos === 'noun' && word.noun) return true;
          if (pos === 'verb' && word.verb) return true;
          if (pos === 'adjective' && word.adjective) return true;
          if (pos === 'adverb' && word.adverb) return true;
          return false;
        });
        if (!hasPos) return false;
      }

      return true;
    });
  }, [words, searchQuery, filters, hasActiveFilters, settings.hideLearnedWords, progress.learned, activeWordId]);

  // Find where the currently active word is in the new filtered list
  const activeIndex = filteredWords.findIndex(w => w.id === activeWordId);
  const activeWord = activeIndex >= 0 ? filteredWords[activeIndex] : null;

  const handleNext = () => {
    if (activeIndex >= 0 && activeIndex < filteredWords.length - 1) {
      setActiveWordId(filteredWords[activeIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveWordId(filteredWords[activeIndex - 1].id);
    }
  };

  const handleClose = () => {
    setActiveWordId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={settings.animationsEnabled ? { duration: 0.25, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
      className="pb-24"
    >
      <TopAppBar />
      
      <main className="p-4 max-w-7xl mx-auto">
        {!hasActiveFilters ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={settings.animationsEnabled ? { duration: 0.4, delay: 0.1, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-32 text-center px-4"
          >
            <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mb-6">
              <FilterIcon className="w-10 h-10 text-primary opacity-80" />
            </div>
            <h2 className="m3-headline-small text-on-surface mb-2">Ready to learn?</h2>
            <p className="m3-body-large text-on-surface-variant max-w-sm">
              Use the search bar above or apply filters from the Filter tab to discover new vocabulary words.
            </p>
          </motion.div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-20">
            <p className="m3-body-large text-on-surface-variant">No words found matching your criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[2px] sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {filteredWords.map((word, index) => {
              const position = 
                filteredWords.length === 1 ? 'only' :
                index === 0 ? 'first' :
                index === filteredWords.length - 1 ? 'last' :
                'middle';
                
              return (
                <WordCard
                  key={word.id}
                  word={word}
                  position={position}
                  onClick={() => setActiveWordId(word.id)}
                />
              );
            })}
          </div>
        )}
      </main>

      {activeWord && (
        <WordOverlay
          word={activeWord}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={activeIndex < filteredWords.length - 1}
          hasPrev={activeIndex > 0}
        />
      )}
    </motion.div>
  );
};