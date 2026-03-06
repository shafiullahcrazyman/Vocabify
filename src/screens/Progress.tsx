import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Target, RotateCcw, Trophy, Copy, Check, Download, X, Flame, Sparkles, CalendarDays } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TopAppBar } from '../components/TopAppBar';

export const Progress: React.FC = () => {
  const { settings, updateSettings, progress, resetProgress, words } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // --- PROGRESS CALCULATIONS ---
  const totalWords = words.length;
  const learnedWordsData = words.filter(w => progress.learned.includes(w.id));
  const learnedWords = learnedWordsData.length;
  const percentage = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;

  // --- DAILY GOAL CALCULATIONS ---
  const today = new Date().toISOString().split('T')[0];
  const learnedDates = progress.learnedDates || {};
  const wordsLearnedToday = Object.values(learnedDates).filter(date => date === today).length;
  const dailyGoal = settings.dailyGoal;
  const dailyPercentage = Math.min(Math.round((wordsLearnedToday / dailyGoal) * 100), 100);
  const isGoalReached = wordsLearnedToday >= dailyGoal;

  // --- EXPORT CALCULATIONS & GROUPING ---
  const groupedWords = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    progress.learned.forEach(id => {
      const date = progress.learnedDates?.[id] || 'Unknown Date';
      const word = words.find(w => w.id === id);
      
      if (word) {
        if (!groups[date]) groups[date] = [];
        
        // Format exactly as requested (strip id, level, cefr, theme)
        groups[date].push({
          noun: word.noun && word.noun !== 'none' ? word.noun : "x",
          verb: word.verb && word.verb !== 'none' ? word.verb : "x",
          adjective: word.adjective && word.adjective !== 'none' ? word.adjective : "x",
          adverb: word.adverb && word.adverb !== 'none' ? word.adverb : "x",
          meaning_bn: word.meaning_bn,
          example: word.example
        });
      }
    });

    // Sort dates newest first
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Unknown Date') return 1;
      if (b === 'Unknown Date') return -1;
      return b.localeCompare(a); 
    });

    const sortedGroups: Record<string, any[]> = {};
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [progress, words]);

  // Generate the final JSON based on selected dates
  const exportDataToCopy = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.keys(groupedWords).forEach(date => {
      if (selectedDates.includes(date)) {
        result[date] = groupedWords[date];
      }
    });
    return result;
  }, [selectedDates, groupedWords]);

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === 'Unknown Date') return 'Previous Data';
    if (dateStr === today) return 'Today';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCopyJSON = () => {
    triggerHaptic(settings.hapticsEnabled);
    if (Object.keys(exportDataToCopy).length === 0) return;
    
    navigator.clipboard.writeText(JSON.stringify(exportDataToCopy, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenExport = () => {
    triggerHaptic(settings.hapticsEnabled);
    setSelectedDates(Object.keys(groupedWords)); // Select all by default
    setShowExportModal(true);
  };

  const handleToggleDate = (date: string) => {
    triggerHaptic(settings.hapticsEnabled);
    setSelectedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  // Rest handlers
  const handleResetClick = () => { triggerHaptic(settings.hapticsEnabled); setShowConfirm(true); };
  const handleCancelReset = () => { triggerHaptic(settings.hapticsEnabled); setShowConfirm(false); };
  const handleConfirmReset = () => { triggerHaptic(settings.hapticsEnabled); resetProgress(); setShowConfirm(false); };
  const handleCloseExport = () => { triggerHaptic(settings.hapticsEnabled); setShowExportModal(false); };

  return (
    <>
      <TopAppBar title="Your Progress" />
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={settings.animationsEnabled ? { duration: 0.25, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
        className="pb-24 max-w-3xl mx-auto pt-4"
      >
        <div className="px-4 space-y-6">
          
          {/* Overview Card (Total Mastery) */}
          <section className="bg-primary text-on-primary rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <Trophy className="w-8 h-8 mr-3" />
                <h2 className="m3-display-small">{learnedWords}</h2>
              </div>
              <p className="m3-title-medium opacity-90 mb-6">Total Lifetime Mastery</p>
              
              <div className="w-full bg-on-primary/20 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={settings.animationsEnabled ? { duration: 1, ease: [0.2, 0, 0, 1], delay: 0.2 } : { duration: 0.2, ease: "easeOut" }}
                  className="bg-on-primary h-3 rounded-full" 
                />
              </div>
              <p className="m3-label-medium opacity-80 text-right">{percentage}% of entire dictionary</p>
            </div>
            <Trophy className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10" />
          </section>

          {/* Today's Goal Card */}
          <section className="bg-surface rounded-3xl p-6 shadow-sm border border-outline/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <h3 className="m3-title-medium text-on-surface">Today's Goal</h3>
                </div>
                <p className="m3-display-small font-bold text-on-surface tracking-tight">
                  {wordsLearnedToday} <span className="text-2xl font-normal text-on-surface-variant">/ {dailyGoal}</span>
                </p>
              </div>
              {isGoalReached && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-sm"
                >
                  <Sparkles size={16} />
                  Goal Reached!
                </motion.div>
              )}
            </div>

            <div className="w-full bg-surface-variant rounded-full h-4 mb-2 overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dailyPercentage}%` }}
                transition={settings.animationsEnabled ? { duration: 1.2, ease: "easeOut" } : { duration: 0.2 }}
                className={`h-full rounded-full relative overflow-hidden ${isGoalReached ? 'bg-orange-500' : 'bg-primary'}`}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 rounded-t-full"></div>
              </motion.div>
            </div>
            <p className="m3-body-small text-on-surface-variant mt-2">
              {isGoalReached
                ? "Amazing job! You crushed your daily target."
                : `${dailyGoal - wordsLearnedToday} more words to hit your streak.`}
            </p>
          </section>

          {/* Learning Goals Settings */}
          <section className="bg-surface rounded-3xl p-6 shadow-sm border border-outline/10">
            <div className="flex items-center mb-6 text-on-surface">
              <Target className="w-6 h-6 mr-3 text-primary" />
              <h2 className="m3-title-large">Manage Goals</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="flex justify-between items-center">
                  <div>
                    <p className="m3-body-large text-on-surface">Daily Target</p>
                    <p className="m3-body-small text-on-surface-variant">Update your current goal</p>
                  </div>
                  <select
                    value={settings.dailyGoal}
                    onChange={(e) => {
                      triggerHaptic(settings.hapticsEnabled);
                      updateSettings({ dailyGoal: Number(e.target.value) });
                    }}
                    className="bg-surface-variant text-on-surface rounded-xl px-4 py-2 outline-none border-none m3-body-large cursor-pointer transition-colors hover:bg-surface-variant/80 font-medium"
                  >
                    <option value={5}>5 words</option>
                    <option value={10}>10 words</option>
                    <option value={20}>20 words</option>
                    <option value={50}>50 words</option>
                  </select>
                </label>
              </div>

              <div className="pt-6 border-t border-outline/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="m3-body-large text-on-surface">Reset Progress</p>
                    <p className="m3-body-small text-on-surface-variant">Start over from scratch</p>
                  </div>
                  
                  {showConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelReset}
                        className="px-4 py-2 text-on-surface-variant bg-surface-variant/50 hover:bg-surface-variant rounded-full m3-label-large transition-all duration-200 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmReset}
                        className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-full m3-label-large transition-all duration-200 active:scale-95 shadow-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleResetClick}
                      className="flex items-center px-4 py-2 text-error hover:bg-error/10 rounded-full transition-all duration-200 active:scale-95 m3-label-large"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Export Words */}
          <section className="bg-surface rounded-3xl p-6 shadow-sm border border-outline/10">
            <div className="flex items-center mb-6 text-on-surface">
              <Download className="w-6 h-6 mr-3 text-primary" />
              <h2 className="m3-title-large">Export Words</h2>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="m3-body-large text-on-surface">Export JSON</p>
                <p className="m3-body-small text-on-surface-variant">Copy grouped by date</p>
              </div>
              
              <button
                onClick={handleOpenExport}
                disabled={learnedWords === 0}
                className="px-6 py-2.5 bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-full m3-label-large hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-sm"
              >
                Open
              </button>
            </div>
          </section>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={settings.animationsEnabled ? { duration: 0.3, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: "easeOut" }}
              className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-outline/10 shrink-0">
                <div>
                  <h2 className="text-[22px] font-medium text-on-surface tracking-tight">Export Words</h2>
                  <p className="m3-body-small text-on-surface-variant mt-1">Select dates to export your clean JSON</p>
                </div>
                <button onClick={handleCloseExport} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
                
                {/* Date Selection List */}
                <div className="flex flex-col gap-2">
                  {Object.entries(groupedWords).map(([date, wordsList]) => {
                    const isSelected = selectedDates.includes(date);
                    return (
                      <button
                        key={date}
                        onClick={() => handleToggleDate(date)}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                          isSelected 
                            ? 'bg-primary-container/40 border-primary shadow-sm' 
                            : 'bg-surface border-outline/20 hover:bg-surface-variant/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-primary border-primary text-on-primary' : 'border-outline/50 bg-surface'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className={`font-medium ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                              {formatDateDisplay(date)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold px-2.5 py-1 bg-surface-variant rounded-lg text-on-surface-variant">
                          {wordsList.length} {wordsList.length === 1 ? 'word' : 'words'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* JSON Preview Box */}
                <div className="bg-surface-variant/30 rounded-2xl flex flex-col border border-outline/10 overflow-hidden flex-1 min-h-[250px]">
                  <div className="bg-surface-variant/50 px-4 py-2 border-b border-outline/10 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">JSON Preview</span>
                    <span className="text-xs text-on-surface-variant">{Object.values(exportDataToCopy).flat().length} Total Words</span>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                    <pre className="text-[13px] font-mono text-on-surface-variant whitespace-pre-wrap break-words">
                      {Object.keys(exportDataToCopy).length > 0 
                        ? JSON.stringify(exportDataToCopy, null, 2) 
                        : "// Select a date above to preview data"}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-outline/10 flex justify-end bg-surface shrink-0">
                <button
                  onClick={handleCopyJSON}
                  disabled={selectedDates.length === 0}
                  className={`flex items-center px-6 py-3 rounded-full transition-all duration-200 active:scale-95 m3-label-large shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    copied 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copied Successfully!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Selected JSON
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </>
  );
};