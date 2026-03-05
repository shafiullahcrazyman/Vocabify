export interface WordFamily {
  id: string;
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
  meaning_bn: string;
  example: string;
  level: 'easy' | 'medium' | 'hard';
  cefr?: string; // <--- NEW: Dynamic CEFR string (A1, A2, B1, etc.)
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
  cefr: string[]; // <--- NEW: CEFR Filter state
  pos: string[];
  letter: string[];
  theme: string[];
}