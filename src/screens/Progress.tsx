import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext, getLocalDateString } from '../context/AppContext';
import { Target, RotateCcw, Award, Copy, Check, Download, X, Flame, Sparkles, ChevronDown, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TopAppBar } from '../components/TopAppBar';

interface SectionGroupProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  containerBg?: string;
}

const SectionGroup: React.FC<SectionGroupProps> = ({ title, icon, children, containerBg = 'bg-surface-container-low' }) => {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  const total = validChildren.length;

  const getCornerClass = (index: number) => {
    if (total === 1) return 'rounded-[28px]';
    if (index === 0) return 'rounded-t-[28px] rounded-b-none';
    if (index === total - 1) return 'rounded-b-[28px] rounded-t-none';
    return 'rounded-none';
  };

  return (
    <div>
      {title && (
        <div className="flex items-center px-4 mb-2 text-on-surface">
          {icon && <span className="mr-2 text-primary">{icon}</span>}
          <h2 className="m3-label-large text-primary font-bold uppercase tracking-wide">{title}</h2>
        </div>
      )}
      <div className="flex flex-col rounded-[28px] overflow-hidden">
        {validChildren.map((child, index) => (
          <div
            key={index}
            className={`${containerBg} p-5 sm:p-6 transition-colors duration-200 ${
              index !== total - 1 ? 'border-b border-outline/10' : ''
            } ${getCornerClass(index)}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Progress: React.FC = () => {
  const { settings, updateSettings, progress, resetTotalProgress, resetDailyProgress, words, streak } = useAppContext();

  const [confirmDaily, setConfirmDaily] = useState(false);
  const [confirmTotal, setConfirmTotal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCount, setExportCount] = useState<number>(-1);
  const [copied, setCopied] = useState(false);

  const { learnedWordsData, learnedWords, percentage } = useMemo(() => {
    const total = words.length;
    const learnedData = words.filter(w => progress.learned.includes(w.id));
    const count = learnedData.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { learnedWordsData: learnedData, learnedWords: count, percentage: pct };
  }, [words, progress.learned]);

  const { wordsLearnedToday, dailyPercentage, isGoalReached } = useMemo(() => {
    const today = getLocalDateString();
    const learnedDates = progress.learnedDates || {};
    const count = Object.values(learnedDates).filter(date => date === today).length;
    const goal = settings.dailyGoal;
    const pct = Math.min(Math.round((count / goal) * 100), 100);
    return { wordsLearnedToday: count, dailyPercentage: pct, isGoalReached: count >= goal };
  }, [progress.learnedDates, settings.dailyGoal]);

  const streakBadgeLabel = useMemo(() => {
    if (!isGoalReached) return null;
    if (streak.current <= 1) return 'Day 1!';
    return `${streak.current}-day streak!`;
  }, [isGoalReached, streak.current]);

  const handleCopyJSON = () => {
    triggerHaptic(settings.hapticsEnabled);
    const dataToExport = exportCount === -1 ? learnedWordsData : learnedWordsData.slice(0, exportCount);
    navigator.clipboard.writeText(JSON.stringify(dataToExport, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenExport = () => { triggerHaptic(settings.hapticsEnabled); setShowExportModal(true); };
  const handleCloseExport = () => { triggerHaptic(settings.hapticsEnabled); setShowExportModal(false); };

  return (
    <>
      <TopAppBar title="Your Progress" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={settings.animationsEnabled ? { duration: 0.25, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: 'easeOut' }}
        className="pb-24 max-w-3xl mx-auto pt-4"
      >
        <div className="px-4 space-y-6">

          {/* Total Mastery Card */}
          <SectionGroup containerBg="bg-primary text-on-primary">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-on-primary/10 rounded-full">
                  <Award className="w-6 h-6 text-on-primary fill-on-primary" />
                </div>
                <h2 className="m3-title-medium text-on-primary">Total Mastery</h2>
              </div>
              <div className="mb-5">
                <p className="text-[48px] leading-none font-normal tracking-tight mb-1">{learnedWords}</p>
                <p className="m3-body-medium opacity-80">Words learned</p>
              </div>
              <div className="w-full bg-on-primary/20 rounded-full h-2 mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={settings.animationsEnabled ? { duration: 1, ease: [0.2, 0, 0, 1], delay: 0.2 } : { duration: 0.2, ease: 'easeOut' }}
                  className="bg-on-primary h-full rounded-full"
                />
              </div>
              <p className="m3-label-small opacity-80 text-right">{percentage}% of entire dictionary</p>
            </div>
          </SectionGroup>

          {/* Today's Goal Card */}
          <SectionGroup containerBg="bg-primary text-on-primary">
            <div className="w-full">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                  </div>
                  <h2 className="m3-title-medium text-on-primary">Today's Goal</h2>
                </div>
                {isGoalReached && streakBadgeLabel && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-on-primary text-primary px-3 py-1 rounded-lg m3-label-small flex items-center gap-1 font-bold"
                  >
                    <Sparkles size={14} className="fill-current" />
                    {streakBadgeLabel}
                  </motion.div>
                )}
              </div>
              <div className="mb-5">
                <p className="text-[48px] leading-none font-normal tracking-tight mb-1">{wordsLearnedToday}</p>
                <p className="m3-body-medium opacity-80">Words today</p>
              </div>
              <div className="w-full bg-on-primary/20 rounded-full h-2 mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyPercentage}%` }}
                  transition={settings.animationsEnabled ? { duration: 1.2, ease: 'easeOut' } : { duration: 0.2 }}
                  className="bg-on-primary h-full rounded-full"
                />
              </div>
              <p className="m3-label-small opacity-80 text-right">
                {isGoalReached
                  ? 'Keep it up!'
                  : `${settings.dailyGoal - wordsLearnedToday} more to go`}
              </p>
            </div>
          </SectionGroup>

          {/* Streak Card */}
          <SectionGroup containerBg="bg-surface-container-low">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-orange-500/10 rounded-full">
                  <Zap className="w-6 h-6 text-orange-500 fill-orange-500" />
                </div>
                <h2 className="m3-title-medium text-on-surface">Streak</h2>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-[48px] leading-none font-normal tracking-tight mb-1 text-on-surface">
                    {streak.current}
                  </p>
                  <p className="m3-body-medium text-on-surface-variant">Current streak</p>
                </div>
                <div className="w-px bg-outline/10 self-stretch" />
                <div>
                  <p className="text-[48px] leading-none font-normal tracking-tight mb-1 text-on-surface">
                    {streak.longest}
                  </p>
                  <p className="m3-body-medium text-on-surface-variant">Longest streak</p>
                </div>
              </div>
              <p className="m3-label-small text-on-surface-variant mt-3">
                {streak.current === 0
                  ? 'Meet your daily goal to start a streak!'
                  : streak.current === 1
                    ? 'Great start — come back tomorrow!'
                    : `You've hit your goal ${streak.current} days in a row 🔥`}
              </p>
            </div>
          </SectionGroup>

          {/* Manage Goals */}
          <SectionGroup title="Manage Goals" icon={<Target className="w-5 h-5" />}>

            {/* Daily Target */}
            <div className="flex justify-between items-center w-full">
              <div className="pr-4">
                <p className="m3-body-large text-on-surface font-medium mb-0.5">Daily Target</p>
                <p className="m3-body-small text-on-surface-variant leading-tight">Update your current goal</p>
              </div>
              <div className="relative inline-block shrink-0">
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
            </div>

            {/* Reset Today */}
            <div className="flex justify-between items-center w-full">
              <div className="pr-4">
                <p className="m3-body-large text-on-surface font-medium mb-0.5">Reset Today</p>
                <p className="m3-body-small text-on-surface-variant leading-tight">Clear all words learned today</p>
              </div>
              <div className="shrink-0">
                {confirmDaily ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { triggerHaptic(settings.hapticsEnabled); setConfirmDaily(false); }}
                      className="px-4 py-2 text-on-surface-variant bg-surface-container-highest hover:opacity-80 rounded-full m3-label-large transition-all duration-200 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { triggerHaptic(settings.hapticsEnabled); resetDailyProgress(); setConfirmDaily(false); }}
                      className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-full m3-label-large transition-all duration-200 active:scale-95"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { triggerHaptic(settings.hapticsEnabled); setConfirmDaily(true); setConfirmTotal(false); }}
                    className="flex items-center px-4 py-2 text-orange-500 dark:text-orange-400 hover:bg-orange-500/10 rounded-full transition-all duration-200 active:scale-95 m3-label-large"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Reset All Progress */}
            <div className="flex justify-between items-center w-full">
              <div className="pr-4">
                <p className="m3-body-large text-on-surface font-medium mb-0.5">Reset All Progress</p>
                <p className="m3-body-small text-on-surface-variant leading-tight">Clear all learned words forever</p>
              </div>
              <div className="shrink-0">
                {confirmTotal ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { triggerHaptic(settings.hapticsEnabled); setConfirmTotal(false); }}
                      className="px-4 py-2 text-on-surface-variant bg-surface-container-highest hover:opacity-80 rounded-full m3-label-large transition-all duration-200 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { triggerHaptic(settings.hapticsEnabled); resetTotalProgress(); setConfirmTotal(false); }}
                      className="px-4 py-2 bg-error text-on-error hover:bg-error/90 rounded-full m3-label-large transition-all duration-200 active:scale-95"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { triggerHaptic(settings.hapticsEnabled); setConfirmTotal(true); setConfirmDaily(false); }}
                    className="flex items-center px-4 py-2 text-error hover:bg-error/10 rounded-full transition-all duration-200 active:scale-95 m3-label-large"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </SectionGroup>

          {/* Export Words */}
          <SectionGroup title="Export Words" icon={<Download className="w-5 h-5" />}>
            <div className="flex justify-between items-center w-full">
              <div className="pr-4">
                <p className="m3-body-large text-on-surface font-medium mb-0.5">Export JSON</p>
                <p className="m3-body-small text-on-surface-variant leading-tight">Copy your learned words</p>
              </div>
              <button
                onClick={handleOpenExport}
                className="shrink-0 px-6 py-2.5 bg-primary text-on-primary rounded-full m3-label-large hover:bg-primary/90 transition-all duration-200 active:scale-95"
              >
                Open
              </button>
            </div>
          </SectionGroup>

        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={settings.animationsEnabled ? { duration: 0.3, ease: [0.2, 0, 0, 1] } : { duration: 0.15, ease: 'easeOut' }}
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
                    <><Check className="w-4 h-4 mr-2" />Copied JSON!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" />Copy JSON</>
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
