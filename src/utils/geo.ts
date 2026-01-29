/**
 * Geographic utility functions for RideSplit Match
 * Implements Haversine formula for calculating distances between coordinates
 */

import { Coordinates } from '@/types/models';

// Earth's radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate (lat, lng)
 * @param coord2 - Second coordinate (lat, lng)
 * @returns Distance in meters
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const lat1Rad = toRadians(coord1.lat);
  const lat2Rad = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if two destinations match (within 500 meters)
 * @param dest1 - First destination coordinates
 * @param dest2 - Second destination coordinates
 * @returns true if destinations are within 500m of each other
 */
export function destinationsMatch(dest1: Coordinates, dest2: Coordinates): boolean {
  const distance = haversineDistance(dest1, dest2);
  return distance <= 500; // 500 meters threshold
}

/**
 * Check if a user is within the 2km radius
 * @param myLocation - Current user's location
 * @param otherLocation - Other user's location
 * @returns true if within 2km radius
 */
export function isWithinRadius(myLocation: Coordinates, otherLocation: Coordinates): boolean {
  const distance = haversineDistance(myLocation, otherLocation);
  return distance <= 2000; // 2km radius
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.5 km" or "500 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Calculate bearing between two points (for heading/direction)
 * @param from - Starting coordinate
 * @param to - Ending coordinate
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(x, y);
  return ((bearing * 180) / Math.PI + 360) % 360;
}
