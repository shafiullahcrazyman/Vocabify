import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Target, RotateCcw, Award, Copy, Check, Download, X, Flame, Sparkles, ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TopAppBar } from '../components/TopAppBar';

export const Progress: React.FC = () => {
  const { settings, updateSettings, progress, resetProgress, words } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCount, setExportCount] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  const { learnedWordsData, learnedWords, percentage, totalWords } = useMemo(() => {
    const total = words.length;
    const learnedData = words.filter(w => progress.learned.includes(w.id));
    const count = learnedData.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { learnedWordsData: learnedData, learnedWords: count, percentage: pct, totalWords: total };
  }, [words, progress.learned]);

  const { wordsLearnedToday, dailyPercentage, isGoalReached } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const learnedDates = progress.learnedDates || {};
    const count = Object.values(learnedDates).filter(date => date === today).length;
    const goal = settings.dailyGoal;
    const pct = Math.min(Math.round((count / goal) * 100), 100);
    return { wordsLearnedToday: count, dailyPercentage: pct, isGoalReached: count >= goal };
  }, [progress.learnedDates, settings.dailyGoal]);

  const handleCopyJSON = () => {
    triggerHaptic(settings.hapticsEnabled);
    const dataToExport = exportCount === -1 ? learnedWordsData : learnedWordsData.slice(0, exportCount);
    navigator.clipboard.writeText(JSON.stringify(dataToExport, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetClick = () => { triggerHaptic(settings.hapticsEnabled); setShowConfirm(true); };
  const handleCancelReset = () => { triggerHaptic(settings.hapticsEnabled); setShowConfirm(false); };
  const handleConfirmReset = () => { triggerHaptic(settings.hapticsEnabled); resetProgress(); setShowConfirm(false); };
  const handleOpenExport = () => { triggerHaptic(settings.hapticsEnabled); setShowExportModal(true); };
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
          
          {/* Overview Card */}
          <section className="bg-primary text-on-primary rounded-3xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <Award className="w-8 h-8" />
                  <h2 className="m3-title-large text-on-primary">Total Mastery</h2>
                </div>
                <p className="text-3xl font-bold tracking-tight mt-2">
                  {learnedWords} <span className="text-xl font-medium opacity-80">/ {totalWords}</span>
                </p>
              </div>
            </div>
            
            <div className="w-full bg-on-primary/20 rounded-full h-4 mb-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={settings.animationsEnabled ? { duration: 1, ease: [0.2, 0, 0, 1], delay: 0.2 } : { duration: 0.2, ease: "easeOut" }}
                className="bg-on-primary h-full rounded-full" 
              />
            </div>
            <p className="m3-body-small opacity-80 text-right">{percentage}% of entire dictionary</p>
          </section>

          {/* Today's Goal Card */}
          <section className="bg-surface-container-low rounded-3xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
                  <h2 className="m3-title-large text-on-surface">Today's Goal</h2>
                </div>
                <p className="text-3xl font-bold text-on-surface tracking-tight mt-2">
                  {wordsLearnedToday} <span className="text-xl font-medium text-on-surface-variant">/ {settings.dailyGoal}</span>
                </p>
              </div>
              {isGoalReached && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-orange-500/15 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 mt-1"
                >
                  <Sparkles size={16} />
                  Reached!
                </motion.div>
              )}
            </div>

            <div className="w-full bg-surface-container-highest rounded-full h-4 mb-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dailyPercentage}%` }}
                transition={settings.animationsEnabled ? { duration: 1.2, ease: "easeOut" } : { duration: 0.2 }}
                className={`h-full rounded-full ${isGoalReached ? 'bg-orange-500' : 'bg-primary'}`}
              />
            </div>
            <p className="m3-body-small text-on-surface-variant text-right">
              {isGoalReached
                ? "Streak maintained!"
                : `${settings.dailyGoal - wordsLearnedToday} more to go`}
            </p>
          </section>

          {/* Learning Goals Settings */}
          <section className="bg-surface-container-low rounded-3xl p-6">
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
                  <div className="relative inline-block">
                    <select
                      value={settings.dailyGoal}
                      onChange={(e) => {
                        triggerHaptic(settings.hapticsEnabled);
                        updateSettings({ dailyGoal: Number(e.target.value) });
                      }}
                      className="appearance-none bg-surface-container-highest text-on-surface rounded-xl pl-4 pr-10 py-2 outline-none border-none m3-body-large cursor-pointer transition-colors font-medium"
                    >
                      <option value={5}>5 words</option>
                      <option value={10}>10 words</option>
                      <option value={20}>20 words</option>
                      <option value={50}>50 words</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface pointer-events-none opacity-70" />
                  </div>
                </label>
              </div>

              <div className="pt-6 border-t border-surface-container-highest">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="m3-body-large text-on-surface">Reset Progress</p>
                    <p className="m3-body-small text-on-surface-variant">
                      Start over from scratch
                    </p>
                  </div>
                  
                  {showConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelReset}
                        className="px-4 py-2 text-on-surface-variant bg-surface-container-highest hover:opacity-80 rounded-full m3-label-large transition-all duration-200 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmReset}
                        className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-full m3-label-large transition-all duration-200 active:scale-95"
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
          <section className="bg-surface-container-low rounded-3xl p-6">
            <div className="flex items-center mb-6 text-on-surface">
              <Download className="w-6 h-6 mr-3 text-primary" />
              <h2 className="m3-title-large">Export Words</h2>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="m3-body-large text-on-surface">Export JSON</p>
                <p className="m3-body-small text-on-surface-variant">Copy your learned words</p>
              </div>
              
              <button
                onClick={handleOpenExport}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-full m3-label-large hover:bg-primary/90 transition-all duration-200 active:scale-95"
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
              className="bg-surface-container-high w-full max-w-2xl max-h-full rounded-3xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 px-6 border-b border-outline/10">
                <h2 className="m3-title-large text-on-surface">Export Learned Words</h2>
                <button onClick={handleCloseExport} className="p-2 -mr-2 rounded-full hover:bg-on-surface/10 text-on-surface-variant transition-colors active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <p className="m3-body-large text-on-surface">
                    You have learned <span className="font-bold text-primary">{learnedWordsData.length}</span> words.
                  </p>
                  
                  <div className="relative inline-block">
                    <select
                      value={exportCount}
                      onChange={(e) => setExportCount(Number(e.target.value))}
                      className="appearance-none bg-surface-container-highest text-on-surface rounded-xl pl-4 pr-10 py-2 outline-none border-none m3-body-large cursor-pointer transition-colors"
                    >
                      <option value={10}>10 words</option>
                      <option value={20}>20 words</option>
                      <option value={50}>50 words</option>
                      <option value={100}>100 words</option>
                      <option value={-1}>All learned words</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface pointer-events-none opacity-70" />
                  </div>
                </div>

                <div className="bg-surface-container-highest rounded-2xl p-4 flex-1 overflow-y-auto min-h-[250px] max-h-[400px]">
                  <pre className="text-[13px] font-mono text-on-surface-variant whitespace-pre-wrap break-words">
                    {JSON.stringify(exportCount === -1 ? learnedWordsData : learnedWordsData.slice(0, exportCount), null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-outline/10 flex justify-end bg-surface-container-high">
                <button
                  onClick={handleCopyJSON}
                  className={`flex items-center px-6 py-2.5 rounded-full transition-colors duration-200 active:scale-95 m3-label-large ${
                    copied 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied JSON!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
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