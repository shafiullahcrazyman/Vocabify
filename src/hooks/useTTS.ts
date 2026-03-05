import { useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useAppContext } from '../context/AppContext';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useAppContext();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) return;
    triggerHaptic(settings.hapticsEnabled);
    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
      || voices.find(v => v.lang === 'en-GB');
      
    if (ukFemale) utterance.voice = ukFemale;
    else utterance.lang = 'en-GB';

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [settings.hapticsEnabled]);

  return { speak, isPlaying };
};