import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppSettings } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppContext();

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
    if (settings.theme !== theme) {
      triggerHaptic(settings.hapticsEnabled);
      updateSettings({ theme });
    }
  };

  const handleToggle = (key: keyof AppSettings, value: boolean) => {
    triggerHaptic(settings.hapticsEnabled);
    updateSettings({ [key]: value });
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System default', icon: Monitor },
  ] as const;

  const prefOptions = [
    { id: 'offlineMode', label: 'Offline Mode', desc: 'Keep data local' },
    { id: 'hapticsEnabled', label: 'Haptic Feedback', desc: 'Vibrate on tap' },
    { id: 'animationsEnabled', label: 'Animations', desc: 'Smooth UI transitions' },
  ] as const;

  const learningOptions = [
    { id: 'autoPronounce', label: 'Auto Pronounce', desc: 'Play audio automatically' },
    { id: 'hideLearnedWords', label: 'Hide Learned Words', desc: "Don't show learned words" },
  ] as const;

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
            className="relative bg-surface w-[calc(100%-56px)] max-w-[380px] h-full shadow-2xl flex flex-col"
          >
            {/* Header with Arrow Navigation */}
            <div className="flex items-center gap-2 p-3 shrink-0">
              <button 
                onClick={handleClose} 
                className="p-3 rounded-full hover:bg-surface-variant text-on-surface transition-all duration-200 active:scale-90"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Settings</h2>
            </div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 space-y-8">
              
              {/* Appearance Group - Icons and Text are now static in color */}
              <div>
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase font-bold">Appearance</h3>
                <div className="bg-surface-variant/40 rounded-[28px] flex flex-col overflow-hidden border border-outline/5">
                  {themeOptions.map((item, index) => {
                    const isSelected = settings.theme === item.id;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== themeOptions.length - 1 ? 'border-b border-outline/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Static Icon Color */}
                          <item.icon className="w-6 h-6 text-on-surface-variant" />
                          {/* Static Text Color */}
                          <p className="m3-body-large text-on-surface">
                            {item.label}
                          </p>
                        </div>
                        
                        {/* Radio Button remains the only color-changing indicator */}
                        <div className="shrink-0 relative flex items-center justify-center mr-1">
                          <input
                            type="radio"
                            name="theme"
                            value={item.id}
                            checked={isSelected}
                            onChange={() => handleThemeChange(item.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                            isSelected ? 'border-primary' : 'border-outline'
                          }`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-200 ${
                              isSelected ? 'scale-100' : 'scale-0'
                            }`} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preferences Group */}
              <div>
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase font-bold">Preferences</h3>
                <div className="bg-surface-variant/40 rounded-[28px] flex flex-col overflow-hidden border border-outline/5">
                  {prefOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== prefOptions.length - 1 ? 'border-b border-outline/10' : ''
                        }`}
                      >
                        <div className="pr-4">
                          <p className="m3-body-large text-on-surface font-medium mb-0.5">{item.label}</p>
                          <p className="m3-body-small text-on-surface-variant leading-tight">{item.desc}</p>
                        </div>
                        <div className="shrink-0 relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(item.id as keyof AppSettings, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[52px] h-8 rounded-full border-2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex items-center ${
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-variant/80 border-outline/40'
                          }`}>
                            <div className={`rounded-full absolute transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] shadow-sm ${
                              isChecked ? 'w-6 h-6 right-0.5 bg-on-primary' : 'w-4 h-4 left-1 bg-outline'
                            }`} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Learning Options Group */}
              <div>
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase font-bold">Learning</h3>
                <div className="bg-surface-variant/40 rounded-[28px] flex flex-col overflow-hidden border border-outline/5">
                  {learningOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== learningOptions.length - 1 ? 'border-b border-outline/10' : ''
                        }`}
                      >
                        <div className="pr-4">
                          <p className="m3-body-large text-on-surface font-medium mb-0.5">{item.label}</p>
                          <p className="m3-body-small text-on-surface-variant leading-tight">{item.desc}</p>
                        </div>
                        <div className="shrink-0 relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(item.id as keyof AppSettings, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[52px] h-8 rounded-full border-2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex items-center ${
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-variant/80 border-outline/40'
                          }`}>
                            <div className={`rounded-full absolute transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] shadow-sm ${
                              isChecked ? 'w-6 h-6 right-0.5 bg-on-primary' : 'w-4 h-4 left-1 bg-outline'
                            }`} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};