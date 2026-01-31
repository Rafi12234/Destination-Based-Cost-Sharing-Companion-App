/**
 * Match List Component
 * Displays list of matched users sorted by distance
 * Shows name, distance zone status, and chat button
 */

import React from 'react';
import { MatchedUser } from '@/types/models';
import { formatDistance } from '@/utils/geo';

// Distance zone types
type DistanceZone = 'very-close' | 'far' | 'very-far';

const getDistanceZone = (distance: number): DistanceZone => {
  if (distance <= 500) return 'very-close';
  if (distance <= 1000) return 'far';
  return 'very-far';
};

const getZoneInfo = (zone: DistanceZone) => {
  switch (zone) {
    case 'very-close': 
      return { label: 'Very Close', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)' };
    case 'far': 
      return { label: 'Far', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
    case 'very-far': 
      return { label: 'Very Far', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
  }
};

interface MatchListProps {
  matches: MatchedUser[];
  onChatClick: (uid: string) => void;
  isLoading?: boolean;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  onChatClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="match-list">
        <div className="match-list-loading">
          <span className="spinner"></span>
          <p>Finding matches...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="match-list">
        <div className="match-list-empty">
          <div className="empty-icon">🔍</div>
          <p>No matches found yet</p>
          <small>Users going to the same destination will appear here</small>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="match-list">
      <div className="match-list-header">
        <h3>🚗 Matched Riders ({matches.length})</h3>
      </div>
      
      <div className="match-list-content">
        {matches.map((match) => {
          const zone = getDistanceZone(match.distance);
          const zoneInfo = getZoneInfo(zone);
          
          return (
            <div
              key={match.uid}
              className={`match-item zone-${zone}`}
              style={{
                borderColor: zoneInfo.border,
                boxShadow: `0 0 20px ${zoneInfo.bg}`,
              }}
            >
              <div className="match-info">
                <div className="match-name">
                  {match.profile.name}
                  <span 
                    className="zone-badge"
                    style={{
                      background: `linear-gradient(135deg, ${zoneInfo.color}, ${zoneInfo.color}cc)`,
                      boxShadow: `0 2px 12px ${zoneInfo.color}60`,
                    }}
                  >
                    <span className="zone-dot" style={{ background: 'white' }}></span>
                    {zoneInfo.label}
                  </span>
                </div>
                <div className="match-details">
                  <span className="distance" style={{ color: zoneInfo.color }}>
                    📍 {formatDistance(match.distance)}
                  </span>
                  <span className="destination">🎯 {match.destination.destinationName}</span>
                  <span className="phone">📞 {match.destination.phone}</span>
                </div>
              </div>
              
              <button
                className="chat-button"
                onClick={() => onChatClick(match.uid)}
              >
                💬 Chat
              </button>
            </div>
          );
        })}
      </div>
      
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .match-list {
    background: transparent;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .match-list-header {
    display: none;
  }

  .match-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  /* Dark theme scrollbar */
  .match-list-content::-webkit-scrollbar {
    width: 6px;
  }

  .match-list-content::-webkit-scrollbar-track {
    background: #0d1b2a;
    border-radius: 3px;
  }

  .match-list-content::-webkit-scrollbar-thumb {
    background: #1e3a5f;
    border-radius: 3px;
  }

  .match-list-content::-webkit-scrollbar-thumb:hover {
    background: #2d4a6f;
  }

  .match-list-loading,
  .match-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: #94a3b8;
  }

  .match-list-loading .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #1e3a5f;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes emptyPulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }

  .empty-icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 32px;
    animation: emptyPulse 3s ease-in-out infinite;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
  }

  .match-list-empty p {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .match-list-empty small {
    color: #64748b;
    font-size: 13px;
  }

  .match-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin: 10px 0;
    border-radius: 14px;
    background: linear-gradient(135deg, #132238 0%, #1a2d47 100%);
    border: 2px solid;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: matchSlide 0.4s ease forwards;
    opacity: 0;
    position: relative;
    overflow: hidden;
  }

  .match-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.05), transparent);
    transition: left 0.5s ease;
  }

  .match-item:hover::before {
    left: 100%;
  }

  @keyframes matchSlide {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .match-item:nth-child(1) { animation-delay: 0.05s; }
  .match-item:nth-child(2) { animation-delay: 0.1s; }
  .match-item:nth-child(3) { animation-delay: 0.15s; }
  .match-item:nth-child(4) { animation-delay: 0.2s; }
  .match-item:nth-child(5) { animation-delay: 0.25s; }

  .match-item:hover {
    background: linear-gradient(135deg, #1a2d47 0%, #234569 100%);
    transform: translateY(-3px) scale(1.01);
  }

  .match-item.zone-very-close {
    background: linear-gradient(135deg, #0f2818 0%, #14532d 100%);
  }

  .match-item.zone-far {
    background: linear-gradient(135deg, #1c1a0f 0%, #422006 100%);
  }

  .match-item.zone-very-far {
    background: linear-gradient(135deg, #1f0f0f 0%, #450a0a 100%);
  }

  .match-info {
    flex: 1;
    min-width: 0;
  }

  .match-name {
    font-weight: 600;
    font-size: 16px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .zone-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .zone-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: dotPulse 1.5s ease-in-out infinite;
  }

  @keyframes dotPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.8); }
  }

  @keyframes badgePulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
  }

  .near-badge {
    font-size: 10px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: badgePulse 2s ease-in-out infinite;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
  }

  .match-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .distance, .destination, .phone {
    font-size: 13px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .distance {
    font-weight: 600;
  }

  .chat-button {
    padding: 12px 22px;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
    overflow: hidden;
  }

  .chat-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease;
  }

  .chat-button:hover::after {
    width: 200px;
    height: 200px;
  }

  .chat-button:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }

  .chat-button:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export default MatchList;
