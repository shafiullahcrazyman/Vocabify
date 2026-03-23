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

    const query = searchQuery.trim().toLowerCase();
    const isSearching = query !== '';

    let result = words.filter((word) => {
      
      // 1. UNIVERSAL SEARCH OVERRIDE
      // If the user is actively typing in the search bar, ignore all other filters
      // and search the entire dictionary universally.
      if (isSearching) {
        const n = word.noun?.toLowerCase() || '';
        const v = word.verb?.toLowerCase() || '';
        const adj = word.adjective?.toLowerCase() || '';
        const adv = word.adverb?.toLowerCase() || '';
        const m = word.meaning_bn || ''; 

        return n.includes(query) || v.includes(query) || adj.includes(query) || adv.includes(query) || m.includes(query);
      }

      // --- THE FOLLOWING FILTERS ONLY APPLY IF NOT SEARCHING ---

      // 2. Favorites Filter
      if (filters.favoritesOnly && !favorites.includes(word.id)) {
        if (word.id !== activeWordId) return false;
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
        const hasAllSelectedPos = filters.pos.every(pos => {
          if (pos === 'noun' && word.noun && word.noun.toLowerCase() !== 'x') return true;
          if (pos === 'verb' && word.verb && word.verb.toLowerCase() !== 'x') return true;
          if (pos === 'adjective' && word.adjective && word.adjective.toLowerCase() !== 'x') return true;
          if (pos === 'adverb' && word.adverb && word.adverb.toLowerCase() !== 'x') return true;
          return false;
        });
        if (!hasAllSelectedPos) return false;
      }

      return true;
    });

    // Smart Sorting for Search Results (Optimized)
    if (isSearching) {
      result.sort((a, b) => {
        const aN = a.noun?.toLowerCase() || ''; const aV = a.verb?.toLowerCase() || '';
        const aAdj = a.adjective?.toLowerCase() || ''; const aAdv = a.adverb?.toLowerCase() || '';
        
        const bN = b.noun?.toLowerCase() || ''; const bV = b.verb?.toLowerCase() || '';
        const bAdj = b.adjective?.toLowerCase() || ''; const bAdv = b.adverb?.toLowerCase() || '';

        const aExact = aN === query || aV === query || aAdj === query || aAdv === query;
        const bExact = bN === query || bV === query || bAdj === query || bAdv === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aN.startsWith(query) || aV.startsWith(query) || aAdj.startsWith(query) || aAdv.startsWith(query);
        const bStarts = bN.startsWith(query) || bV.startsWith(query) || bAdj.startsWith(query) || bAdv.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return result;
  }, [words, searchQuery, filters, hasActiveFilters, settings.hideLearnedWords, progress.learned, favorites, activeWordId]);

  return { filteredWords, hasActiveFilters };
};