import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sun, Moon, Monitor, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AppSettings } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { defaultSpatial, defaultEffects, exitCurve, fastSpatial } from '../utils/motion';
import { useBackButton } from '../hooks/useBackButton';
import { useNavigate } from 'react-router-dom';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppContext();
  const navigate = useNavigate();

  useBackButton(isOpen, onClose);

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleClose = () => { triggerHaptic(settings.hapticsEnabled, 'tap'); onClose(); };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    if (settings.theme !== theme) {
      triggerHaptic(settings.hapticsEnabled, 'selection');
      updateSettings({ theme });
    }
  };

  const handleToggle = (key: keyof AppSettings, value: boolean) => {
    // Sync haptic: fires AT the moment the toggle state changes
    triggerHaptic(settings.hapticsEnabled, 'toggle');
    updateSettings({ [key]: value });
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System default', icon: Monitor },
  ] as const;

  const prefOptions = [
    { id: 'hapticsEnabled', label: 'Haptic Feedback', desc: 'Vibrate on tap' },
    { id: 'animationsEnabled', label: 'Animations', desc: 'Smooth UI transitions' },
  ] as const;

  const learningOptions = [
    { id: 'autoPronounce', label: 'Auto Pronounce', desc: 'Play audio automatically' },
    { id: 'hideLearnedWords', label: 'Hide Learned Words', desc: "Don't show learned words" },
  ] as const;

  const anim = settings.animationsEnabled;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop — DefaultEffects (partial screen, opacity) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: anim ? defaultEffects : { duration: 0.1 } }}
            exit={{ opacity: 0, transition: anim ? exitCurve : { duration: 0.1 } }}
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer panel — DefaultSpatial (partial screen, position) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0, transition: anim ? defaultSpatial : { duration: 0.15 } }}
            exit={{ x: '-100%', transition: anim ? exitCurve : { duration: 0.15 } }}
            className="relative bg-background w-[calc(100%-56px)] max-w-[380px] h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 shrink-0">
              <motion.button
                onClick={handleClose}
                whileTap={anim ? { scale: 0.88 } : undefined}
                transition={fastSpatial}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="p-3 rounded-full hover:bg-surface-variant text-on-surface"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
              <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Settings</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 space-y-8">

            {/* Start Learning */}
              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled, 'success');
                  // FIX: close the drawer first so its overlay doesn't block the Learn screen.
                  // The exit animation is 150ms (exitCurve), so navigating after 160ms ensures
                  // the drawer is fully gone before Learn mounts.
                  onClose();
                  setTimeout(() => navigate('/learn'), 160);
                }}
                aria-label="Start a learning session"
                className="w-full py-5 bg-primary text-on-primary rounded-full flex items-center justify-center gap-3 active:scale-95 transition-transform duration-150"
                style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.02em' }}
              >
                <Zap className="w-6 h-6" />
                Start Learning
              </button>

              {/* Appearance */}
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
                          <item.icon className="w-6 h-6 text-on-surface-variant" />
                          <p className="m3-body-large text-on-surface">{item.label}</p>
                        </div>
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
                            {/* Spring-animated radio dot */}
                            <motion.div
                              animate={{ scale: isSelected ? 1 : 0 }}
                              transition={anim ? fastSpatial : { duration: 0.1 }}
                              className="w-2.5 h-2.5 rounded-full bg-primary"
                            />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preferences + Learning toggles */}
              {[
                { title: 'Preferences', options: prefOptions },
                { title: 'Learning', options: learningOptions },
              ].map(({ title, options }) => (
                <div key={title}>
                  <h3 className="m3-label-large text-primary px-4 mb-2 tracking-wide uppercase font-bold">{title}</h3>
                  <div className="bg-surface-variant/40 rounded-[28px] flex flex-col overflow-hidden border border-outline/5">
                    {options.map((item, index) => {
                      const isChecked = settings[item.id as keyof AppSettings] as boolean;
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors duration-200 ${
                            index !== options.length - 1 ? 'border-b border-outline/10' : ''
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
                            {/* M3 Toggle — spring-driven thumb movement */}
                            <div className={`w-[52px] h-8 rounded-full border-2 transition-colors duration-200 flex items-center ${
                              isChecked ? 'bg-primary border-primary' : 'bg-surface-variant/80 border-outline/40'
                            }`}>
                              <motion.div
                                animate={{ x: isChecked ? 22 : 2 }}
                                transition={anim ? fastSpatial : { duration: 0.1 }}
                                className={`rounded-full ${isChecked ? 'w-6 h-6 bg-on-primary' : 'w-4 h-4 bg-outline'}`}
                              />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
