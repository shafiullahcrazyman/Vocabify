import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Monitor, Check } from 'lucide-react';
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
    triggerHaptic(settings.hapticsEnabled);
    updateSettings({ theme });
  };

  const handleToggle = (key: keyof AppSettings, value: boolean) => {
    triggerHaptic(settings.hapticsEnabled);
    updateSettings({ [key]: value });
  };

  const getGroupItemClass = (index: number, total: number) => {
    if (total === 1) return 'rounded-[28px]';
    if (index === 0) return 'rounded-t-[28px] border-b border-outline/10';
    if (index === total - 1) return 'rounded-b-[28px]';
    return 'border-b border-outline/10 rounded-none';
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  const prefOptions = [
    { id: 'offlineMode', label: 'Offline Mode', desc: 'Keep data local' },
    { id: 'hapticsEnabled', label: 'Haptic Feedback', desc: 'Vibrate on tap' },
    { id: 'animationsEnabled', label: 'Animations', desc: 'Smooth UI transitions' },
  ] as const;

  const learningOptions = [
    { id: 'autoPronounce', label: 'Auto Pronounce', desc: 'Play audio automatically' },
    { id: 'hideLearnedWords', label: 'Hide Learned Words', desc: "Don't show words I already know" },
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
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-outline/10 shrink-0">
              <h2 className="text-[22px] font-bold text-on-surface tracking-tight">Settings</h2>
              <button onClick={handleClose} className="p-2 -mr-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 space-y-8">
              
              {/* Theme Group */}
              <div>
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase">Appearance</h3>
                <div className="flex flex-col">
                  {themeOptions.map((item, index) => {
                    const isSelected = settings.theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleThemeChange(item.id)}
                        className={`flex items-center p-4 transition-colors duration-200 ${getGroupItemClass(index, themeOptions.length)} ${
                          isSelected 
                            ? 'bg-primary-container text-on-primary-container' 
                            : 'bg-surface-variant/40 hover:bg-surface-variant/60 active:bg-surface-variant/80 text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className={`w-6 h-6 ${isSelected ? 'text-on-primary-container' : 'text-on-surface-variant'}`} />
                          <span className={`m3-body-large ${isSelected ? 'font-semibold' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferences Group */}
              <div>
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase">Preferences</h3>
                <div className="flex flex-col">
                  {prefOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 bg-surface-variant/40 hover:bg-surface-variant/60 cursor-pointer active:bg-surface-variant/80 transition-colors duration-200 ${getGroupItemClass(index, prefOptions.length)}`}
                      >
                        <div className="pr-4">
                          <p className="m3-body-large text-on-surface font-medium mb-0.5">{item.label}</p>
                          <p className="m3-body-small text-on-surface-variant leading-tight">{item.desc}</p>
                        </div>
                        {/* Modern M3 Switch using pure Tailwind */}
                        <div className="shrink-0 relative">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(item.id as keyof AppSettings, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[52px] h-8 rounded-full border-2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex items-center ${
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-variant border-outline/40'
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
                <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase">Learning</h3>
                <div className="flex flex-col">
                  {learningOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 bg-surface-variant/40 hover:bg-surface-variant/60 cursor-pointer active:bg-surface-variant/80 transition-colors duration-200 ${getGroupItemClass(index, learningOptions.length)}`}
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
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-variant border-outline/40'
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