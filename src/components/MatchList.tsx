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

  .match-list-loading,
  .match-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: #64748b;
  }

  .match-list-loading .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 28px;
  }

  .match-list-empty p {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #334155;
  }

  .match-list-empty small {
    color: #94a3b8;
    font-size: 13px;
  }

  .match-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin: 8px 0;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    animation: fadeInUp 0.3s ease forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .match-item:nth-child(1) { animation-delay: 0.05s; }
  .match-item:nth-child(2) { animation-delay: 0.1s; }
  .match-item:nth-child(3) { animation-delay: 0.15s; }
  .match-item:nth-child(4) { animation-delay: 0.2s; }
  .match-item:nth-child(5) { animation-delay: 0.25s; }

  .match-item:hover {
    background: white;
    border-color: #93c5fd;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }

  .match-item.near {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #86efac;
  }

  .match-item.near:hover {
    border-color: #4ade80;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
  }

  .match-item.far {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .match-info {
    flex: 1;
    min-width: 0;
  }

  .match-name {
    font-weight: 600;
    font-size: 15px;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .near-badge {
    font-size: 10px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .match-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .distance, .destination, .phone {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .distance {
    color: #1d4ed8;
    font-weight: 500;
  }

  .chat-button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chat-button:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
  }
`;

export default MatchList;
