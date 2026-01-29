/**
 * Firestore database operations
 * Handles users, trips, and chats collections
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Trip, Chat, Message } from '@/types/models';

// ============ USER OPERATIONS ============

/**
 * Create a new user profile in Firestore
 * @param user - The user profile data to save
 */
export async function createUserProfile(user: UserProfile): Promise<void> {
  await setDoc(doc(db, 'Profile', user.uid), {
    ...user,
    createdAt: Date.now(),
  });
}

/**
 * Get a user profile by UID
 * @param uid - The user's unique ID
 * @returns The user profile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'Profile', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

/**
 * Get multiple user profiles by UIDs
 * @param uids - Array of user IDs to fetch
 * @returns Map of uid to UserProfile
 */
export async function getUserProfiles(uids: string[]): Promise<Map<string, UserProfile>> {
  const profiles = new Map<string, UserProfile>();
  
  // Fetch profiles in parallel (batches of 10 for Firestore 'in' query limit)
  const batchSize = 10;
  for (let i = 0; i < uids.length; i += batchSize) {
    const batch = uids.slice(i, i + batchSize);
    const q = query(collection(db, 'Profile'), where('uid', 'in', batch));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      const profile = doc.data() as UserProfile;
      profiles.set(profile.uid, profile);
    });
  }
  
  return profiles;
}

// ============ TRIP OPERATIONS ============

/**
 * Create or update an active trip for a user
 * @param trip - The trip data
 * @returns The trip ID
 */
export async function createOrUpdateTrip(trip: Omit<Trip, 'id'>): Promise<string> {
  // First, try to find an existing active trip for this user
  const existingTrip = await getActiveTrip(trip.uid);
  
  if (existingTrip && existingTrip.id) {
    // Update existing trip
    await updateDoc(doc(db, 'trips', existingTrip.id), {
      ...trip,
      updatedAt: Date.now(),
    });
    return existingTrip.id;
  } else {
    // Create new trip
    const docRef = await addDoc(collection(db, 'trips'), {
      ...trip,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  }
}

/**
 * Get the active trip for a user
 * @param uid - The user's unique ID
 * @returns The active trip or null
 */
export async function getActiveTrip(uid: string): Promise<Trip | null> {
  const q = query(
    collection(db, 'trips'),
    where('uid', '==', uid),
    where('status', '==', 'active')
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Trip;
  }
  return null;
}

/**
 * Deactivate a trip (set status to inactive)
 * @param tripId - The trip ID to deactivate
 */
export async function deactivateTrip(tripId: string): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), {
    status: 'inactive',
    updatedAt: Date.now(),
  });
}

/**
 * Deactivate all active trips for a user
 * @param uid - The user's unique ID
 */
export async function deactivateUserTrips(uid: string): Promise<void> {
  const q = query(
    collection(db, 'trips'),
    where('uid', '==', uid),
    where('status', '==', 'active')
  );
  
  const querySnapshot = await getDocs(q);
  
  const updates = querySnapshot.docs.map((doc) =>
    updateDoc(doc.ref, { status: 'inactive', updatedAt: Date.now() })
  );
  
  await Promise.all(updates);
}

/**
 * Get all active trips for a specific gender
 * @param gender - The gender to filter by
 * @returns Array of active trips
 */
export async function getActiveTripsByGender(gender: 'male' | 'female'): Promise<Trip[]> {
  // Get trips from the last 24 hours only (for MVP)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  const q = query(
    collection(db, 'trips'),
    where('status', '==', 'active'),
    where('gender', '==', gender),
    where('createdAt', '>=', oneDayAgo)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Trip[];
}

/**
 * Subscribe to active trips for a specific gender
 * @param gender - The gender to filter by
 * @param callback - Function to call when trips change
 * @returns Unsubscribe function
 */
export function subscribeToActiveTripsByGender(
  gender: 'male' | 'female',
  callback: (trips: Trip[]) => void
): Unsubscribe {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  const q = query(
    collection(db, 'trips'),
    where('status', '==', 'active'),
    where('gender', '==', gender),
    where('createdAt', '>=', oneDayAgo)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const trips = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Trip[];
    callback(trips);
  });
}

// ============ CHAT OPERATIONS ============

/**
 * Create a new chat between two users or get existing one
 * @param uid1 - First user's ID
 * @param uid2 - Second user's ID
 * @returns The chat ID
 */
export async function getOrCreateChat(uid1: string, uid2: string): Promise<string> {
  // Sort UIDs to ensure consistent chat ID lookup
  const members = [uid1, uid2].sort();
  
  // Check if chat already exists
  const q = query(
    collection(db, 'chats'),
    where('members', '==', members)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  
  // Create new chat
  const docRef = await addDoc(collection(db, 'chats'), {
    members,
    createdAt: Date.now(),
  });
  
  return docRef.id;
}

/**
 * Get a chat by ID
 * @param chatId - The chat ID
 * @returns The chat or null
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  const docRef = doc(db, 'chats', chatId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Chat;
  }
  return null;
}

/**
 * Send a message in a chat
 * @param chatId - The chat ID
 * @param senderId - The sender's user ID
 * @param text - The message text
 */
export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  // Add message to subcollection
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    createdAt: Date.now(),
  });
  
  // Update chat's last message
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    lastMessageAt: Date.now(),
  });
}

/**
 * Subscribe to messages in a chat
 * @param chatId - The chat ID
 * @param callback - Function to call when messages change
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    callback(messages);
  });
}

/**
 * Get user's chats
 * @param uid - The user's ID
 * @returns Array of chats
 */
export async function getUserChats(uid: string): Promise<Chat[]> {
  const q = query(
    collection(db, 'chats'),
    where('members', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Chat[];
}
