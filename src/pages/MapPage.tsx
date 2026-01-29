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
  getOrCreateChat,
  getUserProfiles,
  createDestination,
  deleteDestination,
  updateDestinationLocation,
  subscribeToDestinations,
} from '@/firebase/firestore';
import MapView from '@/components/MapView';
import DestinationSearch from '@/components/DestinationSearch';
import OnlineToggle from '@/components/OnlineToggle';
import MatchList from '@/components/MatchList';
import { UserProfile, Coordinates, MatchedUser } from '@/types/models';
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

  // Matched users state
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Refs for cleanup
  const watchIdRef = useRef<number | null>(null);
  const destinationsUnsubscribeRef = useRef<(() => void) | null>(null);
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
      if (destinationsUnsubscribeRef.current) {
        destinationsUnsubscribeRef.current();
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
      // 1. Create destination document in Firestore
      await createDestination({
        uid: user.uid,
        name: userProfile.name,
        gender: userProfile.gender,
        destinationName: destinationName,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        currentLat: myLocation.lat,
        currentLng: myLocation.lng,
        phone: userProfile.phone,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 2. Start GPS watch for continuous location updates
      startLocationWatch();

      // 3. Subscribe to destinations with same gender
      subscribeToMatchingDestinations();

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

      // 2. Delete destination document from Firestore
      await deleteDestination(user.uid);

      // 3. Unsubscribe from destinations listener
      if (destinationsUnsubscribeRef.current) {
        destinationsUnsubscribeRef.current();
        destinationsUnsubscribeRef.current = null;
      }

      // 4. Clear state
      setMatchedUsers([]);
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
  const startLocationWatch = () => {
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
          // Update location in Firestore Destination document
          if (user) {
            try {
              await updateDestinationLocation(user.uid, newLocation.lat, newLocation.lng);
            } catch (error) {
              console.error('Error updating location:', error);
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

  // ============ SUBSCRIBE TO MATCHING DESTINATIONS ============
  const subscribeToMatchingDestinations = () => {
    if (!userProfile || !destinationCoords) return;

    // Unsubscribe from previous listener
    if (destinationsUnsubscribeRef.current) {
      destinationsUnsubscribeRef.current();
    }

    // Subscribe to all destinations with same gender
    destinationsUnsubscribeRef.current = subscribeToDestinations(
      userProfile.gender,
      async (destinations) => {
        // Filter destinations:
        // 1. Not my own destination
        // 2. Destination matches (within 500m)
        // 3. User is within 2km of me
        const matchingDestinations = destinations.filter((dest) => {
          if (dest.uid === user?.uid) return false;

          const destTarget: Coordinates = {
            lat: dest.destinationLat,
            lng: dest.destinationLng,
          };

          // Check if destinations match (within 500m)
          if (!destinationsMatch(destinationCoords, destTarget)) return false;

          // Check if user is within 2km of my location
          if (myLocation) {
            const userLocation: Coordinates = {
              lat: dest.currentLat,
              lng: dest.currentLng,
            };
            const distance = haversineDistance(myLocation, userLocation);
            return distance <= 2000; // Within 2km
          }

          return false;
        });

        if (matchingDestinations.length === 0) {
          setMatchedUsers([]);
          setIsLoadingMatches(false);
          return;
        }

        // Fetch user profiles for matching destinations
        const uids = matchingDestinations.map((d) => d.uid);
        const profiles = await getUserProfiles(uids);

        // Create matched users list
        const matches: MatchedUser[] = matchingDestinations
          .filter((dest) => profiles.has(dest.uid))
          .map((dest) => {
            const userLocation: Coordinates = {
              lat: dest.currentLat,
              lng: dest.currentLng,
            };
            const distance = myLocation
              ? haversineDistance(myLocation, userLocation)
              : Infinity;

            return {
              uid: dest.uid,
              profile: profiles.get(dest.uid)!,
              destination: dest,
              distance,
              isNear: distance <= 2000,
            };
          })
          .sort((a, b) => a.distance - b.distance);

        setMatchedUsers(matches);
        setIsLoadingMatches(false);
      }
    );
  };

  // ============ UPDATE MATCHED USERS DISTANCES ============
  const updateMatchedUsersDistances = (myNewLocation: Coordinates) => {
    setMatchedUsers((prev) => {
      return prev
        .map((match) => {
          if (match.destination) {
            const distance = haversineDistance(myNewLocation, {
              lat: match.destination.currentLat,
              lng: match.destination.currentLng,
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
        {isOnline 
          ? '🟢 Online - Sharing your location & finding matches' 
          : '🔴 Offline - Go online to find nearby riders'}
        {destinationName && (
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
              <span className="offline-icon">📍</span>
              <h3>{destinationCoords ? 'Ready to Go!' : 'Enter Your Destination'}</h3>
              <p>{destinationCoords 
                ? 'Click "Go Online" to share your location and find matches.' 
                : 'Search for a destination to get started.'}</p>
              <ol>
                <li>Enter your destination above</li>
                <li>Click "Go Online"</li>
                <li>See matched riders within 2km!</li>
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
          font-size: 13px;
          text-align: center;
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
