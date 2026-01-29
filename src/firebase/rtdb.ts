/**
 * Firebase Realtime Database operations
 * Handles live location publishing and subscribing for real-time updates
 */

import {
  ref,
  set,
  remove,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';
import { rtdb } from './firebase';
import { LiveLocation } from '@/types/models';

/**
 * Publish/update user's live location to Realtime Database
 * @param uid - The user's unique ID
 * @param location - The live location data
 */
export async function publishLiveLocation(
  uid: string,
  location: LiveLocation
): Promise<void> {
  const locationRef = ref(rtdb, `liveLocations/${uid}`);
  await set(locationRef, {
    ...location,
    updatedAt: Date.now(),
  });
}

/**
 * Remove user's live location from Realtime Database (when going offline)
 * @param uid - The user's unique ID
 */
export async function removeLiveLocation(uid: string): Promise<void> {
  const locationRef = ref(rtdb, `liveLocations/${uid}`);
  await remove(locationRef);
}

/**
 * Set user as offline in Realtime Database (alternative to removing)
 * @param uid - The user's unique ID
 */
export async function setOffline(uid: string): Promise<void> {
  const locationRef = ref(rtdb, `liveLocations/${uid}`);
  await set(locationRef, {
    isOnline: false,
    updatedAt: Date.now(),
  });
}

/**
 * Subscribe to a user's live location
 * @param uid - The user's unique ID to subscribe to
 * @param callback - Function to call when location updates
 * @returns Unsubscribe function
 */
export function subscribeLiveLocation(
  uid: string,
  callback: (location: LiveLocation | null) => void
): () => void {
  const locationRef = ref(rtdb, `liveLocations/${uid}`);
  
  const listener = onValue(locationRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as LiveLocation;
      // Only return if user is online
      if (data.isOnline) {
        callback(data);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
  
  // Return unsubscribe function
  return () => {
    off(locationRef, 'value', listener);
  };
}

/**
 * Subscribe to multiple users' live locations
 * @param uids - Array of user IDs to subscribe to
 * @param callback - Function to call when any location updates
 * @returns Unsubscribe function that cleans up all listeners
 */
export function subscribeMultipleLiveLocations(
  uids: string[],
  callback: (uid: string, location: LiveLocation | null) => void
): () => void {
  const unsubscribers: (() => void)[] = [];
  
  uids.forEach((uid) => {
    const unsubscribe = subscribeLiveLocation(uid, (location) => {
      callback(uid, location);
    });
    unsubscribers.push(unsubscribe);
  });
  
  // Return function that unsubscribes from all
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
