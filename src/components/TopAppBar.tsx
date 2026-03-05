import React, { useState, useRef } from 'react';
import { User, Info, PlayCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SettingsDrawer } from './SettingsDrawer';
import { TipsOverlay } from './TipsOverlay';
import { VideoTutorialModal } from './VideoTutorialModal';
import { triggerHaptic } from '../utils/haptics';

interface TopAppBarProps {
  title?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ title }) => {
  const { searchQuery, setSearchQuery, userAvatar, setUserAvatar, settings } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-background text-on-surface px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
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
        
        {title ? (
          <div className="flex-1 min-w-0 flex items-center justify-center h-14">
            <h1 className="text-[22px] font-medium text-on-surface truncate">{title}</h1>
          </div>
        ) : (
          <div className="tour-search-bar flex-1 min-w-0 flex items-center bg-surface-variant rounded-full px-4 h-14 shadow-sm transition-all duration-300 focus-within:shadow-md relative">
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 w-full text-on-surface placeholder:text-on-surface-variant m3-body-large truncate pr-28"
            />
            
            {searchQuery.length > 0 && (
              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setSearchQuery('');
                }}
                className="absolute right-[88px] p-1.5 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="absolute right-2 flex items-center gap-1">
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
        
        <button 
          onClick={handleAvatarClick}
          className="tour-user-avatar rounded-full hover:bg-surface-variant transition-all duration-200 active:scale-90 flex-shrink-0 overflow-hidden w-10 h-10 flex items-center justify-center bg-surface-variant/50 border border-outline/10" 
          aria-label="Upload user avatar"
        >
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="User avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-on-surface-variant" />
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
      
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
      <VideoTutorialModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  );
};