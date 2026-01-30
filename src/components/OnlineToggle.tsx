/**
 * Online Toggle Component
 * Button to go Online/Offline for ride matching
 */

import React from 'react';

interface OnlineToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const OnlineToggle: React.FC<OnlineToggleProps> = ({
  isOnline,
  onToggle,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      className={`online-toggle ${isOnline ? 'online' : 'offline'} ${isLoading ? 'loading' : ''}`}
    >
      {isLoading ? (
        '⏳ Processing...'
      ) : isOnline ? (
        <>🔴 Go Offline</>
      ) : (
        <>🟢 Go Online</>
      )}

      <style>{`
        .online-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-width: 160px;
        }

        .online-toggle.offline {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .online-toggle.offline:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .online-toggle.online {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .online-toggle.online:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .online-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .online-toggle.loading {
          position: relative;
          pointer-events: none;
        }

        .online-toggle.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default OnlineToggle;
