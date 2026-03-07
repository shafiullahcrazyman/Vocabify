--- START OF FILE Vocabify-main/src/components/SettingsDrawer.tsx ---
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, startTour } = useAppContext();

  // Prevent Tour from starting if this modal is open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={settings.animationsEnabled ? { duration: 0.2 } : { duration: 0.1, ease: "easeOut" }}
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={settings.animationsEnabled ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0.15, ease: "easeOut" }}
            className="relative bg-surface w-[calc(100%-56px)] max-w-[360px] h-full shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-outline/10">
              <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Settings</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Theme */}
              <div>
                <p className="m3-label-large text-on-surface-variant mb-3">Theme</p>
                <div className="flex flex-col gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`px-4 py-3 rounded-xl m3-label-large capitalize flex items-center transition-all duration-200 active:scale-[0.98] ${
                        settings.theme === t
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-variant/50 text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      {t === 'light' && <Sun className="w-5 h-5 mr-3" />}
                      {t === 'dark' && <Moon className="w-5 h-5 mr-3" />}
                      {t === 'system' && <Monitor className="w-5 h-5 mr-3" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offline Mode */}
              <div className="pt-4 border-t border-outline/10">
                <label className="flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="m3-body-large text-on-surface">Offline Mode</p>
                    <p className="m3-body-small text-on-surface-variant">Keep data local</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={settings.offlineMode ?? false}
                      onChange={(e) => handleToggle('offlineMode', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{
                        right: settings.offlineMode ? '0' : '1.5rem',
                        borderColor: settings.offlineMode ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                        background: settings.offlineMode ? 'var(--md-sys-color-primary)' : 'white'
                      }}
                    />
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.offlineMode ? 'bg-primary-container' : 'bg-surface-variant'}`}></label>
                  </div>
                </label>
              </div>

              {/* Haptics */}
              <div className="pt-4 border-t border-outline/10">
                <label className="flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="m3-body-large text-on-surface">Haptic Feedback</p>
                    <p className="m3-body-small text-on-surface-variant">Vibrate on tap</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={settings.hapticsEnabled ?? false}
                      onChange={(e) => handleToggle('hapticsEnabled', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{
                        right: settings.hapticsEnabled ? '0' : '1.5rem',
                        borderColor: settings.hapticsEnabled ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                        background: settings.hapticsEnabled ? 'var(--md-sys-color-primary)' : 'white'
                      }}
                    />
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.hapticsEnabled ? 'bg-primary-container' : 'bg-surface-variant'}`}></label>
                  </div>
                </label>
              </div>

              {/* Animations */}
              <div className="pt-4 border-t border-outline/10">
                <label className="flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="m3-body-large text-on-surface">Animations</p>
                    <p className="m3-body-small text-on-surface-variant">Smooth UI transitions</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={settings.animationsEnabled ?? false}
                      onChange={(e) => handleToggle('animationsEnabled', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{
                        right: settings.animationsEnabled ? '0' : '1.5rem',
                        borderColor: settings.animationsEnabled ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                        background: settings.animationsEnabled ? 'var(--md-sys-color-primary)' : 'white'
                      }}
                    />
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.animationsEnabled ? 'bg-primary-container' : 'bg-surface-variant'}`}></label>
                  </div>
                </label>
              </div>

              {/* Auto Pronounce */}
              <div className="pt-4 border-t border-outline/10">
                <label className="flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="m3-body-large text-on-surface">Auto Pronounce</p>
                    <p className="m3-body-small text-on-surface-variant">Play audio automatically</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={settings.autoPronounce ?? false}
                      onChange={(e) => handleToggle('autoPronounce', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{
                        right: settings.autoPronounce ? '0' : '1.5rem',
                        borderColor: settings.autoPronounce ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                        background: settings.autoPronounce ? 'var(--md-sys-color-primary)' : 'white'
                      }}
                    />
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.autoPronounce ? 'bg-primary-container' : 'bg-surface-variant'}`}></label>
                  </div>
                </label>
              </div>
              
              {/* Hide Learned Words */}
              <div className="pt-4 border-t border-outline/10">
                <label className="flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="m3-body-large text-on-surface">Hide Learned Words</p>
                    <p className="m3-body-small text-on-surface-variant">Don't show words I already know</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      checked={settings.hideLearnedWords ?? false}
                      onChange={(e) => handleToggle('hideLearnedWords', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      style={{
                        right: settings.hideLearnedWords ? '0' : '1.5rem',
                        borderColor: settings.hideLearnedWords ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                        background: settings.hideLearnedWords ? 'var(--md-sys-color-primary)' : 'white'
                      }}
                    />
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.hideLearnedWords ? 'bg-primary-container' : 'bg-surface-variant'}`}></label>
                  </div>
                </label>
              </div>

              {/* Restart Tour */}
              <div className="pt-4 border-t border-outline/10 pb-8">
                <button
                  onClick={handleRestartTour}
                  className="w-full py-3 px-4 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors active:scale-[0.98]"
                >
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