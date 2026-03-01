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
  progress: { learned: string[] };
  markLearned: (id: string) => void;
  resetProgress: () => void;
  userAvatar: string | null;
  setUserAvatar: (avatar: string | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  runTour: boolean;
  startTour: () => void;
  stopTour: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  dailyGoal: 10,
  offlineMode: true,
  hapticsEnabled: true,
  animationsEnabled: true,
  autoPronounce: false,
};

const defaultFilters: FilterOptions = {
  level: [],
  pos: [],
  letter: [],
  theme: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storedSettings, setSettings] = useLocalStorage<AppSettings>('vocab_settings', defaultSettings);
  const settings = { ...defaultSettings, ...storedSettings };
  const [progress, setProgress] = useLocalStorage<{ learned: string[] }>('vocab_progress', { learned: [] });
  const [userAvatar, setUserAvatar] = useLocalStorage<string | null>('vocab_user_avatar', null);
  const [favorites, setFavorites] = useLocalStorage<string[]>('vocab_favorites', []);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [runTour, setRunTour] = useState(false);

  const startTour = () => setRunTour(true);
  const stopTour = () => setRunTour(false);

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
    setProgress((prev) => ({
      learned: prev.learned.includes(id) 
        ? prev.learned.filter((learnedId) => learnedId !== id) 
        : [...prev.learned, id],
    }));
  };

  const resetProgress = () => {
    setProgress({ learned: [] });
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
        runTour,
        startTour,
        stopTour,
      }}
    >
      {/* Apply font size class to a wrapper */}
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
