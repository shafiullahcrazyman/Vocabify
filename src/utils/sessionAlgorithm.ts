import { WordFamily } from '../types';
import { shuffle } from './shuffle';

/** First non-"x" word form — used for matching tiles and distractors. */
export const getPrimaryForm = (word: WordFamily): string => {
  if (word.noun && word.noun !== 'x') return word.noun;
  if (word.verb && word.verb !== 'x') return word.verb;
  if (word.adjective && word.adjective !== 'x') return word.adjective;
  if (word.adverb && word.adverb !== 'x') return word.adverb;
  return 'Unknown';
};

/** All valid POS forms with labels. */
export const getValidForms = (word: WordFamily): { form: string; pos: string }[] => {
  const out: { form: string; pos: string }[] = [];
  if (word.noun && word.noun !== 'x') out.push({ form: word.noun, pos: 'Noun' });
  if (word.verb && word.verb !== 'x') out.push({ form: word.verb, pos: 'Verb' });
  if (word.adjective && word.adjective !== 'x') out.push({ form: word.adjective, pos: 'Adj' });
  if (word.adverb && word.adverb !== 'x') out.push({ form: word.adverb, pos: 'Adv' });
  return out;
};

/**
 * Selects words for a session.
 * Unlearned words come first (shuffled), followed by learned words sorted
 * oldest-reviewed first for basic spaced repetition. Always returns at least
 * 4 words so matching batches are never empty.
 */
export const buildSession = (
  words: WordFamily[],
  learnedIds: string[],
  goal: number,
  learnedDates?: Record<string, string>,
): WordFamily[] => {
  const size = Math.max(goal, 4);
  const learnedSet = new Set(learnedIds);
  const valid = words.filter(w =>
    [w.noun, w.verb, w.adjective, w.adverb].some(f => f && f !== 'x')
  );

  const unlearned = shuffle(valid.filter(w => !learnedSet.has(w.id)));

  // Sort learned words oldest-reviewed first. Words with no date are treated
  // as '0000-00-00' so they always surface before recently reviewed words.
  const dates = learnedDates ?? {};
  const learned = valid
    .filter(w => learnedSet.has(w.id))
    .sort((a, b) => {
      const da = dates[a.id] ?? '0000-00-00';
      const db = dates[b.id] ?? '0000-00-00';
      return da.localeCompare(db);
    });

  return [...unlearned, ...learned].slice(0, size);
};

/** Splits an array into chunks of `size`. */
export const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ── Multi-blank fill-in-the-blank ─────────────────────────────────────────────

export interface BlankItem {
  answer: string;  // correct word form
  pos: string;     // e.g. 'Noun', 'Verb', 'Adj', 'Adv'
  options: string[]; // 4 shuffled choices
}

export interface MultiFillBlankData {
  /** Sentence with ALL found forms replaced by '______' */
  sentence: string;
  /** One item per blank, in left-to-right order of appearance */
  blanks: BlankItem[];
}

/**
 * Finds ALL valid POS forms that appear in the example sentence,
 * blanks them all out, and builds a 4-option question for each.
 * Returns null only if no form is found at all.
 */
export const buildMultiFillBlank = (
  word: WordFamily,
  pool: WordFamily[],
): MultiFillBlankData | null => {
  const forms = getValidForms(word);
  if (forms.length === 0) return null;

  // Sort longest form first to prevent partial-match replacements
  // (e.g. replace "familiarize" before "familiar").
  const sorted = [...forms].sort((a, b) => b.form.length - a.form.length);

  type RawMatch = { index: number; end: number; form: string; pos: string };
  const raw: RawMatch[] = [];

  for (const { form, pos } of sorted) {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(word.example)) !== null) {
      raw.push({ index: m.index, end: m.index + form.length, form, pos });
    }
  }

  if (raw.length === 0) return null;

  // Sort by position, then remove overlapping matches (longest already sorted first).
  raw.sort((a, b) => a.index - b.index);
  const filtered: RawMatch[] = [];
  let lastEnd = -1;
  for (const m of raw) {
    if (m.index >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // When the same spelling serves as both Noun and Verb (e.g. "array"), the
  // overlap-dedup above assigns the same POS to every occurrence. Fix this by
  // cycling through all distinct POS labels for each repeated form string.
  const formPosList = new Map<string, string[]>();
  for (const { form, pos } of forms) {
    const key = form.toLowerCase();
    if (!formPosList.has(key)) formPosList.set(key, []);
    const list = formPosList.get(key)!;
    if (!list.includes(pos)) list.push(pos);
  }
  const formPosUsage = new Map<string, number>();
  for (const m of filtered) {
    const key = m.form.toLowerCase();
    const posList = formPosList.get(key) ?? [m.pos];
    const usageIdx = formPosUsage.get(key) ?? 0;
    m.pos = posList[usageIdx % posList.length];
    formPosUsage.set(key, usageIdx + 1);
  }

  // Replace in reverse order to preserve original string indices.
  let sentence = word.example;
  for (let i = filtered.length - 1; i >= 0; i--) {
    const m = filtered[i];
    sentence = sentence.slice(0, m.index) + '______' + sentence.slice(m.end);
  }

  // Build one BlankItem per match with 3 distractor options.
  const blanks: BlankItem[] = filtered.map(m => {
    const distractors = shuffle(
      // Deduplicate by lowercase to avoid duplicate option buttons.
      [...new Set(
        pool
          .filter(w => w.id !== word.id)
          .map(getPrimaryForm)
          .filter(f => f.toLowerCase() !== m.form.toLowerCase() && f !== 'Unknown')
      )]
    ).slice(0, 3);

    const fallbacks = ['manage', 'provide', 'consider', 'present'];
    let fi = 0;
    while (distractors.length < 3) {
      const fb = fallbacks[fi++] ?? `word${fi}`;
      if (!distractors.includes(fb) && fb.toLowerCase() !== m.form.toLowerCase())
        distractors.push(fb);
    }

    return {
      answer: m.form,
      pos: m.pos,
      options: shuffle([m.form, ...distractors.slice(0, 3)]),
    };
  });

  return { sentence, blanks };
};
