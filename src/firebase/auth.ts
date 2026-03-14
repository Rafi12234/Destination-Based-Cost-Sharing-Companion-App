/**
 * Firebase Authentication helper functions
 * Handles sign in, sign up, and sign out operations
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

/**
 * Sign in with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to the signed-in user
 */
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Create a new account with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to the created user
 */
export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Check whether an email is a valid Gmail address.
 */
export function isGmailAddress(email: string): boolean {
  return GMAIL_REGEX.test(email.trim());
}

/**
 * Send a verification email to the user.
 */
export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

/**
 * Reload the user from Firebase Auth to get fresh emailVerified state.
 */
export async function reloadAuthUser(user: User): Promise<User> {
  await reload(user);
  return auth.currentUser ?? user;
}

/**
 * Subscribe to auth state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
