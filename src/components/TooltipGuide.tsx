import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppContext } from '../context/AppContext';

export const TooltipGuide: React.FC = () => {
  const { settings, runTour, startTour, stopTour } = useAppContext();
  const [isDark, setIsDark] = useState(false);

  // Safely detect if the app is currently in Dark Mode or Light Mode
  useEffect(() => {
    const checkTheme = () => {
      if (settings.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return settings.theme === 'dark';
    };
    
    setIsDark(checkTheme());

    // Listen for system theme changes in real-time
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(checkTheme());
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  // Run the tour only once when the app loads
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('vocabify_has_seen_tour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      stopTour();
      localStorage.setItem('vocabify_has_seen_tour', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Welcome to Vocabify!</h3>
          <p>Ready to expand your vocabulary? This app is specially designed to help you master complete word families (Derivatives).</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-search-bar',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Search Word Families</h3>
          <p>Look up a word to instantly see its Noun, Verb, Adjective, and Adverb forms, plus a practical example.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-video-tutorial',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Video Tutorial</h3>
          <p>Watch a quick guide on how to use this app to study word derivatives effectively.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-grammar-tips',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Grammar Cheatsheet</h3>
          <p>Struggling to tell a noun from an adjective? Tap here for quick rules and suffix tips to identify word types.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-menu-btn',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">App Settings</h3>
          <p>Customize your experience! Turn on auto-pronounce, adjust text size, or enable offline mode.</p>
        </div>
      ),
      placement: 'bottom-start',
    },
    {
      target: '.tour-filter-tab',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Focused Learning</h3>
          <p>Want to study only Adjectives or Hard words? Use filters to narrow down your vocabulary list.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tour-progress-tab',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Track Your Mastery</h3>
          <p>Set a daily goal, monitor your progress, and export the word families you've successfully learned.</p>
        </div>
      ),
      placement: 'top',
    },
  ];

  // Hardcoded Hex Colors so react-joyride understands them perfectly in both modes
  const m3Colors = isDark 
    ? { // Dark Mode Colors
        primary: '#D0BCFF',
        onPrimary: '#381E72',
        surface: '#141218',
        onSurface: '#E6E0E9',
        onSurfaceVariant: '#CAC4D0',
      }
    : { // Light Mode Colors
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        surface: '#FEF7FF',
        onSurface: '#1D1B20',
        onSurfaceVariant: '#49454F',
      };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      disableOverlayClose={true}
      spotlightPadding={8}
      styles={{
        options: {
          arrowColor: m3Colors.surface,
          backgroundColor: m3Colors.surface,
          overlayColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          primaryColor: m3Colors.primary,
          textColor: m3Colors.onSurface,
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '16px',
          padding: '20px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: m3Colors.primary,
          color: m3Colors.onPrimary,
          borderRadius: '100px',
          padding: '10px 24px',
          fontWeight: 500,
          fontSize: '14px',
          outline: 'none',
        },
        buttonBack: {
          color: m3Colors.primary,
          marginRight: '8px',
          fontWeight: 500,
          fontSize: '14px',
          outline: 'none',
        },
        buttonSkip: {
          color: m3Colors.onSurfaceVariant,
          fontWeight: 500,
          fontSize: '14px',
          outline: 'none',
        },
      }}
      locale={{
        last: 'Finish Tour',
        skip: 'Skip',
        next: 'Next',
        back: 'Back',
      }}
    />
  );
};