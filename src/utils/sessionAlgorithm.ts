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
 * Priority: unlearned first (shuffled) → learned words for review.
 *
 * FIX #5 — Spaced Repetition for review words:
 * Learned words are now sorted by their last-reviewed date ascending so the
 * words the user studied longest ago appear first for review. Previously they
 * were shuffled randomly, giving no SRS benefit. Words with no date record
 * (e.g. migrated data) are treated as the oldest and always come first.
 *
 * Always returns at least 4 so matching batches are never empty.
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

  // Sort learned words oldest-reviewed first for basic spaced repetition.
  // Words missing a date entry are treated as '0000-00-00' so they surface first.
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

  // Sort longest first to prevent partial-match replacements
  // e.g. replace "familiarize" before "familiar"
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

  // Sort by position, remove overlaps (keep first / longest already sorted)
  raw.sort((a, b) => a.index - b.index);
  const filtered: RawMatch[] = [];
  let lastEnd = -1;
  for (const m of raw) {
    if (m.index >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Fix POS assignment for duplicate form strings.
  //
  // When the same spelling is both Noun and Verb (e.g. "array"), the regex
  // finds it at multiple positions but the overlap-dedup above always keeps
  // the same POS for every occurrence (whichever was first in `sorted`).
  // Example: "They managed to array the soldiers in a vast array of colors."
  //   -> both blanks end up as "Noun" -- wrong.
  //
  // Fix: build a list of all distinct POS for each form string from `forms`,
  // then cycle through them in order across repeated occurrences, so each
  // occurrence gets a different POS label.
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

  // Build blanked sentence by replacing in reverse (preserves indices)
  let sentence = word.example;
  for (let i = filtered.length - 1; i >= 0; i--) {
    const m = filtered[i];
    sentence = sentence.slice(0, m.index) + '______' + sentence.slice(m.end);
  }

  // Build BlankItem for each match
  const blanks: BlankItem[] = filtered.map(m => {
    const distractors = shuffle(
      // Deduplicate by lowercase to prevent duplicate option buttons (React key conflicts)
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

// FIX #9: The old buildFillBlank alias was cast through `unknown`, completely
// bypassing TypeScript. Any call-site accessing `.blank` (singular) would get
// undefined at runtime since the real return shape has `.blanks` (plural).
// The alias has been removed. Use buildMultiFillBlank directly everywhere.
