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

  // Data mapping
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
    { id: 'hideLearnedWords', label: 'Hide Learned Words', desc: "Don't show learned words" },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end sm:justify-start">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={settings.animationsEnabled ? { duration: 0.2 } : { duration: 0.1, ease: "easeOut" }}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Drawer (M3 Side Sheet uses surface-container-low) */}
          <motion.div 
            initial={{ x: '100%' }} // Slides in from right on mobile
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={settings.animationsEnabled ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0.15, ease: "easeOut" }}
            className="relative bg-surface-container-low w-full sm:max-w-[380px] h-full flex flex-col shadow-none"
          >
            {/* M3 Header with ArrowLeft */}
            <div className="flex items-center gap-4 p-4 shrink-0 h-[64px]">
              <button 
                onClick={handleClose} 
                className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface transition-colors active:bg-on-surface/20"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Settings</h2>
            </div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 pb-12 space-y-6">
              
              {/* Theme Group (Grouped M3 Radio Buttons) */}
              <div>
                <h3 className="m3-label-medium text-primary px-4 mb-2 tracking-wide uppercase">Appearance</h3>
                {/* M3 Tonal Elevation Container */}
                <div className="bg-surface-container rounded-[28px] flex flex-col overflow-hidden">
                  {themeOptions.map((item, index) => {
                    const isSelected = settings.theme === item.id;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== themeOptions.length - 1 ? 'border-b border-outline-variant/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4 pr-4">
                          <item.icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />
                          <p className={`m3-body-large ${isSelected ? 'text-on-surface font-medium' : 'text-on-surface'}`}>
                            {item.label}
                          </p>
                        </div>
                        
                        {/* Perfect M3 Radio Button */}
                        <div className="shrink-0 relative flex items-center justify-center w-5 h-5 mr-1">
                          <input
                            type="radio"
                            name="theme"
                            value={item.id}
                            checked={isSelected}
                            onChange={() => handleThemeChange(item.id)}
                            className="sr-only"
                          />
                          <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-200 ${
                            isSelected ? 'border-primary' : 'border-on-surface-variant'
                          }`} />
                          <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-200 ${
                            isSelected ? 'scale-100' : 'scale-0'
                          }`} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preferences Group (Grouped M3 Switches) */}
              <div>
                <h3 className="m3-label-medium text-primary px-4 mb-2 tracking-wide uppercase">Preferences</h3>
                {/* M3 Tonal Elevation Container */}
                <div className="bg-surface-container rounded-[28px] flex flex-col overflow-hidden">
                  {prefOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== prefOptions.length - 1 ? 'border-b border-outline-variant/30' : ''
                        }`}
                      >
                        <div className="pr-4">
                          <p className="m3-body-large text-on-surface font-medium mb-0.5">{item.label}</p>
                          <p className="m3-body-medium text-on-surface-variant leading-tight">{item.desc}</p>
                        </div>
                        
                        {/* Perfect M3 Toggle Switch */}
                        <div className="shrink-0 relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(item.id as keyof AppSettings, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[52px] h-8 rounded-full border-2 transition-colors duration-200 flex items-center px-1 ${
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline'
                          }`}>
                            <div className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                              isChecked ? 'w-6 h-6 bg-on-primary translate-x-[20px]' : 'w-4 h-4 bg-outline translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Learning Options Group (Grouped M3 Switches) */}
              <div>
                <h3 className="m3-label-medium text-primary px-4 mb-2 tracking-wide uppercase">Learning</h3>
                {/* M3 Tonal Elevation Container */}
                <div className="bg-surface-container rounded-[28px] flex flex-col overflow-hidden">
                  {learningOptions.map((item, index) => {
                    const isChecked = settings[item.id as keyof AppSettings] as boolean;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                          index !== learningOptions.length - 1 ? 'border-b border-outline-variant/30' : ''
                        }`}
                      >
                        <div className="pr-4">
                          <p className="m3-body-large text-on-surface font-medium mb-0.5">{item.label}</p>
                          <p className="m3-body-medium text-on-surface-variant leading-tight">{item.desc}</p>
                        </div>
                        
                        {/* Perfect M3 Toggle Switch */}
                        <div className="shrink-0 relative flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggle(item.id as keyof AppSettings, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-[52px] h-8 rounded-full border-2 transition-colors duration-200 flex items-center px-1 ${
                            isChecked ? 'bg-primary border-primary' : 'bg-surface-container-highest border-outline'
                          }`}>
                            <div className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                              isChecked ? 'w-6 h-6 bg-on-primary translate-x-[20px]' : 'w-4 h-4 bg-outline translate-x-0'
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