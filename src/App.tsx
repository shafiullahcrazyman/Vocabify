import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// ADDED: MotionGlobalConfig to act as the Master Switch for animations
import { AnimatePresence, MotionConfig, MotionGlobalConfig } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { TooltipGuide } from './components/TooltipGuide';
import { Home } from './screens/Home';
import { Filter } from './screens/Filter';
import { Progress } from './screens/Progress';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/home" element={<Home />} />
        <Route path="/filter" element={<Filter />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { settings } = useAppContext();
  
  // NEW: This listens to your settings. If animations are disabled, 
  // it forces the animation engine to instantly skip to the end (0 seconds).
  useEffect(() => {
    MotionGlobalConfig.skipAnimations = !settings.animationsEnabled;
  }, [settings.animationsEnabled]);
  
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <div className="min-h-screen bg-background text-on-background selection:bg-primary/20 flex flex-col">
          <div className="flex-1 relative">
            <AnimatedRoutes />
          </div>
          <BottomNav />
          <TooltipGuide />
        </div>
      </HashRouter>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}