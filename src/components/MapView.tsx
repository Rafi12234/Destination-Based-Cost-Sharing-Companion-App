/**
 * Map View Component
 * Renders Leaflet map with OpenStreetMap tiles
 * Shows user location, matched users as markers, and 2km radius circle
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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

// Custom marker icons
const createCustomIcon = (color: string, isNear: boolean) => {
  const size = isNear ? 40 : 30;
  const opacity = isNear ? 1 : 0.6;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        opacity: ${opacity};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
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
  // Default center (will be updated when location is available)
  const defaultCenter: Coordinates = myLocation || { lat: 40.7128, lng: -74.006 };
  
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
        
        {/* 2km radius circle (shows when online) */}
        {isOnline && myLocation && (
          <Circle
            center={[myLocation.lat, myLocation.lng]}
            radius={2000}
            pathOptions={{
              color: '#4CAF50',
              fillColor: '#4CAF50',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '10, 5',
            }}
          />
        )}
        
        {/* Matched user markers (shows nearby users) */}
        {matchedUsers.map((match) =>
            match.destination ? (
              <AnimatedMarker
                key={match.uid}
                position={{ lat: match.destination.currentLat, lng: match.destination.currentLng }}
                icon={createCustomIcon(match.isNear ? '#4CAF50' : '#9E9E9E', match.isNear)}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{match.profile.name}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      📍 {formatDistance(match.distance)}
                    </span>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      🎯 {match.destination.destinationName}
                    </span>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      📞 {match.destination.phone}
                    </span>
                    <br />
                    <button
                      onClick={() => onUserClick?.(match.uid)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      💬 Chat
                    </button>
                  </div>
                </Popup>
              </AnimatedMarker>
            ) : null
          )}
      </MapContainer>
      
      <style>{`
        .map-view {
          height: 100%;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-container {
          font-family: inherit;
        }
        
        .custom-marker,
        .my-location-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default MapView;
