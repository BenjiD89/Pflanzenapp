# Session Insights — Pflanzen App

Notes from the session that took this project from a hand-authored Expo + Supabase
scaffold to a running app (web dev server + Android preview build), with several
real bugs found and fixed along the way. Written for whoever picks this up next
(human or Claude) so the non-obvious parts don't have to be re-discovered.

## What this project is

An Expo Router + Supabase app for tracking houseplants: watering history, a
traffic-light ("Ampel") status per plant, room/floor grouping, care info per
species, and photo uploads. UI is German-language. Repo:
https://github.com/BenjiD89/Pflanzenapp · Supabase project:
`ieeslhhcqykjmupdikaq` · EAS project: `benjis-team/pflanzen-app`.

## Infrastructure set up this session

- **Local dev**: `.env` with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (gitignored, never committed). `npm install` + `npx expo start --web` on
  `localhost:8081`.
- **GitHub**: initialized git, linked to the pre-existing `BenjiD89/Pflanzenapp`
  repo (it already had one prior commit from an earlier session), pushed all
  work as a series of commits on `main`.
- **EAS**: project linked as `benjis-team/pflanzen-app`. `eas.json` has a
  `preview` profile (Android APK, internal distribution). Supabase credentials
  are stored as EAS **environment variables** (`preview` and `production`
  environments) — `.env` is gitignored so it never reaches EAS's build
  servers; without this, builds would produce an app that can't reach the
  database at all, with no error at build time.
- Generated placeholder branded icon/splash/adaptive-icon assets — none
  existed before even though `app.json` referenced them.

## Real bugs found and fixed (not just features)

These were genuine defects, not stylistic choices — worth knowing about since
the symptoms were often confusing or silent:

1. **`v_pflanzen_komplett` view was stale.** It was created before the
   `spitzname`, `korrektur_tage`, `gruppe_id`, `topf_zustand`, `topf_notiz`,
   and `uebertopf_geplant_mm` columns existed on `pflanzen_bestand`, and was
   never updated. The app read plant data exclusively through this view, so
   nicknames silently never showed (always fell back to the full plant name)
   and the pot-edit form's prefill was silently empty. Fixed by recreating the
   view with `CREATE OR REPLACE VIEW` after all the column-adding migrations
   in `supabase/schema.sql`. **This required running SQL manually in the
   Supabase SQL Editor** — an anon/publishable key cannot run DDL.

2. **Metro couldn't bundle for web on Windows.** `@supabase/supabase-js` does
   a dynamic `import("@opentelemetry/api")` for optional tracing, wrapped in
   try/catch at runtime — but Metro tried to statically resolve it at bundle
   time and failed since the package wasn't installed. Installing
   `@opentelemetry/api` as a real dependency surfaced a *second* bug: Metro's
   package.json `exports` resolution mis-resolved the package's `module`
   field on Windows (looked for `index.js.js`/`index.js.ts` instead of the
   real file). Fixed with `metro.config.js` setting
   `resolver.unstable_enablePackageExports = false`.

3. **Every native Android build failed on Gradle**, with cryptic errors
   (`Plugin [id: 'expo-module-gradle-plugin'] was not found`,
   `Could not get unknown property 'release' for SoftwareComponent
   container`). Root cause: `expo-font`, `expo-constants`, and
   `expo-linking` were required peer dependencies of `expo-router` /
   `@expo/vector-icons` but were never installed, so Gradle resolved
   mismatched versions transitively. `npx expo-doctor` caught this
   immediately (`17/17 checks passed` after the fix) — worth running before
   any EAS build if one fails mysteriously.

4. **`Alert.alert()` is a no-op stub in `react-native-web`.** Checked the
   installed package source directly — it's a literal empty function on web.
   This meant every `Alert.alert` call in the app (delete confirmation,
   save success/error messages, missing-field validation, batch-watering
   confirmation) silently did nothing when tested in a browser: no dialog,
   no callback firing. **This is why "Pflanze löschen" appeared broken** —
   the confirm dialog never appeared, so the delete branch never ran, even
   though the underlying Supabase delete + RLS policy worked perfectly (
   verified with a direct REST probe). Fixed with `src/lib/alert.ts` —
   `showAlert()` delegates to the real native `Alert.alert` on iOS/Android
   and falls back to `window.alert`/`window.confirm` on web. All call sites
   swapped.

## Known follow-up (not fixed, flagged to user)

- `Alert.prompt` in the "Zustand aktualisieren" (condition update) flow is
  **iOS-only** in React Native — it already silently no-ops on both Android
  and web today. Same class of bug as #4 above, but fixing it needs a
  custom text-input modal (no drop-in replacement exists), so it was left
  as-is pending a decision to build one.
- The `fotos` Supabase Storage bucket does not exist yet — photo upload
  (camera/gallery) will fail until it's created (Dashboard → Storage → New
  bucket → name `fotos`, public).
- New plant species added via the "➕ Neue Pflanzenart" form get
  **estimated** ampel thresholds (75%/125% of the given watering interval),
  not hand-tuned ones — may need manual adjustment later for accuracy.

## Features added this session

- Bottom tab navigation (Pflanzen / Konfiguration) replacing the old
  gear-icon push-navigation.
- Home screen redesigned: plants grouped by floor → room, small grid tiles
  (2–3 columns depending on screen width) colored by ampel status
  (green/yellow/red/gray), tap a tile to water that plant, tap a floor or
  room name to batch-water everything in it, ℹ️ button opens plant detail.
  Tile text is large, centered, and auto-shrinks (`adjustsFontSizeToFit`)
  for long names; each tile shows a last-watered line ("Heute schon
  gegossen" / "vor N Tagen gegossen" / "Noch nie gegossen").
- Plant detail page: always-visible moisture feedback (too wet/dry/right),
  an edit mode for location (floor/room/position) and pot attributes (size,
  condition, notes, repotting flag, watering system), and a delete button
  with a confirm dialog.
- Add-plant form: pick or create a room with an explicit floor, pick an
  existing species or define a brand-new one inline, single popup listing
  *all* missing required fields at once (instead of one-at-a-time), and the
  photo upload now happens in the background after the plant record saves
  instead of blocking the whole form.
- Full CSV export of the plant/species/room tables for offline editing (not
  yet re-imported — pending the user sending back edited files).

## Where things stand

- Web dev server: `npm run web` → `localhost:8081`, working.
- Latest Android preview build:
  https://expo.dev/artifacts/eas/5A3VMqSTkSxmmRo6sq5oky-7X0rLNjHYd1vwm5nYUfc.apk
  (commit `cfbeab0`).
- All code pushed to `main` on GitHub.
