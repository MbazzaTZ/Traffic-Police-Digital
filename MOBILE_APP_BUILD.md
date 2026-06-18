# TPDOP Mobile App — Build Guide

The codebase is now ready to ship as:
1. **A PWA** — installable from Chrome/Safari on any phone, works offline
2. **An Android APK** — proper Play Store app via Capacitor

---

## A. Test the PWA (no install required)

Once deployed to Vercel and you visit the site on a phone:
- **Chrome / Edge / Samsung Internet**: a banner says "Install TPDOP" at the bottom. Tap it.
- **iOS Safari**: tap Share → Add to Home Screen
- The app opens full-screen, no browser chrome, identical to a native app
- Service worker caches everything on first visit; works in low-signal areas after that

If the install banner doesn't appear, it usually means:
- You're already installed
- You dismissed it (clears after 14 days)
- The deploy isn't using HTTPS

---

## B. Build the Android APK locally

Capacitor wraps the existing web build in a thin native Android shell.
The APK contains your existing React app loading from local files inside
the app package, so it works completely offline (modulo Supabase calls).

### One-time setup (on your Windows machine)

1. **Install Java JDK 17**
   - Download from https://adoptium.net/temurin/releases/?version=17
   - Add `JAVA_HOME` to environment variables pointing at the install dir

2. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Run installer with defaults
   - On first launch let it download the Android SDK (Tools → SDK Manager)
   - Install at least **API Level 34 (Android 14)**

3. **Add Android SDK to PATH** (PowerShell)
   ```powershell
   setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
   setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
   ```
   Restart PowerShell after this.

### Add the Android platform to the project (one-time)

```powershell
cd "C:\Users\DELL\Documents\Tanzania Police Force\Jeshi"
git pull
npm install
npm run cap:add
```

This creates an `android/` folder containing the native project.
**Commit this folder to git** — Capacitor expects it to persist.

### Build the APK

Each time you want to ship a new build:

```powershell
# Builds web app, copies to native project, opens Android Studio
npm run cap:open
```

Android Studio opens. Then:
1. Wait for Gradle to finish syncing (bottom progress bar)
2. **Build → Generate Signed Bundle / APK**
3. Choose **APK** (not bundle, unless you're submitting to Play Store)
4. Create a new keystore the first time (Android Studio walks you through it)
5. Save the keystore file somewhere safe — you need the same one for every future update
6. Build variant: **release** (signed) or **debug** (for testing on your own phone)
7. APK lands at `android/app/build/outputs/apk/release/app-release.apk`

Transfer to a test phone via USB or Google Drive, enable
"Install from unknown sources" once, and tap the APK.

### Quick dev cycle (live reload on phone)

If you want hot reload from your dev machine onto a connected phone:

1. Find your computer's LAN IP: `ipconfig` in PowerShell, look for IPv4
2. Edit `capacitor.config.ts`, uncomment the `server` block, set `url` to `http://YOUR_IP:3000`
3. Run `npm run dev` to start Vite
4. Run `npm run android:dev` to push the wrapper to your phone — it'll load from your dev server

For release builds, re-comment the `server` block.

---

## C. Submitting to Google Play Store

When you're ready to publish (out of scope for this guide but here's the path):

1. Create a Google Play Console account ($25 one-time)
2. In Android Studio: **Build → Generate Signed Bundle / APK** but choose **Android App Bundle** (`.aab`)
3. Upload the `.aab` to Play Console under a new app listing
4. Fill in store listing: screenshots, description, privacy policy URL
5. For a government-restricted app: target audience = "Workforce only", set distribution = "Managed Google Play" so only Tanzania Police devices see it

---

## D. App Identity

Already configured:

| Setting             | Value                          |
|---------------------|--------------------------------|
| App name            | TPDOP                          |
| Package (App ID)    | tz.go.polisi.tpdop             |
| Theme color         | #0D3477 (navy)                 |
| Background          | #03102B                        |
| Splash duration     | 1.5 seconds                    |
| Status bar          | Dark on navy                   |
| Display             | standalone (no browser chrome) |
| Orientation         | portrait                       |

To change the app icon: replace `android/app/src/main/res/mipmap-*/ic_launcher.png`
after running `cap:add`. Use https://icon.kitchen for quick icon generation.

---

## E. What's offline-capable

After first launch (with network), the following work offline:
- The entire app shell (HTML, JS, CSS, fonts, icons)
- Pages already visited (cached by the service worker)
- Map tiles for areas already viewed
- The most recent 100 Supabase REST responses (24h cache)

What still needs network:
- New Supabase writes (insert/update/delete) — these will fail with an
  error banner. Officers should expect this in dead zones.
- Login (first-time auth requires network)
- Mugshot/evidence images not previously viewed

Future enhancement: a write queue that holds failed inserts and replays
them when network returns. Not built yet — let me know if you want it.
