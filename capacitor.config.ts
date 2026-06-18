import type { CapacitorConfig } from '@capacitor/cli';

// TPDOP Android wrapper config.
// The app loads the static Vite build (dist/) packaged inside the APK.
// All API calls go to Supabase over HTTPS, no separate backend.
const config: CapacitorConfig = {
  appId: 'tz.go.polisi.tpdop',
  appName: 'TPDOP',
  webDir: 'dist',

  // Android-specific tuning
  android: {
    // Allow HTTP for any future on-prem station servers (off by default
    // on Android 9+ otherwise). All current traffic is HTTPS via Supabase
    // so this is just future-proofing.
    allowMixedContent: false,
    // Keep WebView active in background so GPS pings keep firing on patrol.
    backgroundColor: '#03102B',
  },

  // Use the device's hardware back button to navigate React Router history
  // instead of closing the app immediately.
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#03102B',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#03102B',
      overlaysWebView: false,
    },
  },

  // For development: use the Vite dev server on your LAN.
  // Comment out the server block for production builds.
  // server: {
  //   url: 'http://192.168.1.100:3000',
  //   cleartext: true,
  // },
};

export default config;
