import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>('vocab_settings', defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  const [filters, setFilters] = useLocalStorage<FilterOptions>('vocab_filters', defaultFilters);

  const [progress, setProgress, progressLoaded] = useIndexedDB<ProgressData>('vocab_progress', { learned: [], learnedDates: {} });
  const [userAvatar, setUserAvatar, avatarLoaded] = useIndexedDB<string | null>('vocab_user_avatar', null);
  const [favorites, setFavorites, favsLoaded] = useIndexedDB<string[]>('vocab_favorites', []);
  const [streakData, setStreakData, streakLoaded] = useIndexedDB<StreakData>('vocab_streak', defaultStreak);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const words = wordsData as WordFamily[];

  // FIX #3 — Race-safe today-count tracker.
  // Using a ref avoids the stale-closure problem where rapid markLearned calls
  // all read the same snapshot of progress.learnedDates before React re-renders.
  // The ref is updated synchronously on every markLearned call, so even if 10
  // words are marked in quick succession the streak fires exactly once at the goal.
  const todayCountRef = useRef(0);

  // Initialise the ref once data has loaded from IndexedDB.
  useEffect(() => {
    if (!progressLoaded) return;
    const today = getLocalDateString();
    const count = Object.values(progress.learnedDates ?? {}).filter(d => d === today).length;
    todayCountRef.current = count;
  // Only run once on load — progress state changes are tracked synchronously via the ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoaded]);

  // Auto-break streak on load if the user skipped a day.
  // Without this, a stale streak (e.g. 7) would keep showing even after missing
  // days — it only corrected itself the next time the goal was earned.
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
      // FIX #1 — spread prev so totalXP is never overwritten.
      setStreakData(prev => ({ ...prev, current: 0 }));
    }
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
        // Full un-learn: word was learned and counted today — remove it entirely.
        const newDates = { ...prevDates };
        delete newDates[id];
        return {
          learned: prevLearned.filter(learnedId => learnedId !== id),
          learnedDates: newDates,
        };
      } else {
        // Fresh learn OR post-Reset-Today re-learn.
        return {
          learned: alreadyInLearned ? prevLearned : [...prevLearned, id],
          learnedDates: { ...prevDates, [id]: today },
        };
      }
    });

    // FIX #3 — Update the ref synchronously so rapid calls can't double-trigger.
    if (isAdding) {
      todayCountRef.current += 1;
    } else {
      // Un-learning: decrement safely.
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
        // FIX #1 — spread prev so totalXP (and any future fields) are never lost.
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

  // FIX #1 — persist XP so it survives across sessions; spread prev so other
  // streak fields (current, longest, lastGoalDate) are never overwritten.
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
