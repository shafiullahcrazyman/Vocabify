import React, { useState, useRef, useEffect } from 'react';
import { Info, PlayCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SettingsDrawer } from './SettingsDrawer';
import { TipsOverlay } from './TipsOverlay';
import { VideoTutorialModal } from './VideoTutorialModal';
import { triggerHaptic } from '../utils/haptics';
import { useDebounce } from '../hooks/useDebounce';

interface TopAppBarProps {
  title?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ title }) => {
  const { searchQuery, setSearchQuery, userAvatar, setUserAvatar, settings } = useAppContext();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  useEffect(() => {
    if (searchQuery === '') setLocalSearch('');
  }, [searchQuery]);

  const handleAvatarClick = () => {
    triggerHaptic(settings.hapticsEnabled);
    fileInputRef.current?.click();
  };

  const handleMenuClick = () => {
    triggerHaptic(settings.hapticsEnabled);
    setIsSettingsOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please choose an image smaller than 2MB so it can be saved offline.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 w-full max-w-full overflow-hidden">

        {/* MENU BUTTON */}
        <button
          onClick={handleMenuClick}
          className="tour-menu-btn w-12 h-12 flex items-center justify-center rounded-full hover:bg-on-surface/10 transition-colors active:scale-90 text-on-surface-variant flex-shrink-0"
          aria-label="Open settings menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <rect x="3" y="6" width="18" height="2" />
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
          <div className="tour-search-bar flex-1 min-w-0 flex items-center bg-surface-container-high rounded-full pl-5 pr-2 h-14 transition-colors focus-within:bg-surface-container-highest">

            <input
              type="text"
              placeholder="Search words..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 min-w-0 w-full text-on-surface placeholder:text-on-surface-variant m3-body-large truncate mr-2"
            />

            <div className="flex items-center shrink-0 gap-0.5">

              {localSearch.length > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic(settings.hapticsEnabled);
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="p-1.5 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsVideoOpen(true);
                }}
                className="tour-video-tutorial p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
                aria-label="Video Tutorial"
              >
                <PlayCircle className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </button>

              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsTipsOpen(true);
                }}
                className="tour-grammar-tips p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
                aria-label="Grammar Tips"
              >
                <Info className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </button>

            </div>
          </div>
        )}

        {/* USER AVATAR */}
        <button
          onClick={handleAvatarClick}
          className="tour-user-avatar w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-container-highest border border-outline/5 hover:opacity-80 transition-opacity active:scale-90"
          aria-label="Upload user avatar"
        >
          {userAvatar && (
            <img
              src={userAvatar}
              alt="User avatar"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </header>

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