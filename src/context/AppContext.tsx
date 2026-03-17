import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, FilterOptions, WordFamily } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useIndexedDB } from '../hooks/useIndexedDB';
import wordsData from '../data/words.json';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  words: WordFamily[];
  filters: FilterOptions;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  progress: { learned: string[], learnedDates?: Record<string, string> };
  markLearned: (id: string) => void;
  resetTotalProgress: () => void;
  resetDailyProgress: () => void;
  userAvatar: string | null;
  setUserAvatar: (avatar: string | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  dailyGoal: 10,
  offlineMode: true,
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // UI preferences stay in LocalStorage because they are tiny and needed instantly for rendering CSS
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>('vocab_settings', defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  const [filters, setFilters] = useLocalStorage<FilterOptions>('vocab_filters', defaultFilters);
  
  // Heavy user data moves to IndexedDB to prevent app freezing
  const [progress, setProgress, progressLoaded] = useIndexedDB<{ learned: string[], learnedDates?: Record<string, string> }>('vocab_progress', { learned: [], learnedDates: {} });
  const [userAvatar, setUserAvatar, avatarLoaded] = useIndexedDB<string | null>('vocab_user_avatar', null);
  const [favorites, setFavorites, favsLoaded] = useIndexedDB<string[]>('vocab_favorites', []);

  const [searchQuery, setSearchQuery] = useState('');
  const words = wordsData as WordFamily[];

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const markLearned = (id: string) => {
    const today = new Date().toISOString().split('T')[0];

    setProgress((prev) => {
      const prevLearned = prev.learned || [];
      const prevDates = prev.learnedDates || {};

      if (prevLearned.includes(id)) {
        const newDates = { ...prevDates };
        delete newDates[id];
        
        return {
          learned: prevLearned.filter((learnedId) => learnedId !== id),
          learnedDates: newDates,
        };
      } else {
        return {
          learned: [...prevLearned, id],
          learnedDates: { ...prevDates, [id]: today },
        };
      }
    });
  };

  const resetTotalProgress = () => {
    setProgress({ learned: [], learnedDates: {} });
  };

  const resetDailyProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setProgress((prev) => {
      const prevLearned = prev.learned || [];
      const prevDates = prev.learnedDates || {};
      
      const newDates = { ...prevDates };
      
      // Find all word IDs that were learned today
      const todayLearnedIds = Object.keys(newDates).filter(id => newDates[id] === today);
      
      // Remove today's dates from tracking
      todayLearnedIds.forEach(id => {
        delete newDates[id];
      });
      
      // Un-learn those specific words
      const newLearned = prevLearned.filter(id => !todayLearnedIds.includes(id));
      
      return {
        learned: newLearned,
        learnedDates: newDates,
      };
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Prevent app from rendering until IndexedDB has loaded the user's data
  if (!progressLoaded || !avatarLoaded || !favsLoaded) {
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
      }}
    >
      <div className={`min-h-screen font-size-${settings.fontSize}`}>
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