import { WordFamily } from '../types';

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

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
 * Priority: unlearned first → learned words for review.
 * Always returns at least 4 so matching batches are never empty.
 */
export const buildSession = (
  words: WordFamily[],
  learnedIds: string[],
  goal: number,
): WordFamily[] => {
  const size = Math.max(goal, 4);
  const learnedSet = new Set(learnedIds);
  const valid = words.filter(w =>
    [w.noun, w.verb, w.adjective, w.adverb].some(f => f && f !== 'x')
  );
  const unlearned = shuffle(valid.filter(w => !learnedSet.has(w.id)));
  const learned = shuffle(valid.filter(w => learnedSet.has(w.id)));
  return [...unlearned, ...learned].slice(0, size);
};

/** Splits an array into chunks of `size`. */
export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export interface FillBlankData {
  sentence: string; // example with one form replaced by ______
  blank: string;    // the correct answer
  options: string[]; // 4 choices, shuffled
}

/**
 * Generates fill-in-the-blank data for a word.
 * Tries each valid POS form until one is found in the example sentence.
 * Returns null if none found (handled as a graceful fallback in the UI).
 */
export const buildFillBlank = (
  word: WordFamily,
  pool: WordFamily[],
): FillBlankData | null => {
  const forms = getValidForms(word);
  let chosenForm: string | null = null;
  let sentence = word.example;

  for (const { form } of forms) {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(sentence)) {
      sentence = sentence.replace(regex, '______');
      chosenForm = form;
      break;
    }
  }

  if (!chosenForm) return null;

  // 3 distractors from pool
  const distractors = shuffle(
    pool
      .filter(w => w.id !== word.id)
      .map(getPrimaryForm)
      .filter(f => f.toLowerCase() !== chosenForm!.toLowerCase() && f !== 'Unknown')
  ).slice(0, 3);

  // Fallback padding (very unlikely with 3887 words in pool)
  const fallbacks = ['manage', 'provide', 'consider', 'present'];
  let fi = 0;
  while (distractors.length < 3) {
    const fb = fallbacks[fi++] ?? `word${fi}`;
    if (!distractors.includes(fb) && fb !== chosenForm) distractors.push(fb);
  }

  return {
    sentence,
    blank: chosenForm,
    options: shuffle([chosenForm, ...distractors.slice(0, 3)]),
  };
};
