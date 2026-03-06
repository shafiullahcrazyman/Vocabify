import { useState, useCallback, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useAppContext } from '../context/AppContext';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { settings } = useAppContext();

  // Load voices safely and handle async loading in browsers like Chrome
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices(); // Initial load attempt
    window.speechSynthesis.onvoiceschanged = loadVoices; // Async load fallback
    
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) return;
    triggerHaptic(settings.hapticsEnabled);
    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best UK Female voice from our loaded state
    const ukFemale = voices.find(v => v.lang === 'en-GB' && (v.name.toLowerCase().includes('female') || v.name.includes('Google UK English Female'))) 
      || voices.find(v => v.lang === 'en-GB');
      
    if (ukFemale) utterance.voice = ukFemale;
    else utterance.lang = 'en-GB';

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [settings.hapticsEnabled, voices]);

  return { speak, isPlaying };
};