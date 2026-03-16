import React from 'react';
import { Home, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppContext();

  const tabs = [
    { id: 'home', path: '/home', label: 'Home', icon: Home },
    { id: 'filter', path: '/filter', label: 'Filter', icon: SlidersHorizontal },
    { id: 'progress', path: '/progress', label: 'Progress', icon: TrendingUp },
  ] as const;

  const handleTabClick = (path: string) => {
    triggerHaptic(settings.hapticsEnabled);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container h-[80px] flex justify-around items-center px-2 z-10 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname.startsWith(tab.path);
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className="relative flex flex-col items-center justify-center w-20 h-full select-none"
          >
            {/* The M3 Active Pill (32x64dp) */}
            <div className="relative w-16 h-8 flex items-center justify-center mb-1 rounded-full">
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-primary-container rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <Icon 
                className={`relative z-10 w-6 h-6 transition-colors duration-200 ${
                  isActive ? 'text-on-primary-container fill-on-primary-container/20' : 'text-on-surface-variant'
                }`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
            </div>
            
            {/* The Label */}
            <span 
              className={`m3-label-small transition-colors duration-200 ${
                isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};