/**
 * Type definitions for RideSplit Match application
 * Contains interfaces for all data models used throughout the app
 */

// User profile stored in Firestore users/{uid}
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  createdAt: number;
}

// Trip document stored in Firestore trips/{tripId}
export interface Trip {
  id?: string;
  uid: string;
  gender: 'male' | 'female';
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}

// Destination document stored in Firestore Destination/{uid}
// This is the active destination for matching users
export interface Destination {
  uid: string;
  name: string;
  gender: 'male' | 'female';
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  currentLat: number;
  currentLng: number;
  phone: string;
  createdAt: number;
  updatedAt: number;
}

// Live location data stored in Realtime Database liveLocations/{uid}
export interface LiveLocation {
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: number;
  tripId: string;
  isOnline: boolean;
  gender: 'male' | 'female';
  destinationLat: number;
  destinationLng: number;
}

// Chat document stored in Firestore chats/{chatId}
export interface Chat {
  id?: string;
  members: string[]; // [uid1, uid2]
  createdAt: number;
  lastMessage?: string;
  lastMessageAt?: number;
}

// Message document stored in Firestore chats/{chatId}/messages/{messageId}
export interface Message {
  id?: string;
  senderId: string;
  text: string;
  createdAt: number;
}

// Matched user with live location and distance info (used in UI)
export interface MatchedUser {
  uid: string;
  profile: UserProfile;
  destination: Destination;
  distance: number; // Distance from current user in meters
  isNear: boolean; // Within 2km radius
}

// Coordinates type for cleaner function signatures
export interface Coordinates {
  lat: number;
  lng: number;
}

// Destination search result from Nominatim API
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}
