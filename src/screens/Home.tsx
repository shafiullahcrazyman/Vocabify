import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { TopAppBar } from '../components/TopAppBar';
import { WordCard } from '../components/WordCard';
import { WordOverlay } from '../components/WordOverlay';
import { Filter as FilterIcon, Loader2, Zap } from 'lucide-react';
import { slowSpatial, exitCurve } from '../utils/motion';
import { useWordFilter } from '../hooks/useWordFilter';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';

// How many words to load into the DOM at once
const WORDS_PER_PAGE = 20;

export const Home: React.FC = () => {
  const { words, searchQuery, filters, settings, progress, favorites } = useAppContext();
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // State for pagination
  const [displayedCount, setDisplayedCount] = useState(WORDS_PER_PAGE);
  
  // Ref for the invisible sensor at the bottom
  const loaderRef = useRef<HTMLDivElement>(null);

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

  const displayedWords = filteredWords.slice(0, displayedCount);
  const hasMore = displayedCount < filteredWords.length;

  // INFINITE SCROLL LOGIC
  useEffect(() => {
    // Create the Intersection Observer (the "Sensor")
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // If the sensor is on the screen AND we have more words to load
        if (target.isIntersecting && hasMore) {
          setDisplayedCount((prev) => prev + WORDS_PER_PAGE);
        }
      },
      { 
        root: null,
        // Trigger the load 200px BEFORE they actually hit the bottom
        rootMargin: '200px', 
        threshold: 0.1 
      }
    );

    // Capture the element now — ref.current may be null by the time cleanup runs
    const el = loaderRef.current;
    if (!el) return;

    observer.observe(el);

    // Cleanup the sensor when the component updates or unmounts
    return () => observer.unobserve(el);
  }, [hasMore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: settings.animationsEnabled ? slowSpatial : { duration: 0.15 } }}
      exit={{ opacity: 0, y: -8, transition: settings.animationsEnabled ? exitCurve : { duration: 0.1 } }}
      className="pb-32"
    >
      <TopAppBar />
      
      <main className="p-4 max-w-7xl mx-auto">
        {!hasActiveFilters ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={settings.animationsEnabled ? { duration: 0.4, delay: 0.1, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-24 text-center px-6"
          >
            {/* UPDATED: Changed background and icon color to match the subtle search bar look */}
            <div className="w-20 h-20 bg-surface-variant/40 rounded-full flex items-center justify-center mb-6">
              <FilterIcon className="w-10 h-10 text-on-surface-variant opacity-60" />
            </div>
            <h2 className="m3-headline-small text-on-surface mb-2">Ready to learn?</h2>
            <p className="m3-body-large text-on-surface-variant max-w-sm">
              Use the search bar above or apply filters from the Filter tab to discover new vocabulary words.
            </p>

            {/* Start Learning button */}
            <button
              onClick={() => {
                triggerHaptic(settings.hapticsEnabled, 'success');
                navigate('/learn');
              }}
              aria-label="Start a learning session"
              className="mt-10 w-full max-w-[280px] py-5 bg-primary text-on-primary rounded-full flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
              style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              <Zap className="w-6 h-6" />
              Start Learning
            </button>
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

            {/* Invisible Sensor / Subtle Loading Indicator */}
            {hasMore && (
              <div 
                ref={loaderRef} 
                className="w-full flex justify-center items-center py-8"
              >
                <Loader2 className="w-6 h-6 text-on-surface-variant animate-spin opacity-50" />
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