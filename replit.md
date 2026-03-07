# Who Saved Me

## Overview
Mobile app (Expo + Express) that lets users search any phone number to discover which other users have that number saved in their contacts, what name they saved it under, what label they used, and the uploader's full name.

## Architecture
- **Frontend**: Expo (React Native) on port 8081
- **Backend**: Express + TypeScript on port 5000
- **Database**: PostgreSQL via `DATABASE_URL`

## Key Files
- `app/index.tsx` - Home screen (onboarding + search + history)
- `app/results.tsx` - Search results showing uploader's full name
- `app/_layout.tsx` - Root layout with providers (QueryClient, CoinsProvider)
- `lib/coins.tsx` - Coin system context (5 initial coins, daily search tracking, AsyncStorage persistence)
- `lib/countries.ts` - Country list with flags and dial codes
- `lib/query-client.ts` - React Query client and API helpers
- `components/CountryPicker.tsx` - Country selector modal
- `components/ErrorBoundary.tsx` - Error boundary wrapper
- `server/routes.ts` - API routes (upload, search)
- `server/storage.ts` - Database storage layer
- `constants/colors.ts` - Theme colors (dark/light)

## Features
- Profile creation with full name (validated: first + last) and phone number (validated: 7-15 digits)
- Profiles stored in PostgreSQL `profiles` table via POST /api/profile
- Contact sync gate: users MUST upload contacts before searching (sync required)
- Contact sync via expo-contacts (dedup before batch insert, 50k limit, 10MB body)
- Search by phone number with country code (locked until contacts synced)
- Results show: contact name, label badge (Mobile/Home/Work/etc), uploader's full name (joined from profiles table)
- Search limit: 5 free searches per day, then 1 coin per search
- Coin system: 5 initial coins, coin balance displayed in header on home and results screens
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
- Search results join contacts with profiles table to show uploader's full name
