import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Eye, EyeOff, User, LogOut, Github, UserPlus, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

// ─── Google branded icon ────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

function getProviderLabel(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '';
  if (user.isAnonymous) return 'Guest account';
  const provider = user.providerData[0]?.providerId ?? '';
  if (provider.includes('google'))  return 'Signed in with Google';
  if (provider.includes('github'))  return 'Signed in with GitHub';
  if (provider.includes('password')) return user.email ?? '';
  return user.email ?? '';
}

// ─── Social button ──────────────────────────────────────────────────────────
function SocialButton({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border border-outline/30 bg-surface hover:bg-surface-variant/50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-on-surface"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

// ─── Text input ─────────────────────────────────────────────────────────────
function Field({
  icon, type = 'text', placeholder, value, onChange, disabled,
  rightSlot,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-surface-variant/40 focus-within:bg-surface-variant/70 transition-colors">
      <span className="text-on-surface-variant flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant disabled:opacity-60"
      />
      {rightSlot}
    </div>
  );
}

// ─── Error banner ────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-error/10 text-error text-xs">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-outline/20" />
      <span className="text-xs text-on-surface-variant">{label}</span>
      <div className="flex-1 h-px bg-outline/20" />
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, signInAsGuest, linkWithGoogle, linkWithGitHub, signOut } = useAuth();
  const { settings, userAvatar, setUserAvatar, streak } = useAppContext();

  // Auth form state
  const [tab, setTab]           = useState<'signin' | 'signup'>('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn  = !!user;
  const isAnonymous = user?.isAnonymous ?? false;

  const clearForm = () => {
    setName(''); setEmail(''); setPassword(''); setError(''); setShowPw(false);
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleTabChange = (t: 'signin' | 'signup') => {
    setTab(t);
    setError('');
  };

  function friendlyError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Incorrect email or password.';
      case 'auth/email-already-in-use':        return 'This email is already registered.';
      case 'auth/weak-password':               return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':               return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':        return 'Sign-in window was closed. Please try again.';
      case 'auth/credential-already-in-use':   return 'This account is already linked to another user.';
      case 'auth/cancelled-popup-request':     return '';
      default:                                 return 'Something went wrong. Please try again.';
    }
  }

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    setError('');
    try {
      await fn();
      handleClose();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      const msg  = friendlyError(code);
      if (msg) setError(code ? `${msg} (${code})` : msg);
      else if (code) setError(code);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogle = () => run(signInWithGoogle);
  const handleGitHub = () => run(signInWithGitHub);
  const handleGuest  = () => run(signInAsGuest);

  const handleEmailSubmit = () => {
    if (tab === 'signin') {
      run(() => signInWithEmail(email, password));
    } else {
      if (!name.trim()) { setError('Please enter your name.'); return; }
      run(() => signUpWithEmail(email, password, name));
    }
  };

  const handleLinkGoogle = () => run(linkWithGoogle);
  const handleLinkGitHub = () => run(linkWithGitHub);

  const handleSignOut = async () => {
    triggerHaptic(settings.hapticsEnabled);
    await signOut();
    handleClose();
  };

  // ── Avatar upload (same validation as original TopAppBar) ─────────────────
  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file    = event.target.files?.[0];
    const inputEl = event.target;
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image smaller than 2 MB.');
      inputEl.value = '';
      return;
    }

    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const b      = new Uint8Array(buffer);
      const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
      const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
      const isGif  = b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
      const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
                  && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;

      if (!isJpeg && !isPng && !isGif && !isWebp) {
        alert('Only JPEG, PNG, GIF, or WebP images are allowed.');
        inputEl.value = '';
        return;
      }
    } catch {
      alert('Could not read the image file. Please try a different one.');
      inputEl.value = '';
      return;
    }

    const reader      = new FileReader();
    reader.onloadend  = () => setUserAvatar(reader.result as string);
    reader.readAsDataURL(file);
    inputEl.value = '';
  };

  // ── Avatar display logic ──────────────────────────────────────────────────
  const avatarSrc = userAvatar || user?.photoURL || null;

  // ── Views ─────────────────────────────────────────────────────────────────

  const profileView = (
    <div className="flex flex-col gap-5">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="relative">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
            aria-label="Upload photo"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{getInitials(user?.displayName)}</span>
            )}
          </button>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center border-2 border-background pointer-events-none">
            <Upload className="w-3 h-3 text-on-surface-variant" />
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />

        <div className="text-center">
          <p className="font-semibold text-on-surface text-base leading-tight">
            {isAnonymous ? 'Guest' : (user?.displayName || 'Vocabify User')}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">{getProviderLabel(user)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-surface-variant/30">
          <span className="text-xl font-bold text-primary">{streak.totalXP ?? 0}</span>
          <span className="text-xs text-on-surface-variant mt-0.5">Total XP</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-surface-variant/30">
          <span className="text-xl font-bold text-primary">{streak.current}</span>
          <span className="text-xs text-on-surface-variant mt-0.5">Day streak</span>
        </div>
        <div className="flex-1 flex flex-col items-center py-3 rounded-2xl bg-surface-variant/30">
          <span className="text-xl font-bold text-primary">{streak.longest}</span>
          <span className="text-xs text-on-surface-variant mt-0.5">Best streak</span>
        </div>
      </div>

      {/* Anonymous upgrade banner */}
      {isAnonymous && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5">
          <p className="text-sm font-medium text-on-surface">Save your progress forever</p>
          <p className="text-xs text-on-surface-variant -mt-2">
            Link a real account to sync across devices. Your XP and words are kept.
          </p>
          {error && <ErrorBanner msg={error} />}
          <SocialButton icon={<GoogleIcon />} label="Link with Google" onClick={handleLinkGoogle} disabled={loading} />
          <SocialButton icon={<Github className="w-5 h-5" />} label="Link with GitHub" onClick={handleLinkGitHub} disabled={loading} />
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-error/30 text-error text-sm font-medium hover:bg-error/10 transition-colors active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );

  const authView = (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-surface-variant/30">
        {(['signin', 'signup'] as const).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Social */}
      <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={handleGoogle} disabled={loading} />
      <SocialButton icon={<Github className="w-5 h-5" />} label="Continue with GitHub" onClick={handleGitHub} disabled={loading} />

      <Divider />

      {/* Email fields */}
      <div className="flex flex-col gap-2">
        {error && <ErrorBanner msg={error} />}

        {tab === 'signup' && (
          <Field
            icon={<User className="w-4 h-4" />}
            placeholder="Your name"
            value={name}
            onChange={setName}
            disabled={loading}
          />
        )}

        <Field
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={setEmail}
          disabled={loading}
        />

        <Field
          icon={<Lock className="w-4 h-4" />}
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={setPassword}
          disabled={loading}
          rightSlot={
            <button
              onClick={() => setShowPw(p => !p)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <button
          onClick={handleEmailSubmit}
          disabled={loading || !email || !password}
          className="w-full h-12 rounded-2xl bg-primary text-on-primary font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
      </div>

      <Divider />

      {/* Guest */}
      <button
        onClick={handleGuest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 text-sm transition-colors active:scale-[0.98] disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
        Continue without account
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="auth-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-xl max-h-[90dvh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-on-surface-variant/30" />
            </div>

            <div className="px-5 pt-2 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-on-surface">
                  {isLoggedIn ? 'Your Profile' : 'Welcome to Vocabify'}
                </h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoggedIn ? profileView : authView}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
