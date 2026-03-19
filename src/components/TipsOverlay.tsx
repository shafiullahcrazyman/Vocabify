import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { slowSpatial, slowEffects, exitCurveSlow } from '../utils/motion';
import { useBackButton } from '../hooks/useBackButton';

interface TipsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TipsOverlay: React.FC<TipsOverlayProps> = ({ isOpen, onClose }) => {
  const { settings } = useAppContext();

  // Universal back button support
  useBackButton(isOpen, onClose);

  // Prevent Tour from starting if this modal is open
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleClose = () => {
    triggerHaptic(settings.hapticsEnabled, 'tap');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: settings.animationsEnabled ? slowEffects : { duration: 0.1 } }}
          exit={{ opacity: 0, transition: settings.animationsEnabled ? exitCurveSlow : { duration: 0.1 } }}
          className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: settings.animationsEnabled ? slowSpatial : { duration: 0.15 } }}
          exit={{ opacity: 0, scale: 0.96, y: 16, transition: settings.animationsEnabled ? exitCurveSlow : { duration: 0.1 } }}
          className="relative bg-surface-container-high w-full max-w-2xl max-h-[90vh] rounded-[32px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-outline/10 shrink-0">
            <h2 className="text-2xl font-bold text-on-surface">Grammar Tips</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-all duration-200 active:scale-90"
              aria-label="Close tips"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* 1. Noun */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg text-[13px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase tracking-widest">
                  Noun
                </span>
                <h3 className="m3-title-large text-on-surface">How to Identify a Noun (Naming Words)</h3>
              </div>
              <p className="m3-body-large text-on-surface-variant">Nouns name people, places, things, or ideas.</p>
              
              <div className="bg-surface-container-highest/80 rounded-3xl p-5 space-y-4">
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Suffix Clues
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant mb-2">Look for words ending in:</p>
                  <ul className="space-y-2 m3-body-medium text-on-surface-variant ml-4">
                    <li><strong className="text-on-surface">-tion / -sion:</strong> Education, Decision</li>
                    <li><strong className="text-on-surface">-ment:</strong> Agreement, Payment</li>
                    <li><strong className="text-on-surface">-ness:</strong> Happiness, Kindness</li>
                    <li><strong className="text-on-surface">-ity:</strong> Reality, Ability</li>
                    <li><strong className="text-on-surface">-ance / -ence:</strong> Attendance, Difference</li>
                    <li><strong className="text-on-surface">-er / -or:</strong> Teacher, Actor</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Position Rule
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Nouns usually follow articles (a, an, the) or possessive adjectives (my, your, his).</p>
                  <p className="m3-body-medium text-on-surface-variant italic mt-1 ml-4">• Example: "The decision was mine."</p>
                </div>

                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Test
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Can you put the word "The" or "My" in front of it? If yes, it's likely a noun.</p>
                </div>
              </div>
            </section>

            {/* 2. Verb */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg text-[13px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                  Verb
                </span>
                <h3 className="m3-title-large text-on-surface">How to Identify a Verb (Action/State Words)</h3>
              </div>
              <p className="m3-body-large text-on-surface-variant">Verbs describe an action or a state of being.</p>
              
              <div className="bg-surface-container-highest/80 rounded-3xl p-5 space-y-4">
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Suffix Clues
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant mb-2">Look for words ending in:</p>
                  <ul className="space-y-2 m3-body-medium text-on-surface-variant ml-4">
                    <li><strong className="text-on-surface">-ate:</strong> Educate, Activate</li>
                    <li><strong className="text-on-surface">-ify:</strong> Clarify, Simplify</li>
                    <li><strong className="text-on-surface">-ize / -ise:</strong> Realize, Organise</li>
                    <li><strong className="text-on-surface">-en:</strong> Sharpen, Lighten</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Position Rule
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Usually follows the subject (noun/pronoun).</p>
                  <p className="m3-body-medium text-on-surface-variant italic mt-1 ml-4">• Example: "She simplified the rule."</p>
                </div>

                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Test
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Can you change the tense? Can you add -ed or -ing?</p>
                </div>
              </div>
            </section>

            {/* 3. Adjective */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg text-[13px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                  Adjective
                </span>
                <h3 className="m3-title-large text-on-surface">How to Identify an Adjective (Describing Nouns)</h3>
              </div>
              <p className="m3-body-large text-on-surface-variant">Adjectives describe or modify a noun or pronoun.</p>
              
              <div className="bg-surface-container-highest/80 rounded-3xl p-5 space-y-4">
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Suffix Clues
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant mb-2">Look for words ending in:</p>
                  <ul className="space-y-2 m3-body-medium text-on-surface-variant ml-4">
                    <li><strong className="text-on-surface">-ful:</strong> Beautiful, Helpful</li>
                    <li><strong className="text-on-surface">-able / -ible:</strong> Readable, Possible</li>
                    <li><strong className="text-on-surface">-al:</strong> Natural, Musical</li>
                    <li><strong className="text-on-surface">-ous:</strong> Famous, Dangerous</li>
                    <li><strong className="text-on-surface">-ive:</strong> Active, Creative</li>
                    <li><strong className="text-on-surface">-less:</strong> Careless, Fearless</li>
                    <li><strong className="text-on-surface">-y:</strong> Sunny, Rainy</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Position Rule
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Usually sits before a noun or after a linking verb (like is, am, are, look, feel).</p>
                  <p className="m3-body-medium text-on-surface-variant italic mt-1 ml-4">• Example: "The active boy" or "The boy is active."</p>
                </div>

                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Test
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Does it answer "What kind?", "Which one?", or "How many?"</p>
                </div>
              </div>
            </section>

            {/* 4. Adverb */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg text-[13px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 uppercase tracking-widest">
                  Adverb
                </span>
                <h3 className="m3-title-large text-on-surface">How to Identify an Adverb (Modifying Words)</h3>
              </div>
              <p className="m3-body-large text-on-surface-variant">Adverbs describe verbs, adjectives, or other adverbs.</p>
              
              <div className="bg-surface-container-highest/80 rounded-3xl p-5 space-y-4">
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Suffix Clues
                  </h4>
                  <ul className="space-y-2 m3-body-medium text-on-surface-variant ml-4">
                    <li><strong className="text-on-surface">-ly:</strong> The most common suffix (Adjective + ly = Adverb). Quickly, Happily, Carefully.</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Position Rule
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Can move around in a sentence but often follows the verb or appears at the very beginning/end.</p>
                  <p className="m3-body-medium text-on-surface-variant italic mt-1 ml-4">• Example: "He ran quickly."</p>
                </div>

                <div>
                  <h4 className="m3-title-medium text-on-surface mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Test
                  </h4>
                  <p className="m3-body-medium text-on-surface-variant">Does it answer "How?"</p>
                </div>
              </div>
            </section>

            {/* Quick Summary Table */}
            <section className="space-y-4 pt-4 border-t border-outline/10">
              <h3 className="m3-title-large text-on-surface">Quick Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                  <div className="font-bold text-blue-700 dark:text-blue-300 mb-1">Noun</div>
                  <p className="text-sm text-on-surface-variant mb-2">Names a thing (-tion, -ment, -ness, -ity)</p>
                  <div className="text-sm font-medium text-on-surface bg-surface-container-highest rounded-lg px-3 py-2 inline-block">Education</div>
                </div>
                
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Verb</div>
                  <p className="text-sm text-on-surface-variant mb-2">Shows action (-ate, -ify, -ize, -en)</p>
                  <div className="text-sm font-medium text-on-surface bg-surface-container-highest rounded-lg px-3 py-2 inline-block">Educate</div>
                </div>
                
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                  <div className="font-bold text-amber-700 dark:text-amber-300 mb-1">Adjective</div>
                  <p className="text-sm text-on-surface-variant mb-2">Describes noun (-ful, -able, -al, -ive)</p>
                  <div className="text-sm font-medium text-on-surface bg-surface-container-highest rounded-lg px-3 py-2 inline-block">Educative</div>
                </div>
                
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
                  <div className="font-bold text-purple-700 dark:text-purple-300 mb-1">Adverb</div>
                  <p className="text-sm text-on-surface-variant mb-2">Describes verb (-ly)</p>
                  <div className="text-sm font-medium text-on-surface bg-surface-container-highest rounded-lg px-3 py-2 inline-block">Beautifully</div>
                </div>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};