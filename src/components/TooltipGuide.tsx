import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppContext } from '../context/AppContext';

export const TooltipGuide: React.FC = () => {
  const { settings, runTour, startTour, stopTour } = useAppContext();

  // Run the tour only once when the app loads (or based on a local storage flag)
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('vocabify_has_seen_tour');
    if (!hasSeenTour) {
      // Small delay to ensure elements are rendered
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
          <h3 className="text-lg font-bold mb-2">Welcome to Vocabify</h3>
          <p>Take a brief tour to understand the core features of the application.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-search-bar',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Search and Discover</h3>
          <p>Enter a word to view its definition, synonyms, and usage examples.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-video-tutorial',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Video Tutorial</h3>
          <p>Watch a quick video guide on how to use the application effectively.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-grammar-tips',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Grammar Assistance</h3>
          <p>Access quick grammar rules and tips to improve your writing.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-menu-btn',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Application Settings</h3>
          <p>Configure your preferences, including appearance and offline access.</p>
        </div>
      ),
      placement: 'bottom-start',
    },
    {
      target: '.tour-filter-tab',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Advanced Filtering</h3>
          <p>Sort and filter your vocabulary list by parts of speech or difficulty.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.tour-progress-tab',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Progress Tracking</h3>
          <p>Monitor your learning milestones and vocabulary growth over time.</p>
        </div>
      ),
      placement: 'top',
    },
  ];

  // Material 3 styling for the tooltip
  const m3Colors = {
    primary: 'var(--md-sys-color-primary)',
    onPrimary: 'var(--md-sys-color-on-primary)',
    surface: 'var(--md-sys-color-surface)',
    onSurface: 'var(--md-sys-color-on-surface)',
    onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
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
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          primaryColor: m3Colors.primary,
          textColor: m3Colors.onSurface,
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
