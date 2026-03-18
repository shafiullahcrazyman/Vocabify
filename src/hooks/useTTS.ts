import { useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useAppContext } from '../context/AppContext';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingText, setPlayingText] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { settings } = useAppContext();

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Apple/iOS Unlocker: Plays a silent audio clip on the first user interaction
    const unlockAudio = () => {
      if (isUnlocked) return;
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
      setIsUnlocked(true);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };

    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, [isUnlocked]);

  /** Core speak — supports English (en) and Bengali (bn) */
  const speak = useCallback(
    (text: string, lang: 'en' | 'bn' = 'en') => {
      if (!text) return;
      triggerHaptic(settings.hapticsEnabled);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (lang === 'bn') {
        // Bengali voice: bn-BD preferred, bn-IN as fallback
        const bnVoice =
          voices.find(v => v.lang === 'bn-BD') ||
          voices.find(v => v.lang === 'bn-IN') ||
          voices.find(v => v.lang.startsWith('bn'));
        if (bnVoice) utterance.voice = bnVoice;
        else utterance.lang = 'bn-BD';
      } else {
        // UK Female English voice
        const ukFemale =
          voices.find(
            v =>
              v.lang === 'en-GB' &&
              (v.name.toLowerCase().includes('female') ||
                v.name.includes('Google UK English Female'))
          ) || voices.find(v => v.lang === 'en-GB');
        if (ukFemale) utterance.voice = ukFemale;
        else utterance.lang = 'en-GB';
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setPlayingText(text);
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setPlayingText(null);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setPlayingText(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [settings.hapticsEnabled, voices]
  );

  /**
   * Toggle speak — for text-click audio (Bengali meaning, example sentence).
   * First click: plays. Click again on same text: stops. No speaker icon needed.
   */
  const toggle = useCallback(
    (text: string, lang: 'en' | 'bn' = 'en') => {
      if (isPlaying && playingText === text) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setPlayingText(null);
      } else {
        speak(text, lang);
      }
    },
    [isPlaying, playingText, speak]
  );

  return { speak, toggle, isPlaying, playingText };
};
