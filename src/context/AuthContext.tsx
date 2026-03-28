import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInAnonymously as fbSignInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithPopup,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user:             User | null;
  authLoading:      boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail:  (email: string, password: string) => Promise<void>;
  signUpWithEmail:  (email: string, password: string, name: string) => Promise<void>;
  signInAsGuest:    () => Promise<void>;
  linkWithGoogle:   () => Promise<void>;
  linkWithGitHub:   () => Promise<void>;
  signOut:          () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]             = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithGitHub = async () => {
    await signInWithPopup(auth, githubProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  };

  const signInAsGuest = async () => {
    await fbSignInAnonymously(auth);
  };

  /** Upgrades an anonymous account to Google — keeps all existing progress. */
  const linkWithGoogle = async () => {
    if (!auth.currentUser) return;
    await linkWithPopup(auth.currentUser, googleProvider);
  };

  /** Upgrades an anonymous account to GitHub — keeps all existing progress. */
  const linkWithGitHub = async () => {
    if (!auth.currentUser) return;
    await linkWithPopup(auth.currentUser, githubProvider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user, authLoading,
      signInWithGoogle, signInWithGitHub,
      signInWithEmail,  signUpWithEmail,
      signInAsGuest,
      linkWithGoogle, linkWithGitHub,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
