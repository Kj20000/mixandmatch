

# 🧩 Word-Image Match — Learning App for Autistic Kids

## Overview
A gentle, offline-first Progressive Web App where children match spoken words to images by drawing a line with their finger. Designed with soft pastel colors, large touch targets, and zero pressure — no timers, no penalties, just celebration.

---

## Pages & Features

### 1. **Home Screen**
- Friendly welcome with the app name and a large "Play" button
- A gear icon to access Settings
- Soft pastel background with rounded, child-friendly design

### 2. **Game Screen (Core Experience)**
- **Left column**: Word cards (large, rounded buttons with text)
  - Tapping a word speaks it aloud (using recorded audio or browser speech synthesis as fallback)
  - Words shown in English (with Hindi below if provided)
- **Right column**: Corresponding images (shuffled order)
- **Matching interaction**:
  - Touch & hold a word, then slide finger to an image — a visible line follows the finger in real time
  - **Correct match**: Line turns green, confetti animation bursts, celebration sound plays
  - **Wrong match**: Line briefly flashes red, then disappears — no penalty, just a gentle reset
- Number of pairs shown is based on Settings (1–6)
- A "Next Round" button appears after all pairs are matched, loading a new shuffled set

### 3. **Settings Screen**
- **Number of pairs**: Slider or simple picker (1 to 6)
- **Manage word-image pairs**:
  - Add/edit/delete custom pairs
  - Enter word in English and Hindi
  - Upload a custom image from device
  - Record a custom voice clip for the word (using device microphone)
- **Sound toggle**: On/Off switch for all sounds
- All settings and custom content stored locally in IndexedDB for full offline support

### 4. **PWA / Offline Support**
- Installable to home screen (works like a native app)
- Service worker caches all assets for offline use
- All custom images, audio recordings, and settings stored in IndexedDB
- Works without any internet connection after first load

---

## Design Principles
- **Soft pastel color palette** (light lavender, mint, peach, sky blue)
- **Large, rounded buttons and cards** — easy for small fingers
- **Minimal UI** — no clutter, no distracting elements
- **No timers, no scores, no penalties** — purely positive reinforcement
- **Celebration-focused** — confetti and cheerful sounds on every correct match

---

## Starter Content
- Ships with a small set of pre-loaded word-image pairs (e.g., Apple, Cat, Sun, Ball) so the app is usable immediately without any setup

---

## Technical Notes
- Built as a React PWA with offline-first IndexedDB storage
- Web Speech API for text-to-speech fallback
- MediaRecorder API for custom voice recording
- Canvas or SVG overlay for drawing the matching line
- No backend required — everything runs locally on device

