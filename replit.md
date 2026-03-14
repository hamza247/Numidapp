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
- `server/routes.ts` - API routes (upload, search, app-settings)
- `server/storage.ts` - Database storage layer (exports `pool` for raw queries)
- `constants/colors.ts` - Theme colors (dark/light)

## Admin Panel (Plain PHP)
- Location: `admin-panel/` served via Express proxy at `/admin`
- Admin workflow: `cd admin-panel && php -S 0.0.0.0:8000 index.php` on port 8000
- Login: `/admin/login` (credentials: `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars, default admin/admin123)
- Pages: dashboard, users, user-detail, contacts (with export), removed numbers, stripe config, admob config, settings
- `app_settings` table: key-value store for runtime config (maintenance_mode, stripe_*, ads_*, admob_*)
- Helper functions `getSetting()` / `setSetting()` defined in `index.php`
- Settings API: `GET /api/app-settings` returns public settings for mobile app
- Maintenance mode: enforced via Express middleware on all `/api/*` routes (except `/api/app-settings`), returns 503
- Contacts export: CSV download with formula injection protection (sanitizes `= + - @` prefixes)

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

## Ad Banner System
- `components/AdBanner.tsx` - Custom banner image component, renders based on admin settings
- `lib/ads.ts` - Session-scoped search counter and ad frequency logic
- Ad settings from `/api/app-settings`: `ads_enabled`, `ad_provider`, `custom_banner_url`, `custom_banner_link`, `ad_frequency`, `admob_app_id`, `admob_banner_android`, `admob_banner_ios`
- Frequency options: `every_search`, `every_2`, `every_5`, `once_per_session`
- Custom banner: tappable image linking to `custom_banner_link`
- AdMob: guarded require() in AdBanner.tsx with try/catch; works in EAS builds, falls back to custom banner in Expo Go/web
- AdMob App IDs: configured via `app.config.ts` reading env vars `ADMOB_ANDROID_APP_ID` / `ADMOB_IOS_APP_ID` (falls back to Google test IDs); runtime banner unit IDs from admin settings
- AdMob native module: guarded with top-level try/catch require() — returns null in Expo Go (no native module linked), component falls back to custom banner automatically
- EAS build flow for AdMob: Admin sets `admob_app_id` in admin panel -> operator sets `ADMOB_ANDROID_APP_ID` / `ADMOB_IOS_APP_ID` as EAS build env vars -> `app.config.ts` injects into plugin config -> EAS build links native AdMob SDK with correct App IDs
- Banner placement: bottom of index screen (ScrollView), ListFooterComponent in results FlatList

## Phone Number Handling
- iOS contact labels sanitized: `.replace(/[_$!<>]/g, "")`
- Variants handled: +1 prefix, 10-digit, 11-digit with/without country code
- Search results join contacts with profiles table to show uploader's full name
