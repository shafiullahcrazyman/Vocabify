import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppSettings, FilterOptions, WordFamily, StreakData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { STORAGE_KEYS } from '../utils/storageKeys';
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
  addXP: (amount: number) => void;
  userAvatar: string | null;
  setUserAvatar: (avatar: string | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  streak: StreakData;
  // Global settings drawer state — lifted here so swipe gestures can open it
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
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
  totalXP: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  const [filters, setFilters] = useLocalStorage<FilterOptions>(STORAGE_KEYS.FILTERS, defaultFilters);

  const [progress, setProgress, progressLoaded] = useIndexedDB<ProgressData>(STORAGE_KEYS.PROGRESS, { learned: [], learnedDates: {} });
  const [userAvatar, setUserAvatar, avatarLoaded] = useIndexedDB<string | null>(STORAGE_KEYS.AVATAR, null);
  const [favorites, setFavorites, favsLoaded] = useIndexedDB<string[]>(STORAGE_KEYS.FAVORITES, []);
  const [streakData, setStreakData, streakLoaded] = useIndexedDB<StreakData>(STORAGE_KEYS.STREAK, defaultStreak);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const words = wordsData as WordFamily[];

  // Tracks today's learned count via a ref so rapid markLearned calls
  // don't read a stale state snapshot before React re-renders.
  const todayCountRef = useRef(0);

  // Seed the ref once IndexedDB has loaded.
  useEffect(() => {
    if (!progressLoaded) return;
    const today = getLocalDateString();
    const count = Object.values(progress.learnedDates ?? {}).filter(d => d === today).length;
    todayCountRef.current = count;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoaded]);

  // Break a stale streak on load if the user missed a day.
  useEffect(() => {
    if (!streakLoaded) return;
    const today = getLocalDateString();
    const yesterday = getYesterdayString();
    const { lastGoalDate, current } = streakData;

    const streakIsBroken =
      current > 0 &&
      lastGoalDate !== '' &&
      lastGoalDate !== today &&
      lastGoalDate !== yesterday;

    if (streakIsBroken) {
      setStreakData(prev => ({ ...prev, current: 0 }));
    }
  }, [streakLoaded]);

  // Re-check streak when the tab becomes visible again, in case the app stayed open overnight.
  useEffect(() => {
    if (!streakLoaded) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const today = getLocalDateString();
      const yesterday = getYesterdayString();
      setStreakData(prev => {
        const broken =
          prev.current > 0 &&
          prev.lastGoalDate !== '' &&
          prev.lastGoalDate !== today &&
          prev.lastGoalDate !== yesterday;
        return broken ? { ...prev, current: 0 } : prev;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [streakLoaded]);

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

    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
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
    const alreadyInLearned = progress.learned.includes(id);
    const countedToday = (progress.learnedDates ?? {})[id] === today;

    // "isAdding" = this call will add to today's daily count.
    const isAdding = !countedToday;

    setProgress(prev => {
      const prevLearned = prev.learned || [];
      const prevDates = prev.learnedDates || {};

      if (alreadyInLearned && countedToday) {
        // Word was learned and counted today — remove it entirely.
        const newDates = { ...prevDates };
        delete newDates[id];
        return {
          learned: prevLearned.filter(learnedId => learnedId !== id),
          learnedDates: newDates,
        };
      } else {
        // Fresh learn or re-learn after a daily reset.
        return {
          learned: alreadyInLearned ? prevLearned : [...prevLearned, id],
          learnedDates: { ...prevDates, [id]: today },
        };
      }
    });

    // Keep ref in sync so rapid calls don't double-trigger streak logic.
    if (isAdding) {
      todayCountRef.current += 1;
    } else {
      todayCountRef.current = Math.max(0, todayCountRef.current - 1);
    }

    // Streak logic: only evaluate when adding a word.
    if (isAdding) {
      const goalJustReached =
        todayCountRef.current === settings.dailyGoal &&
        streakData.lastGoalDate !== today;

      if (goalJustReached) {
        const newCurrent =
          streakData.lastGoalDate === yesterday
            ? streakData.current + 1
            : 1;
        // Spread prev to preserve totalXP and all other fields.
        setStreakData(prev => ({
          ...prev,
          current: newCurrent,
          longest: Math.max(newCurrent, prev.longest ?? 0),
          lastGoalDate: today,
        }));
      }
    }
  };

  const resetTotalProgress = () => {
    setProgress({ learned: [], learnedDates: {} });
    todayCountRef.current = 0;
    // A full reset also wipes the streak.
    setStreakData(defaultStreak);
  };

  // Spreads prev to avoid overwriting streak fields other than totalXP.
  const addXP = (amount: number) => {
    setStreakData(prev => ({ ...prev, totalXP: (prev.totalXP ?? 0) + amount }));
  };

  const resetDailyProgress = () => {
    const today = getLocalDateString();
    const yesterday = getYesterdayString();

    // Roll back the streak by one day if the goal was already met today.
    if (streakData.lastGoalDate === today) {
      setStreakData(prev => ({
        ...prev,
        current: Math.max(0, prev.current - 1),
        lastGoalDate: yesterday,
      }));
    }

    setProgress(prev => {
      const prevDates = prev.learnedDates || {};
      const newDates = { ...prevDates };
      // Only wipe today's date entries — Total Mastery (learned array) is untouched.
      Object.keys(newDates).forEach(wordId => {
        if (newDates[wordId] === today) delete newDates[wordId];
      });
      return { learned: prev.learned, learnedDates: newDates };
    });

    // Sync the ref back to 0.
    todayCountRef.current = 0;
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
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
        addXP,
        userAvatar,
        setUserAvatar,
        favorites,
        toggleFavorite,
        streak: streakData,
        isSettingsOpen,
        setIsSettingsOpen,
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
