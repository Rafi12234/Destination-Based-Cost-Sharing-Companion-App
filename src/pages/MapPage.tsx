/**
 * Map Page Component
 * Main screen after login - handles ride matching functionality
 * Shows map, destination search, online/offline toggle, and matched users
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { signOut, onAuthChange } from '@/firebase/auth';
import {
  getUserProfile,
  createOrUpdateTrip,
  deactivateUserTrips,
  subscribeToActiveTripsByGender,
  getOrCreateChat,
  getUserProfiles,
} from '@/firebase/firestore';
import {
  publishLiveLocation,
  removeLiveLocation,
  subscribeMultipleLiveLocations,
} from '@/firebase/rtdb';
import MapView from '@/components/MapView';
import DestinationSearch from '@/components/DestinationSearch';
import OnlineToggle from '@/components/OnlineToggle';
import MatchList from '@/components/MatchList';
import { UserProfile, Coordinates, Trip, MatchedUser } from '@/types/models';
import { haversineDistance, destinationsMatch } from '@/utils/geo';

const MapPage: React.FC = () => {
  const navigate = useNavigate();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Location state
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Destination state
  const [destinationName, setDestinationName] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);

  // Online/Offline state
  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [_currentTripId, setCurrentTripId] = useState<string | null>(null);

  // Matched users state
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Refs for cleanup
  const watchIdRef = useRef<number | null>(null);
  const tripsUnsubscribeRef = useRef<(() => void) | null>(null);
  const liveLocationsUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastLocationRef = useRef<Coordinates | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // ============ AUTH EFFECT ============
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Fetch user profile
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Profile not found - redirect to register
          console.error('User profile not found');
          navigate('/register');
        }
      } else {
        // Not logged in - redirect to login
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // ============ INITIAL LOCATION ============
  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMyLocation(coords);
          lastLocationRef.current = coords;
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(getGeolocationErrorMessage(error));
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // ============ CLEANUP ON UNMOUNT ============
  useEffect(() => {
    return () => {
      // Cleanup all subscriptions and watchers
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (tripsUnsubscribeRef.current) {
        tripsUnsubscribeRef.current();
      }
      if (liveLocationsUnsubscribeRef.current) {
        liveLocationsUnsubscribeRef.current();
      }
    };
  }, []);

  // ============ DESTINATION SELECTION ============
  const handleDestinationSelect = (name: string, coords: Coordinates) => {
    setDestinationName(name);
    setDestinationCoords(coords);
  };

  // ============ GO ONLINE ============
  const goOnline = async () => {
    if (!user || !userProfile || !destinationCoords || !myLocation) {
      return;
    }

    setIsTogglingOnline(true);
    setIsLoadingMatches(true);

    try {
      // 1. Create/update trip in Firestore
      const tripId = await createOrUpdateTrip({
        uid: user.uid,
        gender: userProfile.gender,
        destinationName: destinationName,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        status: 'active',
        updatedAt: Date.now(),
        createdAt: Date.now(),
      });
      setCurrentTripId(tripId);

      // 2. Publish initial live location to Realtime DB
      await publishLiveLocation(user.uid, {
        lat: myLocation.lat,
        lng: myLocation.lng,
        heading: null,
        updatedAt: Date.now(),
        tripId: tripId,
        isOnline: true,
        gender: userProfile.gender,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
      });

      // 3. Start GPS watch for continuous location updates
      startLocationWatch(tripId);

      // 4. Subscribe to active trips with same gender
      subscribeToMatches();

      setIsOnline(true);
    } catch (error) {
      console.error('Error going online:', error);
      alert('Failed to go online. Please try again.');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  // ============ GO OFFLINE ============
  const goOffline = async () => {
    if (!user) return;

    setIsTogglingOnline(true);

    try {
      // 1. Stop GPS watcher
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // 2. Remove live location from Realtime DB
      await removeLiveLocation(user.uid);

      // 3. Deactivate trip in Firestore
      await deactivateUserTrips(user.uid);

      // 4. Unsubscribe from trips listener
      if (tripsUnsubscribeRef.current) {
        tripsUnsubscribeRef.current();
        tripsUnsubscribeRef.current = null;
      }

      // 5. Unsubscribe from live locations listener
      if (liveLocationsUnsubscribeRef.current) {
        liveLocationsUnsubscribeRef.current();
        liveLocationsUnsubscribeRef.current = null;
      }

      // 6. Clear state
      setMatchedUsers([]);
      setCurrentTripId(null);
      setIsOnline(false);
    } catch (error) {
      console.error('Error going offline:', error);
      alert('Failed to go offline. Please try again.');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  // ============ TOGGLE ONLINE/OFFLINE ============
  const handleToggleOnline = () => {
    if (isOnline) {
      goOffline();
    } else {
      // Validate before going online
      if (!destinationCoords) {
        alert('Please select a destination first.');
        return;
      }
      if (!myLocation) {
        alert('Waiting for your location. Please allow location access.');
        return;
      }
      goOnline();
    }
  };

  // ============ LOCATION WATCH ============
  const startLocationWatch = (tripId: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setMyLocation(newLocation);

        // Check if we should publish update (moved > 10m or 2+ seconds elapsed)
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        const distanceMoved = lastLocationRef.current
          ? haversineDistance(lastLocationRef.current, newLocation)
          : Infinity;

        if (distanceMoved > 10 || timeSinceLastUpdate > 2000) {
          // Publish location update
          if (user && userProfile && destinationCoords) {
            try {
              await publishLiveLocation(user.uid, {
                lat: newLocation.lat,
                lng: newLocation.lng,
                heading: position.coords.heading,
                updatedAt: now,
                tripId: tripId,
                isOnline: true,
                gender: userProfile.gender,
                destinationLat: destinationCoords.lat,
                destinationLng: destinationCoords.lng,
              });
            } catch (error) {
              console.error('Error publishing location:', error);
            }
          }

          lastLocationRef.current = newLocation;
          lastUpdateTimeRef.current = now;
        }

        // Update distances for matched users
        updateMatchedUsersDistances(newLocation);
      },
      (error) => {
        console.error('Watch position error:', error);
        setLocationError(getGeolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  // ============ SUBSCRIBE TO MATCHES ============
  const subscribeToMatches = () => {
    if (!userProfile || !destinationCoords) return;

    // Unsubscribe from previous listeners
    if (tripsUnsubscribeRef.current) {
      tripsUnsubscribeRef.current();
    }
    if (liveLocationsUnsubscribeRef.current) {
      liveLocationsUnsubscribeRef.current();
    }

    // Subscribe to active trips with same gender
    tripsUnsubscribeRef.current = subscribeToActiveTripsByGender(
      userProfile.gender,
      async (trips) => {
        // Filter trips:
        // 1. Not my own trip
        // 2. Destination matches (within 500m)
        const matchingTrips = trips.filter((trip) => {
          if (trip.uid === user?.uid) return false;

          const tripDestination: Coordinates = {
            lat: trip.destinationLat,
            lng: trip.destinationLng,
          };

          return destinationsMatch(destinationCoords, tripDestination);
        });

        if (matchingTrips.length === 0) {
          setMatchedUsers([]);
          setIsLoadingMatches(false);

          // Unsubscribe from live locations
          if (liveLocationsUnsubscribeRef.current) {
            liveLocationsUnsubscribeRef.current();
            liveLocationsUnsubscribeRef.current = null;
          }
          return;
        }

        // Fetch user profiles for matching trips
        const uids = matchingTrips.map((t) => t.uid);
        const profiles = await getUserProfiles(uids);

        // Create a map of trips by uid
        const tripsByUid = new Map<string, Trip>();
        matchingTrips.forEach((trip) => {
          tripsByUid.set(trip.uid, trip);
        });

        // Initialize matched users without live locations
        const initialMatches: MatchedUser[] = uids
          .filter((uid) => profiles.has(uid))
          .map((uid) => ({
            uid,
            profile: profiles.get(uid)!,
            trip: tripsByUid.get(uid)!,
            liveLocation: null,
            distance: Infinity,
            isNear: false,
          }));

        setMatchedUsers(initialMatches);

        // Subscribe to live locations of matched users
        if (liveLocationsUnsubscribeRef.current) {
          liveLocationsUnsubscribeRef.current();
        }

        liveLocationsUnsubscribeRef.current = subscribeMultipleLiveLocations(
          uids,
          (uid, location) => {
            setMatchedUsers((prev) => {
              return prev.map((match) => {
                if (match.uid === uid) {
                  const distance =
                    location && myLocation
                      ? haversineDistance(myLocation, { lat: location.lat, lng: location.lng })
                      : Infinity;

                  return {
                    ...match,
                    liveLocation: location,
                    distance,
                    isNear: distance <= 2000,
                  };
                }
                return match;
              });
            });
          }
        );

        setIsLoadingMatches(false);
      }
    );
  };

  // ============ UPDATE MATCHED USERS DISTANCES ============
  const updateMatchedUsersDistances = (myNewLocation: Coordinates) => {
    setMatchedUsers((prev) => {
      return prev
        .map((match) => {
          if (match.liveLocation) {
            const distance = haversineDistance(myNewLocation, {
              lat: match.liveLocation.lat,
              lng: match.liveLocation.lng,
            });
            return {
              ...match,
              distance,
              isNear: distance <= 2000,
            };
          }
          return match;
        })
        .sort((a, b) => a.distance - b.distance); // Sort by distance
    });
  };

  // ============ CHAT CLICK HANDLER ============
  const handleChatClick = async (otherUid: string) => {
    if (!user) return;

    try {
      const chatId = await getOrCreateChat(user.uid, otherUid);
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  // ============ SIGN OUT ============
  const handleSignOut = async () => {
    try {
      // Go offline first
      if (isOnline) {
        await goOffline();
      }
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ============ HELPER: GEOLOCATION ERROR MESSAGE ============
  const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location permissions.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An error occurred while getting your location.';
    }
  };

  // Sort matched users by distance
  const sortedMatches = [...matchedUsers].sort((a, b) => a.distance - b.distance);

  return (
    <div className="map-page">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <h1>🚗 RideSplit Match</h1>
          {userProfile && (
            <span className="user-info">
              👤 {userProfile.name} ({userProfile.gender})
            </span>
          )}
        </div>
        <div className="top-bar-right">
          <button onClick={handleSignOut} className="sign-out-btn">
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* Controls Bar */}
      <div className="controls-bar">
        <DestinationSearch
          onDestinationSelect={handleDestinationSelect}
          disabled={isOnline}
          selectedDestination={destinationName}
        />
        <OnlineToggle
          isOnline={isOnline}
          onToggle={handleToggleOnline}
          disabled={!myLocation || (!isOnline && !destinationCoords)}
          isLoading={isTogglingOnline}
        />
      </div>

      {/* Error Messages */}
      {locationError && (
        <div className="error-banner">
          ⚠️ {locationError}
        </div>
      )}

      {/* Status Indicator */}
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Online - Sharing your location' : '🔴 Offline - Location hidden'}
        {isOnline && destinationName && (
          <span className="destination-display">📍 Going to: {destinationName}</span>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Map */}
        <div className="map-container">
          <MapView
            myLocation={myLocation}
            isOnline={isOnline}
            matchedUsers={sortedMatches}
            onUserClick={handleChatClick}
          />
        </div>

        {/* Side Panel - Match List */}
        <div className="side-panel">
          {isOnline ? (
            <MatchList
              matches={sortedMatches}
              onChatClick={handleChatClick}
              isLoading={isLoadingMatches}
            />
          ) : (
            <div className="offline-message">
              <span className="offline-icon">🔒</span>
              <h3>You're Offline</h3>
              <p>Go online to see other riders heading to the same destination.</p>
              <ol>
                <li>Enter your destination above</li>
                <li>Click "Go Online"</li>
                <li>See matched riders!</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .map-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f5f5;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .top-bar-left h1 {
          margin: 0;
          font-size: 20px;
        }

        .user-info {
          font-size: 14px;
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .sign-out-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .sign-out-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .controls-bar {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .error-banner {
          padding: 12px 20px;
          background: #ffebee;
          color: #c62828;
          font-size: 14px;
          text-align: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-indicator.online {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-indicator.offline {
          background: #fafafa;
          color: #757575;
        }

        .destination-display {
          font-weight: normal;
          opacity: 0.8;
        }

        .main-content {
          display: flex;
          flex: 1;
          gap: 16px;
          padding: 16px 20px;
          overflow: hidden;
        }

        .map-container {
          flex: 2;
          min-width: 0;
        }

        .side-panel {
          flex: 1;
          min-width: 280px;
          max-width: 350px;
        }

        .offline-message {
          background: white;
          border-radius: 12px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .offline-icon {
          font-size: 48px;
        }

        .offline-message h3 {
          margin: 16px 0 8px;
          color: #333;
        }

        .offline-message p {
          color: #666;
          margin: 0 0 20px;
          font-size: 14px;
        }

        .offline-message ol {
          text-align: left;
          color: #555;
          font-size: 14px;
          margin: 0;
          padding-left: 24px;
        }

        .offline-message li {
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .main-content {
            flex-direction: column;
          }

          .side-panel {
            max-width: none;
            max-height: 200px;
          }

          .controls-bar {
            flex-direction: column;
          }

          .top-bar-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default MapPage;
