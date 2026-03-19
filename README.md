<div align="center">

<img src="https://shafiullahcrazyman.github.io/Vocabify/og-image.png" width="100%" alt="Vocabify — Offline English Vocabulary Learning App">

# Vocabify

**An offline-first English vocabulary Progressive Web App with Bengali meanings, CEFR classification, daily streaks, and Material Design 3.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-6750A4?style=flat&logo=googlechrome&logoColor=white)](https://shafiullahcrazyman.github.io/Vocabify/)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript%205.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?style=flat&logo=pwa&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat)](#)

</div>

---

## <img src="https://api.iconify.design/material-symbols/open-in-new.svg?color=%236750A4" height="22" align="center"> Live Application

**https://shafiullahcrazyman.github.io/Vocabify/**

The application is installable as a native home screen app. On any mobile browser, tap "Add to Home Screen" to install it without visiting an app store.

---

## <img src="https://api.iconify.design/material-symbols/info-outline.svg?color=%236750A4" height="22" align="center"> Overview

Vocabify is a mobile-first Progressive Web App built for English learners with a particular focus on students in Bangladesh. Rather than presenting isolated words, it teaches vocabulary through complete word families: every entry shows the Noun, Verb, Adjective, and Adverb forms of a word together, alongside its Bengali meaning. This approach allows learners to understand how a single root word behaves grammatically, which is far more effective than memorising words one by one.

The application operates entirely offline after the first visit. No account is required. All progress, streaks, and favourites are stored privately on the user's device and never transmitted to any server.

---

## <img src="https://api.iconify.design/material-symbols/star-outline.svg?color=%236750A4" height="22" align="center"> Features

### <img src="https://api.iconify.design/material-symbols/book-2-outline.svg?color=%236750A4" height="18" align="center"> Vocabulary

- 3,887 English word families, each with Noun, Verb, Adjective, and Adverb forms
- Bengali (বাংলা) meanings for every word
- CEFR level classification: A1, A2, B1, B2, C1, C2
- Contextual example sentences for every entry
- Difficulty rating: Easy, Medium, Hard

### <img src="https://api.iconify.design/material-symbols/search.svg?color=%236750A4" height="18" align="center"> Search and Filtering

- Universal search across all word forms and Bengali meanings with smart result ranking (exact matches first, then prefix matches)
- Filters for Difficulty, CEFR Level, Part of Speech, Theme, and Alphabet
- Favourites system for saving words to a personal list
- Option to hide already-learned words from the main list

### <img src="https://api.iconify.design/material-symbols/trending-up.svg?color=%236750A4" height="18" align="center"> Progress and Streaks

- Configurable daily learning goals: 5, 10, 20, or 50 words per day
- Streak tracking with timezone-safe date logic (no UTC midnight bugs)
- Automatic streak-break detection on app load
- Full progress overview showing total words mastered out of 3,887
- Export learned words as JSON for personal use

### <img src="https://api.iconify.design/material-symbols/volume-up-outline.svg?color=%236750A4" height="18" align="center"> Pronunciation

- Text-to-speech for all English word forms, with UK English voice preferred
- Bengali text-to-speech tap any Bengali meaning to hear it spoken
- Auto-pronounce mode that reads words aloud when an entry is opened
- iOS audio context unlock handled automatically on first user interaction

### <img src="https://api.iconify.design/material-symbols/palette-outline.svg?color=%236750A4" height="18" align="center"> Design and User Experience

- Material Design 3 with the full M3 Expressive spring animation system (FastSpatial, DefaultSpatial, SlowSpatial curves)
- Dark mode, Light mode, and System default theme options
- Browser chrome colour synced dynamically with the active theme
- Swipe left and right anywhere in the app to navigate between tabs
- 10 distinct haptic feedback patterns timed to animation phases
- Respects the OS reduced-motion accessibility preference automatically
- Scroll-aware bottom navigation hides on scroll down, reappears on scroll up

### <img src="https://api.iconify.design/material-symbols/offline-pin-outline.svg?color=%236750A4" height="18" align="center"> PWA and Offline

- Installable on Android and iOS via Add to Home Screen
- All application assets, fonts, and data pre-cached on first visit via Workbox
- Google Fonts served from cache after first load — no font flash offline
- Android hardware back button correctly closes the frontmost modal using a LIFO handler stack
- Infinite scroll loads 3,887 words in batches of 20 with an IntersectionObserver
- Service worker auto-updates silently in the background

### <img src="https://api.iconify.design/material-symbols/security.svg?color=%236750A4" height="18" align="center"> Security

- Strict Content Security Policy headers blocking XSS and data injection
- No analytics, no tracking, no third-party data collection
- User avatar upload restricted to JPEG, PNG, GIF, and WebP under 2MB
- All console and debugger statements stripped from the production bundle

---

## <img src="https://api.iconify.design/material-symbols/layers-outline.svg?color=%236750A4" height="22" align="center"> Tech Stack

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

## <img src="https://api.iconify.design/material-symbols/terminal.svg?color=%236750A4" height="22" align="center"> Getting Started

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

## <img src="https://api.iconify.design/material-symbols/folder-open-outline.svg?color=%236750A4" height="22" align="center"> Project Structure

```
Vocabify/
├── public/
│   ├── icon.png
│   ├── tutorial.mp4
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SettingsDrawer.tsx
│   │   ├── TipsOverlay.tsx
│   │   ├── TopAppBar.tsx
│   │   ├── VideoTutorialModal.tsx
│   │   ├── WordCard.tsx
│   │   └── WordOverlay.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── data/
│   │   └── words.json
│   ├── hooks/
│   │   ├── useBackButton.ts
│   │   ├── useDebounce.ts
│   │   ├── useIndexedDB.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useSwipeNav.ts
│   │   ├── useTTS.ts
│   │   └── useWordFilter.ts
│   ├── screens/
│   │   ├── Filter.tsx
│   │   ├── Home.tsx
│   │   └── Progress.tsx
│   ├── types.ts
│   └── utils/
│       ├── haptics.ts
│       └── motion.ts
├── index.html
└── vite.config.ts
```

---

## <img src="https://api.iconify.design/material-symbols/person-outline.svg?color=%236750A4" height="22" align="center"> About the Developer

<div align="center">

<img src="./assets/profile.jpg" width="120" height="120" style="border-radius: 50%; object-fit: cover; border: 4px solid #6750A4;" alt="Shafiullah">

### Shafiullah

Developer • Storyteller • Writer • Dreamer

I am a Business Studies student from Patuakhali, Bangladesh. I build software through a practice I call vibe coding focusing on the feeling and flow of an application just as much as its functionality. Outside of development, I write fiction and create stories, and I believe the two disciplines share more in common than they appear to.

Vocabify was built with the conviction that learning tools should feel worth returning to not because they demand it, but because they are genuinely pleasant to use.

<br>

[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat&logo=github&logoColor=white&labelColor=181717)](https://github.com/shafiullahcrazyman)
[![X](https://img.shields.io/badge/X-Shafiullah-181717?style=flat&logo=x&logoColor=white&labelColor=181717)](https://x.com/Shafiullah)
[![Instagram](https://img.shields.io/badge/Instagram-Follow-E4405F?style=flat&logo=instagram&logoColor=white&labelColor=E4405F)](https://www.instagram.com/shafiullahcrazyman)
[![Facebook](https://img.shields.io/badge/Facebook-Follow-1877F2?style=flat&logo=facebook&logoColor=white&labelColor=1877F2)](https://www.facebook.com/shafiullahcrazyman)

</div>

---

## <img src="https://api.iconify.design/material-symbols/gavel.svg?color=%236750A4" height="22" align="center"> License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Built by Shafiullah, Patuakhali, Bangladesh.

If this project was useful to you, consider giving it a star on GitHub.

</div>
