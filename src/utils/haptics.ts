export const triggerHaptic = (enabled: boolean, pattern: number | number[] = 50) => {
  if (enabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};
