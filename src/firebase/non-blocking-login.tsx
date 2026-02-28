'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** 
 * Initiate anonymous sign-in (non-blocking). 
 * Returns the promise to allow the caller to handle errors.
 */
export function initiateAnonymousSignIn(authInstance: Auth) {
  return signInAnonymously(authInstance).catch((error) => {
    // Prevent unhandled rejections from crashing the app
    console.warn("Anonymous sign-in suppressed error:", error.code);
  });
}

/** 
 * Initiate email/password sign-up (non-blocking). 
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** 
 * Initiate email/password sign-in (non-blocking). 
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password);
}
