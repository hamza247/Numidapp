# Who Saved Me

## Overview
Mobile app (Expo + Express) that lets users search any phone number to discover which other users have that number saved in their contacts, what name they saved it under, what label they used, and which uploader's number it came from.

## Architecture
- **Frontend**: Expo (React Native) on port 8081
- **Backend**: Express + TypeScript on port 5000
- **Database**: PostgreSQL via `DATABASE_URL`

## Key Files
- `app/index.tsx` - Home screen (onboarding + search + history)
- `app/results.tsx` - Search results with coin-gated reveal
- `app/_layout.tsx` - Root layout with providers (QueryClient, CoinsProvider)
- `lib/coins.tsx` - Coin system context (5 initial coins, 1 per reveal, AsyncStorage persistence)
- `lib/countries.ts` - Country list with flags and dial codes
- `lib/query-client.ts` - React Query client and API helpers
- `components/CountryPicker.tsx` - Country selector modal
- `components/ErrorBoundary.tsx` - Error boundary wrapper
- `server/routes.ts` - API routes (upload, search)
- `server/storage.ts` - Database storage layer
- `constants/colors.ts` - Theme colors (dark/light)

## Features
- Phone number onboarding with international country picker (90+ countries)
- Contact sync gate: users MUST upload contacts before searching (sync required)
- Contact sync via expo-contacts (dedup before batch insert, 50k limit, 10MB body)
- Search by phone number with country code (locked until contacts synced)
- Results show: contact name, label badge (Mobile/Home/Work/etc), masked uploader phone
- Coin system: 5 free coins, spend 1 to reveal full uploader phone number (server-side enforcement)
- Reveal endpoint: POST /api/contacts/reveal with base64-encoded uploaderId
- Coin balance displayed in header on home and results screens
- Search history with country flags
- Dark/light theme support

## Design
- Dark theme: #080C14 bg, #0F1623 surface, #00C9D4 teal accent
- Inter font family (400/500/600/700 weights)
- No emojis in UI (flags in CountryPicker are functional)
- Label colors: Mobile=#4A9EFF, Home=#FF9500, Work=#AF52DE

## Phone Number Handling
- iOS contact labels sanitized: `.replace(/[_$!<>]/g, "")`
- Variants handled: +1 prefix, 10-digit, 11-digit with/without country code
- Uploader phone masked by default (last 4 digits visible), revealed with coin spend
