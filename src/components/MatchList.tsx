/**
 * Match List Component
 * Displays list of matched users sorted by distance
 * Shows name, distance, and chat button
 */

import React from 'react';
import { MatchedUser } from '@/types/models';
import { formatDistance } from '@/utils/geo';

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
          <span className="spinner">🔄</span>
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
          <span className="empty-icon">🔍</span>
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
        {matches.map((match) => (
          <div
            key={match.uid}
            className={`match-item ${match.isNear ? 'near' : 'far'}`}
          >
            <div className="match-info">
              <div className="match-name">
                {match.profile.name}
                {match.isNear && <span className="near-badge">Nearby</span>}
              </div>
              <div className="match-details">
                <span className="distance">📍 {formatDistance(match.distance)}</span>
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
        ))}
      </div>
      
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .match-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .match-list-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .match-list-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .match-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .match-list-loading,
  .match-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: #666;
  }

  .match-list-loading .spinner {
    font-size: 32px;
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .match-list-empty p {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 500;
  }

  .match-list-empty small {
    color: #999;
    font-size: 12px;
  }

  .match-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    margin: 4px 0;
    border-radius: 8px;
    background: #f8f9fa;
    transition: all 0.2s;
  }

  .match-item:hover {
    background: #e9ecef;
  }

  .match-item.near {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
    border-left: 3px solid #4CAF50;
  }

  .match-item.far {
    background: #f5f5f5;
    border-left: 3px solid #9e9e9e;
  }

  .match-info {
    flex: 1;
    min-width: 0;
  }

  .match-name {
    font-weight: 600;
    font-size: 14px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .near-badge {
    font-size: 10px;
    background: #4CAF50;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 500;
  }

  .match-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }

  .distance, .destination {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-button {
    padding: 8px 16px;
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .chat-button:hover {
    background: linear-gradient(135deg, #1976D2, #1565C0);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
  }
`;

export default MatchList;
