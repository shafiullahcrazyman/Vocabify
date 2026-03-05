import { useMemo } from 'react';
import { WordFamily, FilterOptions, AppSettings } from '../types';

export const useWordFilter = (
  words: WordFamily[],
  searchQuery: string,
  filters: FilterOptions,
  settings: AppSettings,
  progress: { learned: string[] },
  favorites: string[],
  activeWordId: string | null
) => {
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      filters.level.length > 0 ||
      filters.cefr.length > 0 ||
      filters.theme.length > 0 ||
      filters.letter.length > 0 ||
      filters.pos.length > 0 ||
      filters.favoritesOnly
    );
  }, [searchQuery, filters]);

  const filteredWords = useMemo(() => {
    if (!hasActiveFilters) return [];

    let result = words.filter((word) => {
      // 1. Favorites Filter
      if (filters.favoritesOnly && !favorites.includes(word.id)) return false;

      // 2. Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          (word.noun?.toLowerCase().includes(query)) ||
          (word.verb?.toLowerCase().includes(query)) ||
          (word.adjective?.toLowerCase().includes(query)) ||
          (word.adverb?.toLowerCase().includes(query)) ||
          (word.meaning_bn.includes(query))
        );
        if (!matchesSearch) return false;
      }

      // 3. Smart Hide
      if (settings.hideLearnedWords && progress.learned.includes(word.id)) {
        if (word.id !== activeWordId) return false;
      }

      // 4. Difficulty
      const levelActive = filters.level.length > 0;
      const cefrActive = filters.cefr.length > 0;
      if (levelActive || cefrActive) {
        const matchesLevel = levelActive && filters.level.includes(word.level);
        const matchesCefr = cefrActive && !!word.cefr && filters.cefr.includes(word.cefr);
        if (levelActive && cefrActive && !matchesLevel && !matchesCefr) return false;
        else if (levelActive && !matchesLevel) return false;
        else if (cefrActive && !matchesCefr) return false;
      }

      // 5. Categories
      if (filters.theme.length > 0 && !filters.theme.includes(word.theme)) return false;
      if (filters.letter.length > 0 && !filters.letter.includes(word.letter)) return false;
      
      // 6. POS
      if (filters.pos.length > 0) {
        const hasPos = filters.pos.some(pos => {
          if (pos === 'noun' && word.noun) return true;
          if (pos === 'verb' && word.verb) return true;
          if (pos === 'adjective' && word.adjective) return true;
          if (pos === 'adverb' && word.adverb) return true;
          return false;
        });
        if (!hasPos) return false;
      }

      return true;
    });

    // Smart Sorting
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result.sort((a, b) => {
        const getWords = (w: WordFamily) => [w.noun, w.verb, w.adjective, w.adverb].map(v => (v || '').toLowerCase());
        const aWords = getWords(a);
        const bWords = getWords(b);

        const aExact = aWords.includes(query);
        const bExact = bWords.includes(query);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aWords.some(w => w.startsWith(query));
        const bStarts = bWords.some(w => w.startsWith(query));
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return result;
  }, [words, searchQuery, filters, hasActiveFilters, settings.hideLearnedWords, progress.learned, favorites, activeWordId]);

  return { filteredWords, hasActiveFilters };
};