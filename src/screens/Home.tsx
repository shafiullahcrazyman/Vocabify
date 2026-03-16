import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { TopAppBar } from '../components/TopAppBar';
import { WordCard } from '../components/WordCard';
import { WordOverlay } from '../components/WordOverlay';
import { Filter as FilterIcon } from 'lucide-react';
import { useWordFilter } from '../hooks/useWordFilter';

// How many words to load into the DOM at once
const WORDS_PER_PAGE = 20;

export const Home: React.FC = () => {
  const { words, searchQuery, filters, settings, progress, favorites } = useAppContext();
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  
  // State for pagination
  const [displayedCount, setDisplayedCount] = useState(WORDS_PER_PAGE);

  const { filteredWords, hasActiveFilters } = useWordFilter(
    words, searchQuery, filters, settings, progress, favorites, activeWordId
  );

  // Reset pagination back to page 1 whenever the user searches or filters
  useEffect(() => {
    setDisplayedCount(WORDS_PER_PAGE);
  }, [searchQuery, filters, settings.hideLearnedWords]);

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

  const handleClose = () => setActiveWordId(null);

  // Slice the array so the browser doesn't freeze rendering 2000 cards at once
  const displayedWords = filteredWords.slice(0, displayedCount);
  const hasMore = displayedCount < filteredWords.length;

  const loadMore = () => {
    setDisplayedCount(prev => prev + WORDS_PER_PAGE);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={settings.animationsEnabled ? { duration: 0.25, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
      className="pb-32"
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
          <>
            <div className="flex flex-col gap-[2px] sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {displayedWords.map((word, index) => {
                const position = 
                  displayedWords.length === 1 ? 'only' :
                  index === 0 ? 'first' :
                  index === displayedWords.length - 1 ? 'last' :
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

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={loadMore}
                  className="px-8 py-3.5 bg-surface-variant text-on-surface rounded-full m3-label-large hover:bg-on-surface/10 active:scale-95 transition-all duration-200 shadow-sm"
                >
                  Load More Words ({filteredWords.length - displayedCount} remaining)
                </button>
              </div>
            )}
          </>
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