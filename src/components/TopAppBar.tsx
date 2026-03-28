import React, { useState, useEffect } from 'react';
import { Info, PlayCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { SettingsDrawer } from './SettingsDrawer';
import { TipsOverlay } from './TipsOverlay';
import { VideoTutorialModal } from './VideoTutorialModal';
import { triggerHaptic } from '../utils/haptics';
import { useDebounce } from '../hooks/useDebounce';

interface TopAppBarProps {
  title?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ title }) => {
  const {
    searchQuery,
    setSearchQuery,
    userAvatar,
    settings,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useAppContext();

  const { user } = useAuth();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  const [isTipsOpen,      setIsTipsOpen]      = useState(false);
  const [isVideoOpen,     setIsVideoOpen]     = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    if (searchQuery === '') setLocalSearch('');
  }, [searchQuery]);

  const handleAvatarClick = () => {
    triggerHaptic(settings.hapticsEnabled);
    setIsAuthModalOpen(true);
  };

  const handleMenuClick = () => {
    triggerHaptic(settings.hapticsEnabled);
    setIsSettingsOpen(true);
  };

  // Avatar display: custom upload beats provider photo beats generic ring
  const avatarSrc = userAvatar || user?.photoURL || null;

  // Initials fallback for email accounts with no photo
  const initials = user?.displayName
    ? user.displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  // True only when Firebase has no session at all
  const isSignedOut = !user;

  return (
    <>
      <header className="sticky top-0 z-30 bg-background text-on-surface px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 w-full max-w-full overflow-hidden">

        {/* MENU BUTTON */}
        <button
          onClick={handleMenuClick}
          className="tour-menu-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-variant transition-all duration-200 active:scale-90 text-on-surface-variant flex-shrink-0"
          aria-label="Open settings menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <rect x="3" y="6"  width="18" height="2" />
            <rect x="3" y="11" width="18" height="2" />
            <rect x="3" y="16" width="18" height="2" />
          </svg>
        </button>

        {/* TITLE OR SEARCH */}
        {title ? (
          <div className="flex-1 min-w-0 flex items-center justify-center h-14">
            <h1 className="text-[22px] font-medium text-on-surface truncate">{title}</h1>
          </div>
        ) : (
          <div className="tour-search-bar flex-1 min-w-0 flex items-center bg-surface-variant/40 hover:bg-surface-variant/70 rounded-full pl-4 pr-1.5 h-14 transition-colors duration-200 focus-within:bg-surface-variant/70">

            <input
              type="text"
              placeholder="Search words..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 min-w-0 w-full text-on-surface placeholder:text-on-surface-variant m3-body-large truncate mr-2"
            />

            <div className="flex items-center shrink-0">

              {localSearch.length > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic(settings.hapticsEnabled);
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
                  aria-label="Clear search"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsVideoOpen(true);
                }}
                className="tour-video-tutorial w-10 h-10 flex items-center justify-center rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
                aria-label="Video Tutorial"
              >
                <PlayCircle className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsTipsOpen(true);
                }}
                className="tour-grammar-tips w-10 h-10 flex items-center justify-center rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
                aria-label="Grammar Tips"
              >
                <Info className="w-6 h-6" />
              </button>

            </div>
          </div>
        )}

        {/* USER AVATAR — opens AuthModal */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleAvatarClick}
            className="tour-user-avatar w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-surface-variant/40 hover:bg-surface-variant transition-all duration-200 active:scale-90"
            aria-label="Open profile"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="User avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : initials ? (
              <span className="text-[10px] font-bold text-primary">{initials}</span>
            ) : (
              /* Not signed in — person silhouette, same idea as Google */
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-on-surface-variant">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            )}
          </button>

          {/* Small red dot when signed out — signals "tap to sign in" */}
          {isSignedOut && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-background pointer-events-none" />
          )}
        </div>

      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <TipsOverlay
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
      />

      <VideoTutorialModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />
    </>
  );
};
