import React from 'react';
import { Home, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline/20 h-[60px] flex justify-around items-center px-2 z-10 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`tour-${tab.id}-tab flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-95 ${
              isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div
              className={`px-4 py-0.5 rounded-full mb-0.5 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                isActive ? 'bg-primary-container text-on-primary-container scale-100' : 'bg-transparent scale-95'
              }`}
            >
              <Icon className="w-[22px] h-[22px]" />
            </div>
            <span className={`text-[11px] font-medium tracking-wide transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
