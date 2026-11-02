// Google sign-in for sync. The Firebase Auth SDK (vendored in src/vendor) is
// only loaded when the site has Firebase settings, i.e. on Firebase Hosting.
// Each signed-in account has one progress document, readable and writable only
// by that account (and only for the Google accounts the Firestore rules allow).

import { normalizeSyncCode } from './sync.js';

export const INIT_URL = '/__/firebase/init.json';
const REDIRECT_KEY = 'med-prep-signin-redirect';

// Firebase settings for this site, or null when there are none (local copies,
// the old GitHub Pages address). On Firebase's own domains the sign-in helper
// is served from the same address as the game, so sign-in does not depend on
// third-party cookies (Safari blocks those).
export function firebaseSettings(raw, host) {
  if (!raw || typeof raw !== 'object' || typeof raw.apiKey !== 'string' || typeof raw.projectId !== 'string') return null;
  const own = /\.(web\.app|firebaseapp\.com)$/.test(host);
  return { ...raw, authDomain: own ? host : raw.authDomain };
}

export async function loadFirebaseSettings(fetchFn, host) {
  try {
    const res = await fetchFn(INIT_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    return firebaseSettings(await res.json(), host);
  } catch {
    return null;
  }
}

// "#move=CODE" in the address carries progress from the old site.
export function readHandoverCode(hash) {
  const m = /(?:^#|&)move=([^&]+)/.exec(hash || '');
  if (!m) return null;
  try {
    return normalizeSyncCode(decodeURIComponent(m[1]));
  } catch {
    return null; // a mangled link is ignored, never fatal
  }
}

// Plain-language messages for sign-in errors. Returns null for ones to ignore.
export function signInProblem(code) {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return null;
    case 'auth/network-request-failed':
      return 'Could not reach Google. Check your internet connection and try again.';
    case 'auth/redirect-no-user':
      return 'Sign-in did not finish in this browser. Try again, or study on this device for now.';
    case 'auth/unauthorized-domain':
      return 'Sign-in is not set up for this web address yet.';
    default:
      return 'Sign-in did not work. Please try again.';
  }
}

// Starts Firebase Auth. onUser(user|null) runs now and on every sign-in change;
// onError(err) runs if a sign-in that went through a full-page redirect failed.
export async function startAccount(settings, onUser, onError = () => {}) {
  const { initializeApp } = await import('./vendor/firebase/firebase-app.js');
  const auth = await import('./vendor/firebase/firebase-auth.js');
  const app = initializeApp(settings);
  const a = auth.getAuth(app);
  const provider = new auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  auth.onAuthStateChanged(a, (user) => onUser(user));
  // Finishes a sign-in that had to go through a full-page redirect.
  // A redirect that comes back with no user and no error (a browser blocking
  // the sign-in helper's storage) must not fail silently.
  let redirected = false;
  try {
    redirected = sessionStorage.getItem(REDIRECT_KEY) === '1';
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch { redirected = false; }
  auth.getRedirectResult(a).then((result) => {
    if (redirected && !result?.user && !a.currentUser) onError({ code: 'auth/redirect-no-user' });
  }, (err) => {
    console.warn(err);
    onError(err);
  });
  return {
    async signIn() {
      try {
        await auth.signInWithPopup(a, provider);
      } catch (err) {
        // Some phones block pop-ups; a full-page redirect works on the game's
        // own address (sign-in is served from the same host there).
        if (err?.code === 'auth/popup-blocked') {
          try { sessionStorage.setItem(REDIRECT_KEY, '1'); } catch { /* the check is skipped */ }
          return auth.signInWithRedirect(a, provider);
        }
        throw err;
      }
      return undefined;
    },
    signOut: () => auth.signOut(a),
    token: () => a.currentUser?.getIdToken() ?? Promise.resolve(null),
  };
}
