import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Home, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { fastSpatial } from '../utils/motion';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Always show nav when route changes
  useEffect(() => { setIsVisible(true); }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 20) { setIsVisible(true); lastScrollY.current = currentScrollY; return; }
      if (currentScrollY > lastScrollY.current + 10) setIsVisible(false);
      else if (currentScrollY < lastScrollY.current - 10) setIsVisible(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'home',     path: '/home',     label: 'Home',     icon: Home },
    { id: 'filter',   path: '/filter',   label: 'Filter',   icon: SlidersHorizontal },
    { id: 'progress', path: '/progress', label: 'Progress', icon: TrendingUp },
  ] as const;

  const handleTabClick = (path: string) => {
    // Pre-action selection haptic — fires before navigation
    triggerHaptic(settings.hapticsEnabled, 'selection');
    navigate(path);
  };

  const anim = settings.animationsEnabled;

  return (
    // M3: Nav bar slides off with FastSpatial spring — same spring used for all small UI
    // Spring hide/show feels much more natural than CSS duration transition
    <motion.nav
      animate={{ y: isVisible ? 0 : '150%' }}
      transition={anim ? fastSpatial : { duration: 0.15 }}
      className="fixed bottom-0 left-0 right-0 bg-surface-container h-[60px] flex justify-around items-center px-2 z-10 pb-safe"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <motion.button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            whileTap={anim ? { scale: 0.92 } : undefined}
            transition={fastSpatial}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`tour-${tab.id}-tab flex flex-col items-center justify-center w-16 h-full ${
              isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {/* Active pill — spring-driven width/opacity */}
            <motion.div
              animate={{
                backgroundColor: isActive ? 'rgb(var(--color-primary-container, 232 222 248))' : 'transparent',
                scale: isActive ? 1 : 0.9,
              }}
              transition={anim ? fastSpatial : { duration: 0.1 }}
              className={`px-4 py-0.5 rounded-full mb-0.5 ${
                isActive ? 'text-on-primary-container' : ''
              }`}
            >
              <Icon className="w-[22px] h-[22px]" />
            </motion.div>
            <span className={`text-[11px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
};
