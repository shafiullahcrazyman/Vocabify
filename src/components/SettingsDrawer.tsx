import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Monitor, CloudOff, Smartphone, Sparkles, Volume2, EyeOff, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom Material 3 Switch Component
const M3Switch = ({ checked }: { checked: boolean }) => (
  <div 
    className={`relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
      checked ? 'bg-primary border-2 border-primary' : 'bg-surface-variant border-2 border-outline'
    }`}
  >
    <span 
      className={`inline-block transform rounded-full transition-all duration-200 ease-in-out shadow-sm ${
        checked 
          ? 'translate-x-[20px] w-6 h-6 bg-on-primary' 
          : 'translate-x-[4px] w-4 h-4 bg-outline'
      }`} 
    />
  </div>
);

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, startTour } = useAppContext();

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(settings.hapticsEnabled);
    onClose();
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    triggerHaptic(settings.hapticsEnabled);
    updateSettings({ theme });
  };

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    triggerHaptic(settings.hapticsEnabled);
    updateSettings({ [key]: value });
  };

  const handleRestartTour = () => {
    triggerHaptic(settings.hapticsEnabled);
    onClose();
    setTimeout(() => {
      startTour();
    }, 300);
  };

  // Helper for M3 List Items
  const SettingsItem = ({ icon: Icon, title, subtitle, stateKey }: { icon: any, title: string, subtitle: string, stateKey: keyof typeof settings }) => (
    <div 
      className="flex items-center justify-between py-4 px-2 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 rounded-xl transition-colors select-none"
      onClick={() => handleToggle(stateKey, !(settings[stateKey] as boolean))}
    >
      <div className="flex items-center gap-4 pr-4">
        <Icon className="w-6 h-6 text-on-surface-variant shrink-0" />
        <div className="flex flex-col">
          <span className="m3-body-large text-on-surface">{title}</span>
          <span className="m3-body-medium text-on-surface-variant mt-0.5 leading-snug">{subtitle}</span>
        </div>
      </div>
      <M3Switch checked={settings[stateKey] as boolean} />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={settings.animationsEnabled ? { duration: 0.2 } : { duration: 0.1, ease: "easeOut" }}
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={settings.animationsEnabled ? { type: 'spring', damping: 28, stiffness: 250 } : { duration: 0.15, ease: "easeOut" }}
            className="relative bg-surface w-full max-w-[400px] h-full shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center px-4 h-16 border-b border-outline/10 shrink-0">
              <button 
                onClick={handleClose} 
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors active:scale-95 -ml-2 mr-2"
                aria-label="Close settings"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Settings</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-2">
              
              {/* APPEARANCE SECTION */}
              <div className="py-4">
                <h3 className="m3-title-small text-primary px-2 mb-3 tracking-wide">Appearance</h3>
                <div className="px-2">
                  <div className="flex items-center gap-4 mb-3">
                    <Sun className="w-6 h-6 text-on-surface-variant shrink-0" />
                    <span className="m3-body-large text-on-surface">App Theme</span>
                  </div>
                  {/* M3 Segmented Button */}
                  <div className="flex w-full border border-outline/40 rounded-full overflow-hidden mt-2 h-10">
                    {(['light', 'dark', 'system'] as const).map((t, idx) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`flex-1 flex items-center justify-center gap-2 m3-label-large capitalize transition-colors ${
                          settings.theme === t
                            ? 'bg-primary-container text-on-primary-container font-bold'
                            : 'bg-surface text-on-surface hover:bg-on-surface/5'
                        } ${idx !== 2 ? 'border-r border-outline/40' : ''}`}
                      >
                        {t === 'light' && <Sun className="w-[18px] h-[18px]" />}
                        {t === 'dark' && <Moon className="w-[18px] h-[18px]" />}
                        {t === 'system' && <Monitor className="w-[18px] h-[18px]" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-outline/10 my-2" />

              {/* LEARNING SECTION */}
              <div className="py-2">
                <h3 className="m3-title-small text-primary px-2 mb-1 tracking-wide">Learning</h3>
                <SettingsItem 
                  icon={Volume2} 
                  title="Auto Pronounce" 
                  subtitle="Play audio automatically when viewing a word" 
                  stateKey="autoPronounce" 
                />
                <SettingsItem 
                  icon={EyeOff} 
                  title="Hide Learned Words" 
                  subtitle="Remove mastered words from standard lists" 
                  stateKey="hideLearnedWords" 
                />
              </div>

              <div className="border-t border-outline/10 my-2" />

              {/* SYSTEM SECTION */}
              <div className="py-2">
                <h3 className="m3-title-small text-primary px-2 mb-1 tracking-wide">System & Device</h3>
                <SettingsItem 
                  icon={CloudOff} 
                  title="Offline Mode" 
                  subtitle="Keep all vocabulary data stored locally" 
                  stateKey="offlineMode" 
                />
                <SettingsItem 
                  icon={Smartphone} 
                  title="Haptic Feedback" 
                  subtitle="Vibrate slightly on taps and actions" 
                  stateKey="hapticsEnabled" 
                />
                <SettingsItem 
                  icon={Sparkles} 
                  title="Animations" 
                  subtitle="Smooth UI transitions and physics" 
                  stateKey="animationsEnabled" 
                />
              </div>

              <div className="border-t border-outline/10 my-2" />

              {/* HELP SECTION */}
              <div className="py-4 px-2 pb-10">
                <button
                  onClick={handleRestartTour}
                  className="flex items-center justify-center w-full gap-2 py-3.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors active:scale-[0.98] m3-label-large font-bold"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart App Tour
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};