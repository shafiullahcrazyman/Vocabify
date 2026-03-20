import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { TopAppBar } from '../components/TopAppBar';
import { WordCard } from '../components/WordCard';
import { WordOverlay } from '../components/WordOverlay';
import { Loader2, BookOpen, Flame, Zap } from 'lucide-react';
import { slowSpatial, exitCurve } from '../utils/motion';
import { useWordFilter } from '../hooks/useWordFilter';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { getLocalDateString } from '../context/AppContext';

// How many words to load into the DOM at once
const WORDS_PER_PAGE = 20;

export const Home: React.FC = () => {
  const { words, searchQuery, filters, settings, progress, favorites, streak } = useAppContext();
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

  // Today's progress
  const today = getLocalDateString();
  const todayCount = Object.values(progress.learnedDates ?? {}).filter(d => d === today).length;
  const goal = settings.dailyGoal;
  const progressPct = Math.min((todayCount / goal) * 100, 100);

  // Circumference for the SVG ring (r=28)
  const R = 28;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  // INFINITE SCROLL LOGIC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore) {
          setDisplayedCount((prev) => prev + WORDS_PER_PAGE);
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={settings.animationsEnabled
              ? { duration: 0.4, delay: 0.1, ease: [0.2, 0, 0, 1] }
              : { duration: 0.15 }}
            className="flex flex-col gap-4 pt-2"
          >
            {/* Hero card */}
            <div className="bg-primary rounded-[28px] p-6 text-on-primary">
              <div className="flex items-center justify-between mb-5">
                {/* Left: title + streak */}
                <div>
                  <p className="m3-label-medium opacity-80 uppercase tracking-widest mb-1">
                    Daily Goal
                  </p>
                  <p className="m3-headline-small font-bold">
                    {todayCount} / {goal} words
                  </p>
                  {streak.current > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-90">
                      <Flame className="w-4 h-4 text-orange-300" />
                      <span className="m3-label-medium">
                        {streak.current}-day streak
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: circular progress ring */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    {/* Track */}
                    <circle
                      cx="32" cy="32" r={R}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.2}
                      strokeWidth="6"
                    />
                    {/* Progress */}
                    <circle
                      cx="32" cy="32" r={R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[13px] font-bold opacity-90">
                      {Math.round(progressPct)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Learning button */}
              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled, 'success');
                  navigate('/learn');
                }}
                aria-label="Start a learning session"
                className="w-full py-4 bg-on-primary text-primary rounded-full m3-label-large flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
              >
                <Zap className="w-5 h-5" />
                Start Learning
              </button>
            </div>

            {/* Tip card */}
            <div className="bg-surface-container rounded-[24px] p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-on-primary-container" />
              </div>
              <div>
                <p className="m3-title-small text-on-surface mb-1">Browse words</p>
                <p className="m3-body-small text-on-surface-variant leading-relaxed">
                  Use the search bar above or apply filters from the Filter tab to explore vocabulary.
                </p>
              </div>
            </div>
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

            {hasMore && (
              <div ref={loaderRef} className="w-full flex justify-center items-center py-8">
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
