<div align="center">

<img src="./assets/profile.jpg" width="100" height="100" style="border-radius: 50%; object-fit: cover;" alt="Shafiullah">

# Vocabify

**An offline-first English vocabulary Progressive Web App with Bengali meanings, CEFR classification, daily streaks, and Material Design 3.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-6750A4?style=flat&logo=googlechrome&logoColor=white)](https://shafiullahcrazyman.github.io/Vocabify/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Offline--Ready-5A0FC8?style=flat&logo=pwa&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](#)

</div>

---

## Live Application

**https://shafiullahcrazyman.github.io/Vocabify/**

The application is installable as a native home screen app. On any mobile browser, tap "Add to Home Screen" to install it without visiting an app store.

---

## Overview

Vocabify is a mobile-first Progressive Web App built for English learners, with a particular focus on students in Bangladesh. Rather than presenting isolated words, it teaches vocabulary through complete word families: every entry shows the Noun, Verb, Adjective, and Adverb forms of a word together, alongside its Bengali meaning. This approach allows learners to understand how a single root word behaves grammatically, which is far more effective than memorising words one by one.

The application operates entirely offline after the first visit. No account is required. All progress, streaks, and favourites are stored privately on the user's device and never transmitted to any server.

---

## Features

### Vocabulary

- 3,887 English word families, each with Noun, Verb, Adjective, and Adverb forms
- Bengali (বাংলা) meanings for every word
- CEFR level classification: A1, A2, B1, B2, C1, C2
- Contextual example sentences for every entry
- Difficulty rating: Easy, Medium, Hard

### Search and Filtering

- Universal search across all word forms and Bengali meanings with smart result ranking (exact matches first, then prefix matches)
- Filters for Difficulty, CEFR Level, Part of Speech, Theme, and Alphabet
- Favourites system for saving words to a personal list
- Option to hide already-learned words from the main list

### Progress and Streaks

- Configurable daily learning goals: 5, 10, 20, or 50 words per day
- Streak tracking with timezone-safe date logic (no UTC midnight bugs)
- Automatic streak-break detection on app load
- Full progress overview showing total words mastered out of 3,887
- Export learned words as JSON for personal use

### Pronunciation

- Text-to-speech for all English word forms, with UK English voice preferred
- Bengali text-to-speech, tap any Bengali meaning to hear it spoken
- Auto-pronounce mode that reads words aloud when an entry is opened
- iOS audio context unlock handled automatically on first user interaction

### Design and User Experience

- Material Design 3 with the full M3 Expressive spring animation system (FastSpatial, DefaultSpatial, SlowSpatial curves)
- Dark mode, Light mode, and System default theme options
- Browser chrome colour synced dynamically with the active theme
- Swipe left and right anywhere in the app to navigate between tabs
- 10 distinct haptic feedback patterns timed to animation phases
- Respects the OS reduced-motion accessibility preference automatically
- Scroll-aware bottom navigation — hides on scroll down, reappears on scroll up

### PWA and Offline

- Installable on Android and iOS via Add to Home Screen
- All application assets, fonts, and data pre-cached on first visit via Workbox
- Google Fonts served from cache after first load — no font flash offline
- Android hardware back button correctly closes the frontmost modal using a LIFO handler stack
- Infinite scroll loads 3,887 words in batches of 20 with an IntersectionObserver
- Service worker auto-updates silently in the background

### Security

- Strict Content Security Policy headers blocking XSS and data injection
- No analytics, no tracking, no third-party data collection
- User avatar upload restricted to JPEG, PNG, GIF, and WebP under 2MB
- All console and debugger statements stripped from the production bundle

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6 | Build tool and bundler |
| Tailwind CSS | v4 | Utility-first styling |
| Motion (Framer Motion) | 12 | Animation system |
| vite-plugin-pwa | 0.21 | PWA manifest and Workbox integration |
| localforage | 1.10 | IndexedDB wrapper for persistent storage |
| React Router | v7 | Client-side routing |
| lucide-react | 0.546 | Icon library |

---

## Getting Started

### Prerequisites

[Node.js](https://nodejs.org/) must be installed on your machine.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/shafiullahcrazyman/Vocabify.git
cd Vocabify
npm install --legacy-peer-deps
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

Build for production:

```bash
npm run build
```

---

## Project Structure

```
Vocabify/
├── public/
│   ├── icon.png              # App icon
│   ├── tutorial.mp4          # Video tutorial
│   ├── robots.txt            # SEO crawler rules
│   └── sitemap.xml           # SEO sitemap
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx     # Tab navigation bar
│   │   ├── ErrorBoundary.tsx # Crash recovery with soft and hard reset
│   │   ├── SettingsDrawer.tsx
│   │   ├── TipsOverlay.tsx   # Grammar tips modal
│   │   ├── TopAppBar.tsx     # Search bar and menu
│   │   ├── VideoTutorialModal.tsx
│   │   ├── WordCard.tsx      # Word list item
│   │   └── WordOverlay.tsx   # Word detail modal
│   ├── context/
│   │   └── AppContext.tsx    # Global state — settings, progress, streak
│   ├── data/
│   │   └── words.json        # 3,887 word family entries
│   ├── hooks/
│   │   ├── useBackButton.ts  # Android back button LIFO stack
│   │   ├── useDebounce.ts
│   │   ├── useIndexedDB.ts   # localforage hook with loaded state
│   │   ├── useLocalStorage.ts
│   │   ├── useSwipeNav.ts    # Horizontal swipe tab navigation
│   │   ├── useTTS.ts         # Text-to-speech for English and Bengali
│   │   └── useWordFilter.ts  # Search, filter, and sort logic
│   ├── screens/
│   │   ├── Filter.tsx        # Filter tab
│   │   ├── Home.tsx          # Word list with infinite scroll
│   │   └── Progress.tsx      # Stats, streak, goals, and export
│   ├── types.ts              # Shared TypeScript interfaces
│   └── utils/
│       ├── haptics.ts        # Vibration pattern system
│       └── motion.ts         # M3 spring animation tokens
├── index.html                # HTML entry point with all SEO meta tags
└── vite.config.ts            # Vite config, PWA manifest, and Workbox rules
```

---

## About the Developer

<div align="center">

<img src="./assets/profile.jpg" width="120" height="120" style="border-radius: 50%; object-fit: cover; border: 4px solid #6750A4;" alt="Shafiullah">

### Shafiullah

*Developer — Storyteller — Writer — Dreamer*

I am a Business Studies student from Patuakhali, Bangladesh. I build software through a practice I call vibe coding, focusing on the feeling and flow of an application just as much as its functionality. Outside of development, I write fiction and create stories, and I believe the two disciplines share more in common than they appear to.

Vocabify was built with the conviction that learning tools should feel worth returning to, not because they demand it, but because they are genuinely pleasant to use.

<br>

[![GitHub](https://img.shields.io/badge/GitHub-shafiullahcrazyman-181717?style=for-the-badge&logo=github)](https://github.com/shafiullahcrazyman)
[![X](https://img.shields.io/badge/X-Shafiullah-000000?style=for-the-badge&logo=x)](https://x.com/Shafiullah)
[![Instagram](https://img.shields.io/badge/Instagram-shafiullahcrazyman-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/shafiullahcrazyman)
[![Facebook](https://img.shields.io/badge/Facebook-shafiullahcrazyman-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/shafiullahcrazyman)

</div>

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Built by Shafiullah, Patuakhali, Bangladesh.

If this project was useful to you, consider giving it a star on GitHub.

</div>
