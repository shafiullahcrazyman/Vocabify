/**
 * Fisher-Yates (Knuth) shuffle — produces a uniform distribution, O(n).
 *
 * The naive `arr.sort(() => Math.random() - 0.5)` pattern is biased because
 * most JS engines use an unstable comparison-based sort whose swap sequence
 * does not visit all permutations with equal probability.
 */
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
