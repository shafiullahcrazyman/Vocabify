export interface WordFamily {
  id: string;
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
  meaning_bn: string;
  example: string;
  level: 'easy' | 'medium' | 'hard';
  cefr?: string; 
  theme: string;
  letter: string;
  imageUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  dailyGoal: number;
  offlineMode: boolean;
  hapticsEnabled: boolean;
  animationsEnabled: boolean;
  autoPronounce: boolean;
  hideLearnedWords: boolean;
}

export interface FilterOptions {
  level: string[];
  cefr: string[]; 
  pos: string[];
  letter: string[];
  theme: string[];
  favoritesOnly: boolean;
}