import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, MotionGlobalConfig } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { Filter } from './screens/Filter';
import { Progress } from './screens/Progress';
import { useSwipeNav } from './hooks/useSwipeNav';

// Resets window scroll to the top on every route change.
// Without this, navigating Home → Filter inherits whatever scrollY Home was at.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

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

/**
 * AppShell — lives inside HashRouter so it can call useNavigate / useLocation.
 * Attaches pointer event handlers to the full-screen wrapper so that any
 * horizontal swipe anywhere on the page triggers tab navigation.
 *
 * touchAction: 'pan-y' tells the browser we only care about vertical panning
 * for scroll — horizontal gestures are handled by us.
 */
function AppShell() {
  const { onPointerDown, onPointerUp, onPointerCancel } = useSwipeNav();

  return (
    <div
      className="min-h-screen bg-background text-on-background selection:bg-primary/20 flex flex-col"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex-1 relative">
        <AnimatedRoutes />
      </div>
      <BottomNav />
    </div>
  );
}

function AppContent() {
  const { settings } = useAppContext();

  useEffect(() => {
    MotionGlobalConfig.skipAnimations = !settings.animationsEnabled;
  }, [settings.animationsEnabled]);

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <ScrollToTop />
        <AppShell />
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
