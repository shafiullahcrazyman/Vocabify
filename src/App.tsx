import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, MotionGlobalConfig } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './firebase';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { Filter } from './screens/Filter';
import { Progress } from './screens/Progress';
import { Learn } from './screens/Learn';
import { useSwipeNav } from './hooks/useSwipeNav';
import { StreakData } from './types';

// ─── Resets window scroll to the top on every route change ──────────────────
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
        <Route path="/home"     element={<Home />} />
        <Route path="/filter"   element={<Filter />} />
        <Route path="/progress" element={<Progress />} />
        {/* key by location.key so navigate('/learn') from /learn always remounts fresh */}
        <Route path="/learn"    element={<Learn key={location.key} />} />
        <Route path="*"         element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const { onPointerDown, onPointerUp, onPointerCancel } = useSwipeNav();
  const location    = useLocation();
  const isLearnScreen = location.pathname === '/learn';

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
      {!isLearnScreen && <BottomNav />}
    </div>
  );
}

// ─── Firestore sync (runs inside both providers) ─────────────────────────────
interface CloudData {
  progress?: { learned?: string[]; learnedDates?: Record<string, string> };
  favorites?: string[];
  streak?: StreakData;
}

function mergeData(
  local: { progress: { learned: string[]; learnedDates?: Record<string, string> }; favorites: string[]; streak: StreakData },
  cloud: CloudData,
) {
  const mergedLearned   = Array.from(new Set([...local.progress.learned, ...(cloud.progress?.learned ?? [])]));
  const mergedDates     = { ...(cloud.progress?.learnedDates ?? {}), ...(local.progress.learnedDates ?? {}) };
  const mergedFavorites = Array.from(new Set([...local.favorites, ...(cloud.favorites ?? [])]));
  const localXP         = local.streak.totalXP ?? 0;
  const cloudXP         = cloud.streak?.totalXP ?? 0;

  return {
    progress: { learned: mergedLearned, learnedDates: mergedDates },
    favorites: mergedFavorites,
    streak: {
      current:      Math.max(local.streak.current, cloud.streak?.current ?? 0),
      longest:      Math.max(local.streak.longest, cloud.streak?.longest ?? 0),
      lastGoalDate: localXP >= cloudXP
        ? (local.streak.lastGoalDate || cloud.streak?.lastGoalDate || '')
        : (cloud.streak?.lastGoalDate || local.streak.lastGoalDate || ''),
      totalXP: Math.max(localXP, cloudXP),
    } as StreakData,
  };
}

function FirestoreSync() {
  const { user }                             = useAuth();
  const { progress, favorites, streak, overrideWithCloudData } = useAppContext();
  const hasSynced  = useRef(false);
  const isSyncing  = useRef(false);

  // On login: merge Firestore cloud data with local IndexedDB, write merged back.
  useEffect(() => {
    if (!user) {
      hasSynced.current = false;
      return;
    }

    const doSync = async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap    = await getDoc(userRef);

        if (snap.exists()) {
          const cloud  = snap.data() as CloudData;
          const merged = mergeData({ progress, favorites, streak }, cloud);
          overrideWithCloudData(merged.progress, merged.favorites, merged.streak);
          await setDoc(userRef, { ...merged, updatedAt: new Date().toISOString() }, { merge: true });
        } else {
          // First login — push local data up.
          await setDoc(userRef, {
            progress,
            favorites,
            streak,
            email:       user.email,
            displayName: user.displayName,
            isAnonymous: user.isAnonymous,
            createdAt:   new Date().toISOString(),
            updatedAt:   new Date().toISOString(),
          });
        }
        hasSynced.current = true;
      } catch (err) {
        console.error('[Vocabify] Firestore sync failed:', err);
      } finally {
        isSyncing.current = false;
      }
    };

    doSync();
    // Only re-run when the signed-in user changes (not on every data change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Ongoing write-back: debounced 2 s after any data change.
  useEffect(() => {
    if (!user || !hasSynced.current) return;

    const timer = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          { progress, favorites, streak, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      } catch (err) {
        console.error('[Vocabify] Firestore write-back failed:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [progress, favorites, streak, user]);

  return null;
}

// ─── App content ─────────────────────────────────────────────────────────────
function AppContent() {
  const { settings } = useAppContext();

  useEffect(() => {
    MotionGlobalConfig.skipAnimations = !settings.animationsEnabled;
  }, [settings.animationsEnabled]);

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <ScrollToTop />
        <FirestoreSync />
        <AppShell />
      </HashRouter>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
