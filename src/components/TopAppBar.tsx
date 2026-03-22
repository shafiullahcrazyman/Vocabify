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
  const { searchQuery, setSearchQuery, userAvatar, setUserAvatar, settings, isSettingsOpen, setIsSettingsOpen } = useAppContext();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Hold a DOM reference before any await — React may recycle the synthetic
    // event object after the first yield, but the underlying input element stays.
    const inputEl = event.target;

    if (!file) return;

    // ── Size check first — cheap, no async I/O needed ──────────────────────
    if (file.size > 2 * 1024 * 1024) {
      alert('Please choose an image smaller than 2MB so it can be saved offline.');
      inputEl.value = '';
      return;
    }

    // ── Magic byte validation ───────────────────────────────────────────────
    // file.type is provided by the OS based on the file extension, not the
    // actual byte content. A user can rename evil.svg → evil.png and bypass
    // an extension-only check. Reading the first 12 bytes of the file confirms
    // the real format regardless of what the OS reports.
    //
    // Signatures used:
    //   JPEG  : FF D8 FF  (bytes 0-2)
    //   PNG   : 89 50 4E 47  (bytes 0-3)
    //   GIF   : 47 49 46 38  (bytes 0-3 — shared prefix for GIF87a & GIF89a)
    //   WebP  : 52 49 46 46 at 0-3 ("RIFF") + 57 45 42 50 at 8-11 ("WEBP")
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const b = new Uint8Array(buffer);

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
      // arrayBuffer() can theoretically throw on a corrupted or unreadable file.
      alert('Could not read the image file. Please try a different one.');
      inputEl.value = '';
      return;
    }

    // ── All checks passed — read as data URL for IndexedDB storage ──────────
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

        {/* USER AVATAR */}
        <button
          onClick={handleAvatarClick}
          className="tour-user-avatar w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-variant/40 hover:bg-surface-variant transition-all duration-200 active:scale-90"
          aria-label="Upload user avatar"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full" />
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