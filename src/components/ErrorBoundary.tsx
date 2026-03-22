import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import localforage from 'localforage';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Vocabify Crash Report]:', error, errorInfo);
  }

  private handleSoftReset = () => {
    // Smart Reset: Clears volatile settings but KEEPS user progress & favorites.
    // Uses STORAGE_KEYS constants so a key rename in one place stays in sync here.
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.FILTERS);
    window.location.reload();
  };

  private handleHardReset = async () => {
    // Nuclear option: Wipes everything — localStorage AND IndexedDB (localforage)
    if (window.confirm("Are you sure? This will delete all your learned words and progress.")) {
      localStorage.clear();
      await localforage.clear(); // clears progress, streak, favorites, avatar from IndexedDB
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-error" />
          </div>
          
          <h1 className="text-[28px] font-bold text-on-surface tracking-tight mb-3">
            Oops! Something went wrong.
          </h1>
          
          <p className="m3-body-large text-on-surface-variant max-w-sm mb-10">
            The app encountered an unexpected cache error. Don't worry, your learned words are likely safe. Let's restart the app.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-[280px]">
            <button 
              onClick={this.handleSoftReset} 
              className="w-full py-4 bg-primary text-on-primary rounded-full m3-label-large flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-primary/90"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App Safely
            </button>
            
            <button 
              onClick={this.handleHardReset} 
              className="w-full py-4 bg-surface-variant text-error rounded-full m3-label-large flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-error/10"
            >
              <Trash2 className="w-5 h-5" />
              Hard Reset (Clear All Data)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}