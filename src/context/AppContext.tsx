import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, FilterOptions, WordFamily, StreakData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useIndexedDB } from '../hooks/useIndexedDB';
import wordsData from '../data/words.json';

// Helper: local YYYY-MM-DD to avoid UTC timezone bugs
export const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface ProgressData {
  learned: string[];
  learnedDates?: Record<string, string>;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  words: WordFamily[];
  filters: FilterOptions;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  progress: ProgressData;
  markLearned: (id: string) => void;
  resetTotalProgress: () => void;
  resetDailyProgress: () => void;
  userAvatar: string | null;
  setUserAvatar: (avatar: string | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  streak: StreakData;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  dailyGoal: 10,
  hapticsEnabled: true,
  animationsEnabled: true,
  autoPronounce: false,
  hideLearnedWords: false,
};

const defaultFilters: FilterOptions = {
  level: [],
  cefr: [],
  pos: [],
  letter: [],
  theme: [],
  favoritesOnly: false,
};

const defaultStreak: StreakData = {
  current: 0,
  longest: 0,
  lastGoalDate: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>('vocab_settings', defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  const [filters, setFilters] = useLocalStorage<FilterOptions>('vocab_filters', defaultFilters);

  const [progress, setProgress, progressLoaded] = useIndexedDB<ProgressData>('vocab_progress', { learned: [], learnedDates: {} });
  const [userAvatar, setUserAvatar, avatarLoaded] = useIndexedDB<string | null>('vocab_user_avatar', null);
  const [favorites, setFavorites, favsLoaded] = useIndexedDB<string[]>('vocab_favorites', []);
  const [streakData, setStreakData, streakLoaded] = useIndexedDB<StreakData>('vocab_streak', defaultStreak);

  const [searchQuery, setSearchQuery] = useState('');
  const words = wordsData as WordFamily[];

  // Apply theme class + update the theme-color meta tag dynamically
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedTheme: 'light' | 'dark';
    if (settings.theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = settings.theme;
    }

    root.classList.add(resolvedTheme);

    // Keep the browser chrome / status bar in sync with the active theme
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', resolvedTheme === 'dark' ? '#141218' : '#FEF7FF');
    }
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const markLearned = (id: string) => {
    const today = getLocalDateString();
    const yesterday = getYesterdayString();
    const isAdding = !progress.learned.includes(id);

    setProgress((prev) => {
      const prevLearned = prev.learned || [];
      const prevDates = prev.learnedDates || {};

      if (prevLearned.includes(id)) {
        // Un-learning a word
        const newDates = { ...prevDates };
        delete newDates[id];
        return {
          learned: prevLearned.filter((learnedId) => learnedId !== id),
          learnedDates: newDates,
        };
      } else {
        // Learning a new word
        return {
          learned: [...prevLearned, id],
          learnedDates: { ...prevDates, [id]: today },
        };
      }
    });

    // Streak logic: only check when adding a word, not removing
    if (isAdding) {
      const currentDates = progress.learnedDates || {};
      // +1 because the state hasn't updated yet — we're counting what it will be
      const todayCountAfter = Object.values(currentDates).filter(d => d === today).length + 1;
      const goalJustReached = todayCountAfter === settings.dailyGoal && streakData.lastGoalDate !== today;

      if (goalJustReached) {
        const newCurrent = streakData.lastGoalDate === yesterday
          ? streakData.current + 1
          : 1;
        setStreakData({
          current: newCurrent,
          longest: Math.max(newCurrent, streakData.longest),
          lastGoalDate: today,
        });
      }
    }
  };

  const resetTotalProgress = () => {
    setProgress({ learned: [], learnedDates: {} });
    // A full reset also wipes the streak
    setStreakData(defaultStreak);
  };

  const resetDailyProgress = () => {
    const today = getLocalDateString();
    const yesterday = getYesterdayString();

    // If the goal was already met today, roll back the streak by one day
    if (streakData.lastGoalDate === today) {
      setStreakData({
        ...streakData,
        current: Math.max(0, streakData.current - 1),
        // Revert lastGoalDate so the streak can be re-earned today
        lastGoalDate: yesterday,
      });
    }

    setProgress((prev) => {
      const prevDates = prev.learnedDates || {};
      const newDates = { ...prevDates };

      // Only wipe today's date entries — Total Mastery (learned array) is untouched
      Object.keys(newDates).forEach(wordId => {
        if (newDates[wordId] === today) delete newDates[wordId];
      });

      return {
        learned: prev.learned,
        learnedDates: newDates,
      };
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  if (!progressLoaded || !avatarLoaded || !favsLoaded || !streakLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        words,
        filters,
        updateFilters,
        searchQuery,
        setSearchQuery,
        progress,
        markLearned,
        resetTotalProgress,
        resetDailyProgress,
        userAvatar,
        setUserAvatar,
        favorites,
        toggleFavorite,
        streak: streakData,
      }}
    >
      <div className="min-h-screen">
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
