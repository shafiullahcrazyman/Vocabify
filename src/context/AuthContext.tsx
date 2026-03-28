import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously as fbSignInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithPopup,
  linkWithRedirect,
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

// Mobile browsers block popups — detect and use redirect instead.
const isMobile = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

async function socialSignIn(provider: GoogleAuthProvider | GithubAuthProvider) {
  if (isMobile()) {
    await signInWithRedirect(auth, provider);
    // Page will reload; result is picked up in useEffect below.
  } else {
    await signInWithPopup(auth, provider);
  }
}

async function socialLink(provider: GoogleAuthProvider | GithubAuthProvider) {
  if (!auth.currentUser) return;
  if (isMobile()) {
    await linkWithRedirect(auth.currentUser, provider);
  } else {
    await linkWithPopup(auth.currentUser, provider);
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Handle the result that comes back after a redirect sign-in.
    getRedirectResult(auth).catch(() => {
      // Silently ignore — errors surface through onAuthStateChanged.
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = () => socialSignIn(googleProvider);
  const signInWithGitHub = () => socialSignIn(githubProvider);

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

  const linkWithGoogle = () => socialLink(googleProvider);
  const linkWithGitHub = () => socialLink(githubProvider);

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
