import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, FilterOptions, WordFamily } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
  resetProgress: () => void;
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
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>('vocab_settings', defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  
  const [progress, setProgress] = useLocalStorage<{ learned: string[], learnedDates?: Record<string, string> }>('vocab_progress', { learned: [], learnedDates: {} });
  const [userAvatar, setUserAvatar] = useLocalStorage<string | null>('vocab_user_avatar', null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('vocab_favorites', []);
  const [filters, setFilters] = useLocalStorage<FilterOptions>('vocab_filters', defaultFilters);
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

  const resetProgress = () => {
    setProgress({ learned: [], learnedDates: {} });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

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
        resetProgress,
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