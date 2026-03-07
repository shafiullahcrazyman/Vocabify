import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useAppContext();

  // Prevent Tour from starting if this modal is open
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(settings.hapticsEnabled);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={settings.animationsEnabled ? { duration: 0.2 } : { duration: 0.1, ease: "easeOut" }}
          className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={settings.animationsEnabled ? { type: 'spring', damping: 25, stiffness: 300 } : { duration: 0.15, ease: "easeOut" }}
          className="relative bg-surface w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-outline/10 shrink-0">
            <h2 className="text-2xl font-bold text-on-surface">Video Tutorial</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90"
              aria-label="Close tutorial"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-surface-variant/20">
            <div className="w-full aspect-square max-w-[60vh] max-h-[60vh] mx-auto bg-black rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
              <video 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                src="tutorial.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="mt-4 text-center text-on-surface-variant m3-body-medium">
              Watch this quick tutorial to learn how to use Vocabify effectively.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};