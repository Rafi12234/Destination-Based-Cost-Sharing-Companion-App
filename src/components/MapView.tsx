/**
 * Map View Component
 * Renders Leaflet map with OpenStreetMap tiles
 * Shows user location, matched users as markers, and 2km radius circle
 * Supports route display when clicking on matched users
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MatchedUser, Coordinates } from '@/types/models';
import { formatDistance } from '@/utils/geo';

// Fix for default marker icons in React-Leaflet
// Use CDN URLs for marker icons to avoid module resolution issues
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Distance zone types and colors
type DistanceZone = 'very-close' | 'far' | 'very-far';

const getDistanceZone = (distance: number): DistanceZone => {
  if (distance <= 500) return 'very-close';
  if (distance <= 1000) return 'far';
  return 'very-far';
};

const getZoneColor = (zone: DistanceZone): string => {
  switch (zone) {
    case 'very-close': return '#22c55e'; // Green
    case 'far': return '#f59e0b'; // Orange/Amber
    case 'very-far': return '#ef4444'; // Red
  }
};

const getZoneLabel = (zone: DistanceZone): string => {
  switch (zone) {
    case 'very-close': return 'Very Close';
    case 'far': return 'Far';
    case 'very-far': return 'Very Far';
  }
};

// Custom marker icons
const createCustomIcon = (color: string, isHighlighted: boolean, zone: DistanceZone) => {
  const baseSize = zone === 'very-close' ? 44 : zone === 'far' ? 38 : 32;
  const size = isHighlighted ? baseSize + 6 : baseSize;
  const opacity = zone === 'very-close' ? 1 : zone === 'far' ? 0.85 : 0.7;
  const glowSize = zone === 'very-close' ? '0 0 20px' : zone === 'far' ? '0 0 12px' : '0 0 8px';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: ${glowSize} ${color}80, 0 4px 12px rgba(0,0,0,0.3);
        opacity: ${opacity};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
        transition: all 0.3s ease;
      ">🚗</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const myLocationIcon = L.divIcon({
  className: 'my-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #4285F4;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #4285F4, 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Route info interface
interface RouteInfo {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  targetUser: MatchedUser;
}

// Fetch route from OSRM (Open Source Routing Machine)
async function fetchRoute(
  from: Coordinates,
  to: Coordinates
): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

// Format duration to readable string
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Component to update map center when location changes
interface MapCenterProps {
  center: Coordinates;
  shouldRecenter: boolean;
  onRecenterComplete?: () => void;
}

const MapCenter: React.FC<MapCenterProps> = ({ center, shouldRecenter, onRecenterComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldRecenter) {
      map.flyTo([center.lat, center.lng], 16, {
        animate: true,
        duration: 1
      });
      onRecenterComplete?.();
    }
  }, [shouldRecenter, center, map, onRecenterComplete]);
  
  return null;
};

// Component to fit map bounds to show route
interface FitRouteBoundsProps {
  routeCoordinates: [number, number][] | null;
}

const FitRouteBounds: React.FC<FitRouteBoundsProps> = ({ routeCoordinates }) => {
  const map = useMap();
  
  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
    }
  }, [routeCoordinates, map]);
  
  return null;
};

// Smooth marker movement component
interface AnimatedMarkerProps {
  position: Coordinates;
  icon: L.DivIcon;
  children?: React.ReactNode;
}

const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({ position, icon, children }) => {
  const markerRef = useRef<L.Marker>(null);
  const [currentPos, setCurrentPos] = useState<Coordinates>(position);
  
  useEffect(() => {
    // Animate to new position
    const startPos = currentPos;
    const endPos = position;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const newLat = startPos.lat + (endPos.lat - startPos.lat) * easeOut;
      const newLng = startPos.lng + (endPos.lng - startPos.lng) * easeOut;
      
      setCurrentPos({ lat: newLat, lng: newLng });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [position]);
  
  return (
    <Marker position={[currentPos.lat, currentPos.lng]} icon={icon} ref={markerRef}>
      {children}
    </Marker>
  );
};

interface MapViewProps {
  myLocation: Coordinates | null;
  isOnline: boolean;
  matchedUsers: MatchedUser[];
  onUserClick?: (uid: string) => void;
  shouldRecenter?: boolean;
  onRecenterComplete?: () => void;
}

const MapView: React.FC<MapViewProps> = ({
  myLocation,
  isOnline,
  matchedUsers,
  onUserClick,
  shouldRecenter = false,
  onRecenterComplete,
}) => {
  // Route state
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // Default center (will be updated when location is available)
  const defaultCenter: Coordinates = myLocation || { lat: 40.7128, lng: -74.006 };
  
  // Handle marker click to show route
  const handleMarkerClick = async (match: MatchedUser) => {
    if (!myLocation || !match.destination) return;
    
    // If clicking the same user, clear the route
    if (activeRoute?.targetUser.uid === match.uid) {
      setActiveRoute(null);
      return;
    }
    
    setIsLoadingRoute(true);
    
    const targetLocation: Coordinates = {
      lat: match.destination.currentLat,
      lng: match.destination.currentLng,
    };
    
    const routeData = await fetchRoute(myLocation, targetLocation);
    
    if (routeData) {
      setActiveRoute({
        ...routeData,
        targetUser: match,
      });
    }
    
    setIsLoadingRoute(false);
  };
  
  // Clear route
  const clearRoute = () => {
    setActiveRoute(null);
  };
  
  return (
    <div className="map-view">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update map center when recenter is requested */}
        {myLocation && (
          <MapCenter 
            center={myLocation} 
            shouldRecenter={shouldRecenter}
            onRecenterComplete={onRecenterComplete}
          />
        )}
        
        {/* My location marker */}
        {myLocation && (
          <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationIcon}>
            <Popup>
              <strong>📍 Your Location</strong>
            </Popup>
          </Marker>
        )}
        
        {/* Distance Zone Circles (shows when online) */}
        {isOnline && myLocation && (
          <>
            {/* Very Far Zone - 2km (Red) */}
            <Circle
              center={[myLocation.lat, myLocation.lng]}
              radius={2000}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '8, 6',
              }}
            />
            {/* Far Zone - 1km (Orange) */}
            <Circle
              center={[myLocation.lat, myLocation.lng]}
              radius={1000}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6, 4',
              }}
            />
            {/* Very Close Zone - 500m (Green) */}
            <Circle
              center={[myLocation.lat, myLocation.lng]}
              radius={500}
              pathOptions={{
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.12,
                weight: 3,
              }}
            />
          </>
        )}
        
        {/* Matched user markers (shows nearby users) */}
        {matchedUsers.map((match) => {
            const zone = getDistanceZone(match.distance);
            const zoneColor = getZoneColor(zone);
            const zoneLabel = getZoneLabel(zone);
            const isHighlighted = activeRoute?.targetUser.uid === match.uid;
            
            return match.destination ? (
              <AnimatedMarker
                key={match.uid}
                position={{ lat: match.destination.currentLat, lng: match.destination.currentLng }}
                icon={createCustomIcon(
                  isHighlighted ? '#3b82f6' : zoneColor,
                  isHighlighted,
                  zone
                )}
              >
                <Popup>
                  <div style={{ textAlign: 'center', minWidth: '180px' }}>
                    <strong style={{ fontSize: '15px' }}>{match.profile.name}</strong>
                    
                    {/* Distance Status Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: `${zoneColor}20`,
                      border: `1px solid ${zoneColor}`,
                      margin: '8px 0',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: zoneColor,
                        boxShadow: `0 0 8px ${zoneColor}`,
                      }}></span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: zoneColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {zoneLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        ({formatDistance(match.distance)})
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      🎯 {match.destination.destinationName}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        📞 {match.destination.phone}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(match.destination.phone || '');
                          const btn = e.currentTarget;
                          btn.innerHTML = '✓';
                          btn.style.background = '#22c55e';
                          setTimeout(() => {
                            btn.innerHTML = '📋';
                            btn.style.background = '#64748b';
                          }, 1500);
                        }}
                        title="Copy phone number"
                        style={{
                          padding: '3px 6px',
                          background: '#64748b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          transition: 'all 0.2s',
                        }}
                      >
                        📋
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
                      <button
                        onClick={() => handleMarkerClick(match)}
                        style={{
                          padding: '6px 10px',
                          background: activeRoute?.targetUser.uid === match.uid ? '#f44336' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        {activeRoute?.targetUser.uid === match.uid ? '✕ Hide' : '🛣️ Route'}
                      </button>
                      <button
                        onClick={() => onUserClick?.(match.uid)}
                        style={{
                          padding: '6px 10px',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                </Popup>
              </AnimatedMarker>
            ) : null
          })}
        
        {/* Route polyline */}
        {activeRoute && (
          <>
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#2196F3',
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Route glow effect */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: '#64B5F6',
                weight: 10,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <FitRouteBounds routeCoordinates={activeRoute.coordinates} />
          </>
        )}
      </MapContainer>
      
      {/* Route Info Panel */}
      {activeRoute && (
        <div className="route-info-panel">
          <div className="route-info-header">
            <span className="route-info-title">🛣️ Route to {activeRoute.targetUser.profile.name}</span>
            <button className="route-close-btn" onClick={clearRoute}>✕</button>
          </div>
          <div className="route-info-stats">
            <div className="route-stat">
              <span className="route-stat-icon">📏</span>
              <span className="route-stat-value">{formatDistance(activeRoute.distance)}</span>
              <span className="route-stat-label">Distance</span>
            </div>
            <div className="route-stat">
              <span className="route-stat-icon">⏱️</span>
              <span className="route-stat-value">{formatDuration(activeRoute.duration)}</span>
              <span className="route-stat-label">Est. Time</span>
            </div>
          </div>
          <button 
            className="route-chat-btn"
            onClick={() => onUserClick?.(activeRoute.targetUser.uid)}
          >
            💬 Chat with {activeRoute.targetUser.profile.name}
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoadingRoute && (
        <div className="route-loading">
          <div className="route-loading-spinner"></div>
          <span>Finding best route...</span>
        </div>
      )}
      
      <style>{`
        .map-view {
          height: 100%;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .leaflet-container {
          font-family: inherit;
        }
        
        .custom-marker,
        .my-location-marker {
          background: transparent;
          border: none;
        }
        
        /* Route Info Panel */
        .route-info-panel {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: linear-gradient(135deg, rgba(10, 22, 40, 0.95) 0%, rgba(26, 54, 93, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          min-width: 280px;
          max-width: 90%;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .route-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .route-info-title {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .route-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .route-close-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .route-info-stats {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .route-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .route-stat-icon {
          font-size: 18px;
        }
        
        .route-stat-value {
          color: #60a5fa;
          font-size: 18px;
          font-weight: 700;
        }
        
        .route-stat-label {
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .route-chat-btn {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .route-chat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        
        /* Loading indicator */
        .route-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          background: rgba(10, 22, 40, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-size: 14px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .route-loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MapView;
