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
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container h-[80px] flex justify-around items-center px-2 z-10 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.path)}
            className={`tour-${tab.id}-tab flex flex-col items-center justify-center w-16 h-full transition-all duration-200 active:scale-95 ${
              isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div
              className={`px-5 py-1 rounded-full mb-1 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                isActive ? 'bg-primary-container text-on-primary-container scale-100' : 'bg-transparent scale-95'
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <span className={`text-[12px] font-medium tracking-wide transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};