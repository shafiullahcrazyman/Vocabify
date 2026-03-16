import React, { useState, useRef, useEffect } from 'react';
import { User, Info, PlayCircle, X, Menu } from 'lucide-react';
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
      <header className="sticky top-0 z-30 bg-background text-on-surface px-4 py-3 flex items-center gap-4 w-full max-w-full overflow-hidden">
        
        {/* Menu Button */}
        <button 
          onClick={handleMenuClick}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors active:scale-95 text-on-surface-variant shrink-0"
          aria-label="Open settings menu"
        >
          <Menu strokeWidth={2.5} className="w-6 h-6" />
        </button>
        
        {title ? (
          <div className="flex-1 min-w-0 flex items-center justify-center h-[56px]">
            <h1 className="m3-title-large text-on-surface truncate">{title}</h1>
          </div>
        ) : (
          /* M3 Expressive Search Bar: 56dp height, Surface Container High, Fully Rounded, 0px Shadow */
          <div className="flex-1 min-w-0 flex items-center bg-surface-container-high rounded-full pl-5 pr-2 h-[56px] transition-colors focus-within:bg-surface-container-highest">
            
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
                  className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsVideoOpen(true);
                }}
                className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
              >
                <PlayCircle className="w-[22px] h-[22px]" strokeWidth={2} />
              </button>
              
              <button
                onClick={() => {
                  triggerHaptic(settings.hapticsEnabled);
                  setIsTipsOpen(true);
                }}
                className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90"
              >
                <Info className="w-[22px] h-[22px]" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
        
        {/* Avatar */}
        <button 
          onClick={handleAvatarClick}
          className="rounded-full hover:opacity-80 transition-all duration-200 active:scale-90 flex-shrink-0 overflow-hidden w-10 h-10 flex items-center justify-center bg-surface-container-highest" 
          aria-label="Upload user avatar"
        >
          {userAvatar ? (
            <img src={userAvatar} alt="User avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-[22px] h-[22px] text-on-surface-variant" />
          )}
        </button>
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </header>
      
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TipsOverlay isOpen={isTipsOpen} onClose={() => setIsTipsOpen(false)} />
      <VideoTutorialModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  );
};