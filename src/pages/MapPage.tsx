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
  getDestination,
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

  // Map recenter state
  const [shouldRecenterMap, setShouldRecenterMap] = useState(false);

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
          
          // Check if user has an existing destination (was online before)
          const existingDestination = await getDestination(authUser.uid);
          if (existingDestination) {
            // Restore destination state
            setDestinationName(existingDestination.destinationName);
            setDestinationCoords({
              lat: existingDestination.destinationLat,
              lng: existingDestination.destinationLng,
            });
            setIsOnline(true);
            
            // Start location watch and subscribe to matches
            startLocationWatchForRestore();
            subscribeToMatchingDestinationsForRestore(profile, {
              lat: existingDestination.destinationLat,
              lng: existingDestination.destinationLng,
            });
          }
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

      // 4. Clear all state - destination, matches, and online status
      setMatchedUsers([]);
      setDestinationName('');
      setDestinationCoords(null);
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

  // ============ RESTORE FUNCTIONS (for returning to page) ============
  const startLocationWatchForRestore = () => {
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

  const subscribeToMatchingDestinationsForRestore = (profile: UserProfile, destCoords: Coordinates) => {
    // Unsubscribe from previous listener
    if (destinationsUnsubscribeRef.current) {
      destinationsUnsubscribeRef.current();
    }

    setIsLoadingMatches(true);

    // Subscribe to all destinations with same gender
    destinationsUnsubscribeRef.current = subscribeToDestinations(
      profile.gender,
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
          if (!destinationsMatch(destCoords, destTarget)) return false;

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
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo" title="RideSplit">
            <div className="logo-icon">
              <img src="https://res.cloudinary.com/dnzjg9lq8/image/upload/v1769803479/Adobe_Express_-_file_sul5xs.png" alt="RideSplit Logo" />
            </div>
            <span className="logo-text">RideSplit</span>
          </div>
        </div>
        
        <div className="header-center">
          {userProfile && (
            <div className="user-badge">
              <div className="user-avatar">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{userProfile.name}</span>
                <span className="user-gender">{userProfile.gender}</span>
              </div>
              <div className="online-indicator-wrapper">
                <span className={`online-dot ${isOnline ? 'active' : ''}`}></span>
                <span className="online-text">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="header-right">
          <button onClick={handleSignOut} className="sign-out-btn">
            <span>Sign Out</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        
        <div className="header-glow"></div>
      </header>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="controls-wrapper">
          <div className="search-wrapper">
            <div className="search-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Destination</span>
            </div>
            <DestinationSearch
              onDestinationSelect={handleDestinationSelect}
              disabled={isOnline}
              selectedDestination={destinationName}
            />
          </div>
          
          <div className="toggle-wrapper">
            <OnlineToggle
              isOnline={isOnline}
              onToggle={handleToggleOnline}
              disabled={!myLocation || (!isOnline && !destinationCoords)}
              isLoading={isTogglingOnline}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className={`status-bar ${isOnline ? 'online' : 'offline'}`}>
          <div className="status-indicator">
            <span className={`status-dot ${isOnline ? 'pulse' : ''}`}></span>
            <span className="status-text">
              {isOnline 
                ? 'Online - Finding matches nearby' 
                : 'Offline - Go online to find riders'}
            </span>
          </div>
          {destinationName && (
            <div className="destination-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span>{destinationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {locationError && (
        <div className="error-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{locationError}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {/* Map Container */}
        <div className="map-wrapper">
          <MapView
            myLocation={myLocation}
            isOnline={isOnline}
            matchedUsers={sortedMatches}
            onUserClick={handleChatClick}
            shouldRecenter={shouldRecenterMap}
            onRecenterComplete={() => setShouldRecenterMap(false)}
          />
          
          {/* My Location Button */}
          <button 
            className="my-location-btn"
            onClick={() => setShouldRecenterMap(true)}
            title="Go to my location"
            disabled={!myLocation}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>
          
          {/* Map Overlay Info */}
          <div className="map-overlay">
            <div className="map-info-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>2km radius</span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          {isOnline ? (
            <div className="matches-container">
              <div className="matches-header">
                <div className="matches-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <h3>Matched Riders</h3>
                </div>
                <div className="matches-count">{sortedMatches.length}</div>
              </div>
              <MatchList
                matches={sortedMatches}
                onChatClick={handleChatClick}
                isLoading={isLoadingMatches}
              />
            </div>
          ) : (
            <div className="getting-started">
              <div className="getting-started-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3>{destinationCoords ? 'Ready to Connect!' : 'Get Started'}</h3>
              <p>
                {destinationCoords 
                  ? 'Go online to find riders heading to the same destination.' 
                  : 'Enter your destination to begin finding travel companions.'}
              </p>
              
              <div className="steps">
                <div className={`step ${destinationCoords ? 'completed' : 'active'}`}>
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <span className="step-title">Enter destination</span>
                    <span className="step-desc">Search for where you're going</span>
                  </div>
                </div>
                <div className={`step ${isOnline ? 'completed' : destinationCoords ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <span className="step-title">Go online</span>
                    <span className="step-desc">Share your location</span>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <span className="step-title">Find matches</span>
                    <span className="step-desc">Connect within 2km radius</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .map-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .map-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
          pointer-events: none;
          animation: ambientShift 10s ease-in-out infinite;
        }

        @keyframes ambientShift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* ========== HEADER ========== */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%);
          box-shadow: 0 4px 24px rgba(10, 22, 40, 0.4);
          position: relative;
          z-index: 100;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
        }

        .header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
        }

        .header-glow {
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 200px;
          background: radial-gradient(ellipse, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: glowPulse 4s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }

        .header-left,
        .header-center,
        .header-right {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .header-left {
          flex: 1;
        }

        .header-center {
          flex: 2;
          justify-content: center;
        }

        .header-right {
          flex: 1;
          justify-content: flex-end;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .logo:hover {
          transform: translateX(4px);
        }

        .logo:hover .logo-icon {
          transform: rotate(10deg) scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .logo-icon::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
          z-index: 2;
        }

        .logo:hover .logo-icon::before {
          left: 100%;
        }

        .logo-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: relative;
          z-index: 1;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 20px 10px 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 60px;
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .user-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .user-badge:hover::before {
          opacity: 1;
        }

        .user-badge:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .user-avatar {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .user-badge:hover .user-avatar {
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: white;
          line-height: 1.2;
        }

        .user-gender {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: capitalize;
        }

        .online-indicator-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          margin-left: 8px;
          position: relative;
          z-index: 1;
        }

        .online-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #64748b;
          transition: all 0.3s ease;
        }

        .online-dot.active {
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
          animation: onlinePulse 2s ease-in-out infinite;
        }

        @keyframes onlinePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.15); }
        }

        .online-text {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sign-out-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .sign-out-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .sign-out-btn:hover::before {
          opacity: 1;
        }

        .sign-out-btn span,
        .sign-out-btn svg {
          position: relative;
          z-index: 1;
        }

        .sign-out-btn svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sign-out-btn:hover {
          border-color: rgba(239, 68, 68, 0.5);
          color: #fecaca;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
        }

        .sign-out-btn:hover svg {
          transform: translateX(4px);
        }

        .sign-out-btn:active {
          transform: translateY(0);
        }

        /* ========== CONTROLS SECTION ========== */
        .controls-section {
          background: linear-gradient(135deg, #132238 0%, #1e3a5f 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 50;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .controls-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          padding: 20px 24px;
        }

        .search-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .search-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #93c5fd;
        }

        .search-label svg {
          width: 16px;
          height: 16px;
          color: #60a5fa;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .toggle-wrapper {
          flex-shrink: 0;
        }

        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border-top: 1px solid rgba(59, 130, 246, 0.15);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .status-bar.online {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
          border-top-color: rgba(34, 197, 94, 0.3);
        }

        .status-bar.offline {
          background: rgba(0, 0, 0, 0.2);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #64748b;
          transition: all 0.3s ease;
        }

        .status-bar.online .status-dot {
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
        }

        .status-dot.pulse {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.1); }
        }

        .status-text {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
        }

        .status-bar.online .status-text {
          color: #4ade80;
        }

        .destination-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          font-size: 13px;
          color: #93c5fd;
          animation: tagSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes tagSlideIn {
          from { opacity: 0; transform: translateX(20px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .destination-tag svg {
          width: 14px;
          height: 14px;
          color: #60a5fa;
        }

        /* ========== ERROR ALERT ========== */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.15) 100%);
          border-bottom: 1px solid rgba(239, 68, 68, 0.3);
          animation: errorSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes errorSlide {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .error-alert svg {
          width: 20px;
          height: 20px;
          color: #f87171;
          flex-shrink: 0;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .error-alert span {
          font-size: 14px;
          color: #fca5a5;
        }

        /* ========== MAIN CONTENT ========== */
        .main-content {
          display: flex;
          flex: 1;
          gap: 20px;
          padding: 20px 24px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .map-wrapper {
          flex: 2;
          min-width: 0;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 
            0 4px 30px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(59, 130, 246, 0.2),
            inset 0 0 60px rgba(0, 0, 0, 0.1);
          animation: mapFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
          transform: scale(0.98);
        }

        @keyframes mapFadeIn {
          to { opacity: 1; transform: scale(1); }
        }

        /* My Location Button */
        .my-location-btn {
          position: absolute;
          bottom: 24px;
          right: 16px;
          z-index: 1000;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.95) 100%);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(59, 130, 246, 0.4);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: btnFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          opacity: 0;
          transform: scale(0.8);
        }

        @keyframes btnFadeIn {
          to { opacity: 1; transform: scale(1); }
        }

        .my-location-btn svg {
          width: 24px;
          height: 24px;
          color: #60a5fa;
          transition: all 0.3s ease;
        }

        .my-location-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0.3) 100%);
          transform: scale(1.05);
          box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
        }

        .my-location-btn:hover:not(:disabled) svg {
          color: #93c5fd;
          transform: scale(1.1);
        }

        .my-location-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .my-location-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .map-overlay {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 1000;
        }

        .map-info-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          font-size: 13px;
          font-weight: 500;
          color: #93c5fd;
          animation: cardFloat 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
          transform: translateY(-10px);
        }

        @keyframes cardFloat {
          to { opacity: 1; transform: translateY(0); }
        }

        .map-info-card svg {
          width: 16px;
          height: 16px;
          color: #60a5fa;
          animation: spin 8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ========== SIDE PANEL ========== */
        .side-panel {
          flex: 1;
          min-width: 320px;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          animation: panelSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
          transform: translateX(30px);
        }

        @keyframes panelSlide {
          to { opacity: 1; transform: translateX(0); }
        }

        .matches-container {
          background: linear-gradient(180deg, #132238 0%, #0d1b2a 100%);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .matches-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }

        .matches-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .matches-title svg {
          width: 20px;
          height: 20px;
          color: #60a5fa;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .matches-title h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .matches-count {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          border: 1px solid rgba(59, 130, 246, 0.5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #93c5fd;
          animation: countPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes countPop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        /* ========== GETTING STARTED ========== */
        .getting-started {
          background: linear-gradient(180deg, #132238 0%, #0d1b2a 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 40px 28px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .getting-started-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        .getting-started-icon svg {
          width: 32px;
          height: 32px;
          color: #60a5fa;
        }

        .getting-started h3 {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .getting-started p {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: stepFade 0.4s ease forwards;
          opacity: 0;
          transform: translateX(-20px);
        }

        .step:nth-child(1) { animation-delay: 0.1s; }
        .step:nth-child(2) { animation-delay: 0.2s; }
        .step:nth-child(3) { animation-delay: 0.3s; }

        @keyframes stepFade {
          to { opacity: 1; transform: translateX(0); }
        }

        .step.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateX(4px);
        }

        .step.completed {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
          border-color: rgba(34, 197, 94, 0.4);
        }

        .step-number {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .step.active .step-number {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);
          animation: numberGlow 2s ease-in-out infinite;
        }

        @keyframes numberGlow {
          0%, 100% { box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 4px 25px rgba(59, 130, 246, 0.8); }
        }

        .step.completed .step-number {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .step-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .step-desc {
          font-size: 12px;
          color: #94a3b8;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1024px) {
          .main-content {
            flex-direction: column;
          }

          .side-panel {
            max-width: none;
            max-height: 280px;
          }

          .map-wrapper {
            flex: none;
            height: 50vh;
          }
        }

        @media (max-width: 900px) {
          .header {
            padding: 12px 20px;
          }

          .header-left {
            flex: 0;
          }

          .header-center {
            flex: 1;
          }

          .logo-text {
            display: none;
          }

          .user-badge {
            padding: 8px 16px 8px 8px;
            gap: 12px;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .user-name {
            font-size: 14px;
          }

          .online-indicator-wrapper {
            padding: 5px 10px;
          }
        }

        @media (max-width: 768px) {
          .header {
            padding: 10px 16px;
          }

          .user-details {
            display: none;
          }

          .online-indicator-wrapper {
            margin-left: 0;
          }

          .controls-wrapper {
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }

          .toggle-wrapper {
            width: 100%;
          }

          .main-content {
            padding: 12px;
          }

          .side-panel {
            min-width: 0;
          }

          .getting-started {
            padding: 24px 20px;
          }
        }

        @media (max-width: 480px) {
          .logo-icon {
            width: 38px;
            height: 38px;
          }

          .logo-icon svg {
            width: 20px;
            height: 20px;
          }

          .user-badge {
            padding: 6px 12px 6px 6px;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 13px;
          }

          .online-text {
            display: none;
          }

          .sign-out-btn {
            padding: 10px;
          }

          .sign-out-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MapPage;
